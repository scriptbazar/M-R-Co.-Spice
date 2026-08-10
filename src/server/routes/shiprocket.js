import express from 'express';
import crypto from 'crypto';
import { dbGet, dbRun, dbAll } from '../../db/database.js';
import { authenticateToken, requireAdmin } from './auth.js';
import { trackShiprocketShipment, pushOrderToShiprocket } from '../services/shiprocket.js';

const router = express.Router();

// Middleware to check if user is admin or staff
const requireAdminOrStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    res.status(403).json({ error: 'Admin or Staff access required' });
  }
};

// 1. Get Shiprocket Settings (Admin/Staff)
router.get('/config', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const active = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_active'");
    const email = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_email'");
    const webhookToken = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_webhook_token'");

    res.json({
      active: active?.value === '1',
      email: email?.value || '',
      webhook_token: webhookToken?.value || ''
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve Shiprocket config', details: error.message });
  }
});

// 2. Save Shiprocket Settings (Admin Only)
router.post('/config', authenticateToken, requireAdmin, async (req, res) => {
  const { active, email, password } = req.body;
  
  if (active && (!email || (password === undefined))) {
    return res.status(400).json({ error: 'Email is required when active.' });
  }

  try {
    const activeVal = active ? '1' : '0';
    await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES ('shiprocket_active', ?)", [activeVal]);
    
    if (email !== undefined) {
      await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES ('shiprocket_email', ?)", [email]);
    }
    
    if (password && password.trim() !== '') {
      await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES ('shiprocket_password', ?)", [password]);
      // Clear token to force fresh login on next shipment query
      await dbRun("DELETE FROM settings WHERE key = 'shiprocket_token'");
      await dbRun("DELETE FROM settings WHERE key = 'shiprocket_token_expiry'");
    }

    res.json({ success: true, message: 'Shiprocket configuration saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save Shiprocket config', details: error.message });
  }
});

// 3. Regenerate Webhook Token (Admin Only)
router.post('/config/regenerate-token', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const newToken = crypto.randomBytes(16).toString('hex');
    await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES ('shiprocket_webhook_token', ?)", [newToken]);
    res.json({ success: true, token: newToken, message: 'New webhook token generated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate webhook token', details: error.message });
  }
});

// 4. Webhook Receiver Endpoint (Public, authenticated by Webhook Token)
// Supported routes: POST /webhook or POST /webhook?token=XXX
router.post('/webhook', async (req, res) => {
  const tokenQuery = req.query.token;
  const tokenHeader = req.headers['x-webhook-token'];
  const token = tokenQuery || tokenHeader;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Webhook token is missing.' });
  }

  try {
    const savedTokenRow = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_webhook_token'");
    const savedToken = savedTokenRow?.value;

    if (!savedToken || savedToken !== token) {
      return res.status(401).json({ error: 'Unauthorized: Invalid webhook token.' });
    }

    // Process Payload
    // Shiprocket payloads typically include: awb, current_status_id, current_status, order_id
    const payload = req.body;
    const { awb, current_status_id, current_status, order_id } = payload;

    if (!awb) {
      return res.status(400).json({ error: 'Missing AWB tracking code in payload.' });
    }

    console.log(`Shiprocket webhook received: AWB ${awb}, Status ID: ${current_status_id} (${current_status})`);

    // Match order by AWB (tracking_number) or fallback to order_number
    let order = await dbGet("SELECT * FROM orders WHERE tracking_number = ?", [awb]);
    if (!order && order_id) {
      order = await dbGet("SELECT * FROM orders WHERE order_number = ?", [order_id]);
    }

    if (!order) {
      return res.status(404).json({ error: `Order not found matching AWB: ${awb} or Order Number: ${order_id}` });
    }

    const currentStatusIdInt = parseInt(current_status_id);

    // Map Shiprocket Status Code to our internal Order status
    // Standard Shiprocket codes:
    // 6 = Shipped (In Transit)
    // 7 = Out for Delivery
    // 10 = Picked Up
    // 17 = Delivered
    // 12 = Cancelled
    // 18 = RTO / Returned
    let newStatus = null;
    if ([6, 7, 10].includes(currentStatusIdInt)) {
      newStatus = 'Shipped';
    } else if (currentStatusIdInt === 17) {
      newStatus = 'Delivered';
    } else if ([12, 18].includes(currentStatusIdInt)) {
      newStatus = 'Cancelled';
    }

    if (!newStatus) {
      return res.json({ success: true, message: `Ignored status code ${currentStatusIdInt}: status mapping not required.` });
    }

    // Prevent backwards transitions (e.g. Delivered shouldn't revert to Shipped/Cancelled via webhook)
    if (order.status === 'Delivered') {
      return res.json({ success: true, message: 'Order is already marked as Delivered. Status change ignored.' });
    }
    if (order.status === 'Cancelled' && newStatus !== 'Cancelled') {
      return res.json({ success: true, message: 'Order is already marked as Cancelled. Status change ignored.' });
    }

    const now = new Date().toISOString();

    if (newStatus === 'Delivered') {
      // Transition to Delivered
      await dbRun(
        "UPDATE orders SET status = ?, delivered_at = ?, actual_delivery_date = ? WHERE id = ?",
        ['Delivered', now, now, order.id]
      );

      // Handle COD Payments
      if (order.payment_method === 'COD' && order.payment_status !== 'Paid') {
        await dbRun("UPDATE orders SET payment_status = 'Paid' WHERE id = ?", [order.id]);
        
        const txnId = 'COD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await dbRun(
          `INSERT INTO payments (order_id, gateway, transaction_id, amount, status, paid_at) 
           VALUES (?, 'COD', ?, ?, 'Success', ?) 
           ON CONFLICT(transaction_id) DO UPDATE SET status='Success', paid_at=?`,
          [order.id, txnId, order.total_amount, now, now]
        );
      }
    } else if (newStatus === 'Cancelled') {
      // Transition to Cancelled
      await dbRun("UPDATE orders SET status = 'Cancelled' WHERE id = ?", [order.id]);

      // Restore Stock
      const items = await dbAll("SELECT variant_id, quantity FROM order_items WHERE order_id = ?", [order.id]);
      for (const item of items) {
        await dbRun("UPDATE product_variants SET stock = stock + ? WHERE id = ?", [item.quantity, item.variant_id]);
      }

      // Mark payment refunded if it was paid
      await dbRun("UPDATE payments SET status = 'Refunded' WHERE order_id = ?", [order.id]);
      await dbRun("UPDATE orders SET payment_status = 'Refunded' WHERE id = ?", [order.id]);
    } else {
      // Update to Shipped/other statuses
      await dbRun("UPDATE orders SET status = ? WHERE id = ?", [newStatus, order.id]);
    }

    res.json({ success: true, message: `Order status successfully updated to ${newStatus}` });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook', details: error.message });
  }
});

// 5. Retrieve Tracking Info (Admin/Staff only)
router.get('/track/:awb', authenticateToken, requireAdminOrStaff, async (req, res) => {
  const { awb } = req.params;
  
  if (!awb) {
    return res.status(400).json({ error: 'AWB tracking number is required.' });
  }

  const result = await trackShiprocketShipment(awb);
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// 6. Local Webhook Simulator (Admin only)
// Simulates Shiprocket triggering the webhook endpoint internally
router.post('/simulate-webhook', authenticateToken, requireAdmin, async (req, res) => {
  const { awb, status_id, order_id } = req.body;

  if (!awb) {
    return res.status(400).json({ error: 'AWB is required for simulation.' });
  }

  try {
    const webhookTokenRow = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_webhook_token'");
    const token = webhookTokenRow?.value;

    if (!token) {
      return res.status(500).json({ error: 'No webhook token configured in settings.' });
    }

    // Trigger local POST to webhook handler via local function context logic
    // We mock the HTTP call by calling the router's webhook logic internally.
    // Instead of initiating a real HTTP request, we can redirect the input directly to the webhook handler body.
    
    // Construct standard Shiprocket webhook payload representation
    let statusText = 'delivered';
    if (status_id === 10) statusText = 'pickup';
    else if (status_id === 6) statusText = 'shipped';
    else if (status_id === 7) statusText = 'out_for_delivery';
    else if (status_id === 12) statusText = 'cancelled';
    else if (status_id === 18) statusText = 'rto';

    const mockReq = {
      query: { token },
      headers: { 'x-webhook-token': token },
      body: {
        awb,
        current_status_id: status_id,
        current_status: statusText,
        order_id: order_id || ''
      }
    };

    // Simulate res object
    let responseStatus = 200;
    let responseData = null;
    const mockRes = {
      status: (code) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data) => {
        responseData = data;
        return mockRes;
      }
    };

    // Create a request handler helper execution
    // Express routers are technically middleware functions, but we can extract our route logic.
    // To make it easy, we just run the database logic of the webhook right here or construct the call.
    // Since we wrote the code above, we can invoke it. Let's call the internal webhook handler directly:
    
    // We will query the DB and update status exactly like the webhook does
    const savedTokenRow = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_webhook_token'");
    const savedToken = savedTokenRow?.value;

    if (!savedToken || savedToken !== token) {
      return res.status(401).json({ error: 'Unauthorized simulation: Invalid token' });
    }

    let order = await dbGet("SELECT * FROM orders WHERE tracking_number = ?", [awb]);
    if (!order && order_id) {
      order = await dbGet("SELECT * FROM orders WHERE order_number = ?", [order_id]);
    }

    if (!order) {
      return res.status(404).json({ error: `Order not found matching AWB: ${awb} or Order Number: ${order_id}` });
    }

    const currentStatusIdInt = parseInt(status_id);
    let newStatus = null;
    if ([6, 7, 10].includes(currentStatusIdInt)) {
      newStatus = 'Shipped';
    } else if (currentStatusIdInt === 17) {
      newStatus = 'Delivered';
    } else if ([12, 18].includes(currentStatusIdInt)) {
      newStatus = 'Cancelled';
    }

    if (!newStatus) {
      return res.json({ success: true, message: `Ignored status code ${currentStatusIdInt}` });
    }

    if (order.status === 'Delivered') {
      return res.json({ success: true, message: 'Order is already marked as Delivered. Ignored.' });
    }
    if (order.status === 'Cancelled' && newStatus !== 'Cancelled') {
      return res.json({ success: true, message: 'Order is already Cancelled. Ignored.' });
    }

    const now = new Date().toISOString();

    if (newStatus === 'Delivered') {
      await dbRun(
        "UPDATE orders SET status = ?, delivered_at = ?, actual_delivery_date = ? WHERE id = ?",
        ['Delivered', now, now, order.id]
      );

      if (order.payment_method === 'COD' && order.payment_status !== 'Paid') {
        await dbRun("UPDATE orders SET payment_status = 'Paid' WHERE id = ?", [order.id]);
        const txnId = 'COD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await dbRun(
          `INSERT INTO payments (order_id, gateway, transaction_id, amount, status, paid_at) 
           VALUES (?, 'COD', ?, ?, 'Success', ?) 
           ON CONFLICT(transaction_id) DO UPDATE SET status='Success', paid_at=?`,
          [order.id, txnId, order.total_amount, now, now]
        );
      }
    } else if (newStatus === 'Cancelled') {
      await dbRun("UPDATE orders SET status = 'Cancelled' WHERE id = ?", [order.id]);
      const items = await dbAll("SELECT variant_id, quantity FROM order_items WHERE order_id = ?", [order.id]);
      for (const item of items) {
        await dbRun("UPDATE product_variants SET stock = stock + ? WHERE id = ?", [item.quantity, item.variant_id]);
      }
      await dbRun("UPDATE payments SET status = 'Refunded' WHERE order_id = ?", [order.id]);
      await dbRun("UPDATE orders SET payment_status = 'Refunded' WHERE id = ?", [order.id]);
    } else {
      await dbRun("UPDATE orders SET status = ? WHERE id = ?", [newStatus, order.id]);
    }

    res.json({ success: true, message: `Simulated webhook execution success. Status updated to ${newStatus}` });
  } catch (error) {
    res.status(500).json({ error: 'Simulation failed', details: error.message });
  }
});

// 7. Create Shipment/Order in Shiprocket (Admin/Staff only)
router.post('/create-shipment', authenticateToken, requireAdminOrStaff, async (req, res) => {
  const { order_id } = req.body;
  if (!order_id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }
  try {
    const result = await pushOrderToShiprocket(order_id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shipment', details: error.message });
  }
});

export default router;
