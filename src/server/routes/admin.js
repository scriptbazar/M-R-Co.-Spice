import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbAll, dbGet, dbRun, dbExec } from '../../db/database.js';
import { authenticateToken, requireAdmin } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../../public/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// SEC-05: Strict image upload validation helper
// Only allow safe image formats — SVG is explicitly blocked (XSS vector)
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates a base64 image string, checks MIME type and size,
 * sanitizes filename, and writes it to the upload directory.
 * Returns the public image path on success, throws Error on failure.
 */
function validateAndSaveImage(imageBase64, imageName) {
  // Extract MIME from data URI
  const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
  if (!mimeMatch) throw new Error('Invalid image data format.');
  const mime = mimeMatch[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.includes(mime)) {
    throw new Error(`Unsupported image type "${mime}". Only JPEG, PNG, and WebP are allowed.`);
  }

  // Check decoded size
  const base64Data = imageBase64.split(',')[1];
  const approxBytes = Math.ceil((base64Data.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`Image size exceeds 5 MB limit.`);
  }

  // Sanitize filename — strip path separators and limit length
  const safeName = imageName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // only safe chars
    .replace(/\.+/g, '.') // no multiple dots (prevent .php.jpg tricks)
    .substring(0, 120);

  const extMap = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  const ext = extMap[mime];
  const filename = `${Date.now()}_${safeName}${ext}`;
  const filepath = path.join(uploadDir, filename);

  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filepath, buffer);
  return `/images/${filename}`;
}

const router = express.Router();

// Helper to log admin/staff actions
async function logAudit(req, action, details) {
  try {
    const userId = req.user ? req.user.id : null;
    const userEmail = req.user ? req.user.email : null;
    const ipAddress = req.ip || req.connection.remoteAddress;
    await dbRun(
      "INSERT INTO audit_logs (user_id, user_email, action, details, ip_address) VALUES (?, ?, ?, ?, ?)",
      [userId, userEmail, action, details, ipAddress]
    );
  } catch (err) {
    console.error('Audit Logging Error:', err);
  }
}

// 0. Get Audit Logs (Admin Only)
router.get('/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await dbAll("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 150");
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Middleware to check if user is admin or staff
const requireAdminOrStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    res.status(403).json({ error: 'Admin or Staff access required' });
  }
};

// 1. Dashboard Stats (Admin/Staff)
router.get('/dashboard-stats', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    // 1. Total Orders
    const totalOrders = await dbGet("SELECT COUNT(*) as count FROM orders");
    
    // 2. Total Revenue (only paid orders)
    const totalRevenue = await dbGet("SELECT SUM(total_amount) as sum FROM orders WHERE payment_status = 'Paid'");
    
    // 3. Pending Orders (placed, confirmed, packed, shipped)
    const pendingOrders = await dbGet(
      "SELECT COUNT(*) as count FROM orders WHERE status IN ('Placed', 'Confirmed', 'Packed', 'Shipped')"
    );

    // 4. Low-Stock Alerts (stock < 10)
    const lowStockAlerts = await dbGet(
      `SELECT COUNT(*) as count 
       FROM product_variants pv 
       JOIN products p ON pv.product_id = p.id
       WHERE pv.stock < 10 AND p.is_active = 1`
    );

    // 5. Daily Sales Graph (Last 7 Days)
    const salesGraph = await dbAll(`
      SELECT date(ordered_at) as date, SUM(total_amount) as amount, COUNT(*) as count
      FROM orders
      WHERE ordered_at >= date('now', '-7 days') AND payment_status = 'Paid'
      GROUP BY date(ordered_at)
      ORDER BY date(ordered_at) ASC
    `);

    // 6. Low stock products details
    const lowStockDetails = await dbAll(
      `SELECT p.name, pv.weight_variant, pv.stock 
       FROM product_variants pv 
       JOIN products p ON pv.product_id = p.id
       WHERE pv.stock < 10 AND p.is_active = 1`
    );

    res.json({
      metrics: {
        totalOrders: totalOrders.count || 0,
        totalRevenue: totalRevenue.sum || 0,
        pendingOrders: pendingOrders.count || 0,
        lowStock: lowStockAlerts.count || 0
      },
      graphData: salesGraph,
      lowStockDetails
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// 2. Order List (Admin/Staff)
router.get('/orders', authenticateToken, requireAdminOrStaff, async (req, res) => {
  const { status, payment_status, q } = req.query;
  try {
    let sql = `
      SELECT o.*, u.name as customer_name, u.phone as customer_phone 
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += " AND o.status = ?";
      params.push(status);
    }
    if (payment_status) {
      sql += " AND o.payment_status = ?";
      params.push(payment_status);
    }
    if (q) {
      sql += " AND (o.order_number LIKE ? OR u.name LIKE ? OR u.phone LIKE ?)";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += " ORDER BY o.ordered_at DESC";

    const orders = await dbAll(sql, params);

    for (const order of orders) {
      order.address = await dbGet("SELECT * FROM addresses WHERE id = ?", [order.address_id]);
      if (order.delivery_partner_id) {
        order.delivery_partner = await dbGet("SELECT * FROM delivery_partners WHERE id = ?", [order.delivery_partner_id]);
      }
      order.items = await dbAll(
        `SELECT oi.*, p.name as product_name, pv.weight_variant 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN product_variants pv ON oi.variant_id = pv.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
    }

    res.json(orders);
  } catch (error) {
    console.error('Admin orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// 3. Update Order Status (Admin/Staff)
router.put('/orders/:id/status', authenticateToken, requireAdminOrStaff, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Placed, Confirmed, Packed, Shipped, Delivered, Cancelled

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const order = await dbGet("SELECT * FROM orders WHERE id = ?", [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let query = "UPDATE orders SET status = ?";
    const params = [status];

    if (status === 'Delivered') {
      const now = new Date().toISOString();
      query += ", delivered_at = ?, actual_delivery_date = ?";
      params.push(now, now);
      
      // If COD, mark payment as Paid on delivery
      if (order.payment_method === 'COD') {
        query += ", payment_status = 'Paid'";
        
        // Also insert/update payment record
        const txnId = 'COD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await dbRun(
          `INSERT INTO payments (order_id, gateway, transaction_id, amount, status, paid_at) 
           VALUES (?, 'COD', ?, ?, 'Success', ?) 
           ON CONFLICT(transaction_id) DO UPDATE SET status='Success', paid_at=?`,
          [id, txnId, order.total_amount, now, now]
        );
      }
    }

    query += " WHERE id = ?";
    params.push(id);

    await dbRun(query, params);

    // If cancelled by admin/staff, restore inventory
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      const items = await dbAll("SELECT variant_id, quantity FROM order_items WHERE order_id = ?", [id]);
      for (const item of items) {
        await dbRun("UPDATE product_variants SET stock = stock + ? WHERE id = ?", [item.quantity, item.variant_id]);
      }
      await dbRun("UPDATE payments SET status = 'Refunded' WHERE order_id = ?", [id]);
      await dbRun("UPDATE orders SET payment_status = 'Refunded' WHERE id = ?", [id]);
    }

    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 4. Assign Delivery Partner (Admin/Staff)
router.put('/orders/:id/delivery', authenticateToken, requireAdminOrStaff, async (req, res) => {
  const { id } = req.params;
  const { delivery_partner_id, tracking_number } = req.body;

  if (!delivery_partner_id) {
    return res.status(400).json({ error: 'Delivery partner ID is required' });
  }

  try {
    const order = await dbGet("SELECT * FROM orders WHERE id = ?", [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order with partner, tracking, and automatically transition status to 'Shipped' if it was Confirmed/Packed
    let nextStatus = order.status;
    if (order.status === 'Confirmed' || order.status === 'Packed' || order.status === 'Placed') {
      nextStatus = 'Shipped';
    }

    await dbRun(
      "UPDATE orders SET delivery_partner_id = ?, tracking_number = ?, status = ? WHERE id = ?",
      [delivery_partner_id, tracking_number || '', nextStatus, id]
    );

    res.json({ success: true, message: 'Delivery partner assigned successfully', status: nextStatus });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign delivery partner', details: error.message });
  }
});

// 5. Get Delivery Partners List
router.get('/delivery-partners', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const partners = await dbAll("SELECT * FROM delivery_partners ORDER BY name ASC");
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delivery partners' });
  }
});

// 6. Create Delivery Partner (Admin)
router.post('/delivery-partners', authenticateToken, requireAdmin, async (req, res) => {
  const { name, contact, type } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    await dbRun(
      "INSERT INTO delivery_partners (name, contact, type) VALUES (?, ?, ?)",
      [name, contact || '', type || 'courier']
    );
    res.json({ success: true, message: 'Delivery partner added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add delivery partner' });
  }
});

// 7. Get Payment Gateway Settings (Admin Only)
router.get('/gateways', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await dbAll("SELECT key, value FROM settings WHERE key LIKE 'gateway_%'");
    
    // Structure configuration object
    const gatewaysConfig = {
      Cashfree: { active: false, keys: {} },
      Razorpay: { active: false, keys: {} },
      PayU: { active: false, keys: {} },
      PhonePe: { active: false, keys: {} },
      COD: { active: false }
    };

    settings.forEach(s => {
      if (s.key === 'gateway_cashfree_active') gatewaysConfig.Cashfree.active = s.value === '1';
      if (s.key === 'gateway_cashfree_keys') gatewaysConfig.Cashfree.keys = JSON.parse(s.value);
      
      if (s.key === 'gateway_razorpay_active') gatewaysConfig.Razorpay.active = s.value === '1';
      if (s.key === 'gateway_razorpay_keys') gatewaysConfig.Razorpay.keys = JSON.parse(s.value);
      
      if (s.key === 'gateway_payu_active') gatewaysConfig.PayU.active = s.value === '1';
      if (s.key === 'gateway_payu_keys') gatewaysConfig.PayU.keys = JSON.parse(s.value);
      
      if (s.key === 'gateway_phonepe_active') gatewaysConfig.PhonePe.active = s.value === '1';
      if (s.key === 'gateway_phonepe_keys') gatewaysConfig.PhonePe.keys = JSON.parse(s.value);

      if (s.key === 'gateway_cod_active') gatewaysConfig.COD.active = s.value === '1';
    });

    res.json(gatewaysConfig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gateway configs', details: error.message });
  }
});

// 8. Save Payment Gateway Config (Admin Only)
router.post('/gateways', authenticateToken, requireAdmin, async (req, res) => {
  const { gateway, active, keys } = req.body; // e.g. { gateway: 'Razorpay', active: true, keys: { keyId: '...', keySecret: '...' } }

  if (!gateway) {
    return res.status(400).json({ error: 'Gateway identification is required' });
  }

  const keyPrefix = `gateway_${gateway.toLowerCase()}`;
  const activeVal = active ? '1' : '0';

  try {
    // Save active toggle
    await dbRun(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?",
      [`${keyPrefix}_active`, activeVal, activeVal]
    );

    // Save keys (except for COD which doesn't have keys)
    if (gateway !== 'COD' && keys) {
      const keysJson = JSON.stringify(keys);
      await dbRun(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?",
        [`${keyPrefix}_keys`, keysJson, keysJson]
      );
    }

    await logAudit(req, 'UPDATE_GATEWAY', `Gateway ${gateway} active=${activeVal}`);
    res.json({ success: true, message: `${gateway} configuration saved successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save gateway config', details: error.message });
  }
});

// 9. Get Transaction History for settings (Admin Only)
router.get('/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const transactions = await dbAll(`
      SELECT p.*, o.order_number, u.name as customer_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      ORDER BY p.paid_at DESC
    `);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

// 10. List Products for Admin Management (Admin/Staff)
router.get('/products', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const products = await dbAll("SELECT * FROM products ORDER BY id DESC");
    for (const p of products) {
      p.images = JSON.parse(p.images);
      p.variants = await dbAll("SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC", [p.id]);
      p.combo_items = await dbAll(`
        SELECT ci.*, prod.name as product_name
        FROM combo_items ci
        JOIN products prod ON ci.product_id = prod.id
        WHERE ci.combo_id = ?
      `, [p.id]);
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin product list' });
  }
});

// 11. Add Product (Admin Only)
router.post('/products', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, ingredients, how_its_made, spice_level, category, images, variants, imageBase64, imageName, comboItems } = req.body;

  if (!name || !category || !variants || !variants.length) {
    return res.status(400).json({ error: 'Name, Category, and at least one Weight Variant are required' });
  }

  try {
    let finalImages = images || ['/images/placeholder.jpg'];
    if (imageBase64 && imageName) {
      // SEC-05: Use validated image save helper
      const imagePath = validateAndSaveImage(imageBase64, imageName);
      finalImages = [imagePath];
    }
    const imagesStr = JSON.stringify(finalImages);
    const spice = parseInt(spice_level || 0);

    const result = await dbRun(
      `INSERT INTO products (name, description, ingredients, how_its_made, spice_level, category, images, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [name, description || '', ingredients || '', how_its_made || '', spice, category, imagesStr]
    );

    const productId = result.id;

    for (const v of variants) {
      await dbRun(
        "INSERT INTO product_variants (product_id, weight_variant, price, stock) VALUES (?, ?, ?, ?)",
        [productId, v.weight_variant, parseFloat(v.price), parseInt(v.stock || 0)]
      );
    }

    if (category === 'Combos' && comboItems && Array.isArray(comboItems)) {
      for (const item of comboItems) {
        await dbRun(
          "INSERT INTO combo_items (combo_id, product_id, quantity) VALUES (?, ?, ?)",
          [productId, parseInt(item.product_id), parseInt(item.quantity) || 1]
        );
      }
    }

    await logAudit(req, 'CREATE_PRODUCT', `Created product ${name} (ID: ${productId})`);
    res.json({ success: true, productId, message: 'Product added successfully' });
  } catch (error) {
    console.error('Add product error:', error);
    // SEC-02: Return safe error message (validation errors are fine to show)
    const isValidationError = error.message && (
      error.message.includes('image type') ||
      error.message.includes('size exceeds') ||
      error.message.includes('Invalid image')
    );
    res.status(isValidationError ? 400 : 500).json({ error: isValidationError ? error.message : 'Failed to add product' });
  }
});

// 12. Edit Product & Variants (Admin Only)
router.put('/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, ingredients, how_its_made, spice_level, category, images, variants, is_active, imageBase64, imageName, comboItems } = req.body;

  try {
    // Check product exists
    const productExists = await dbGet("SELECT * FROM products WHERE id = ?", [id]);
    if (!productExists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let finalImages = images;
    if (imageBase64 && imageName) {
      // SEC-05: Use validated image save helper
      const imagePath = validateAndSaveImage(imageBase64, imageName);
      finalImages = [imagePath];
    }
    const imagesStr = finalImages ? JSON.stringify(finalImages) : productExists.images;
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : productExists.is_active;

    await dbRun(
      `UPDATE products 
       SET name = ?, description = ?, ingredients = ?, how_its_made = ?, spice_level = ?, category = ?, images = ?, is_active = ? 
       WHERE id = ?`,
      [
        name || productExists.name,
        description !== undefined ? description : productExists.description,
        ingredients !== undefined ? ingredients : productExists.ingredients,
        how_its_made !== undefined ? how_its_made : productExists.how_its_made,
        spice_level !== undefined ? parseInt(spice_level) : productExists.spice_level,
        category || productExists.category,
        imagesStr,
        activeVal,
        id
      ]
    );

    // Update variants
    if (variants && variants.length) {
      await dbRun("DELETE FROM product_variants WHERE product_id = ?", [id]);

      for (const v of variants) {
        await dbRun(
          "INSERT INTO product_variants (product_id, weight_variant, price, stock) VALUES (?, ?, ?, ?)",
          [id, v.weight_variant, parseFloat(v.price), parseInt(v.stock || 0)]
        );
      }
    }

    // Update combo items
    if (category === 'Combos' && comboItems && Array.isArray(comboItems)) {
      await dbRun("DELETE FROM combo_items WHERE combo_id = ?", [id]);
      for (const item of comboItems) {
        await dbRun(
          "INSERT INTO combo_items (combo_id, product_id, quantity) VALUES (?, ?, ?)",
          [id, parseInt(item.product_id), parseInt(item.quantity) || 1]
        );
      }
    } else {
      // If category is not Combos, clear any combo items
      await dbRun("DELETE FROM combo_items WHERE combo_id = ?", [id]);
    }

    await logAudit(req, 'UPDATE_PRODUCT', `Updated product ID ${id}`);
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Edit product error:', error);
    const isValidationError = error.message && (
      error.message.includes('image type') ||
      error.message.includes('size exceeds') ||
      error.message.includes('Invalid image')
    );
    res.status(isValidationError ? 400 : 500).json({ error: isValidationError ? error.message : 'Failed to update product' });
  }
});

// 13. Reports (Admin Only)
router.get('/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. Sales by Category
    const categorySales = await dbAll(`
      SELECT p.category, SUM(oi.quantity * oi.price) as revenue, SUM(oi.quantity) as items_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'Paid'
      GROUP BY p.category
    `);

    // 2. Sales by Product (Bestsellers)
    const productSales = await dbAll(`
      SELECT p.name, p.category, SUM(oi.quantity * oi.price) as revenue, SUM(oi.quantity) as items_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'Paid'
      GROUP BY p.id
      ORDER BY revenue DESC
    `);

    // 3. Payment Method-wise share
    const paymentSales = await dbAll(`
      SELECT payment_method, SUM(total_amount) as revenue, COUNT(*) as order_count
      FROM orders
      WHERE payment_status = 'Paid'
      GROUP BY payment_method
    `);

    res.json({
      categorySales,
      productSales,
      paymentSales
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate reports', details: error.message });
  }
});

// 14. Customers List (Admin Only)
router.get('/customers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const customers = await dbAll(`
      SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
             COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.payment_status = 'Paid'
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY total_spent DESC
    `);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer list' });
  }
});

// 15. Single Customer Detail (Admin Only)
router.get('/customers/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await dbGet(
      "SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?",
      [id]
    );
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Fetch addresses
    customer.addresses = await dbAll(
      "SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC",
      [id]
    );

    // Fetch order stats
    const stats = await dbGet(`
      SELECT COUNT(o.id) as order_count, 
             COALESCE(SUM(o.total_amount), 0) as total_spent,
             COUNT(CASE WHEN o.payment_status = 'Paid' THEN 1 END) as paid_orders
      FROM orders o WHERE o.user_id = ?
    `, [id]);

    customer.order_count = stats.order_count || 0;
    customer.total_spent = stats.total_spent || 0;
    customer.paid_orders = stats.paid_orders || 0;

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer details', details: error.message });
  }
});

// 16. Customer Orders List (Admin Only)
router.get('/customers/:id/orders', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const orders = await dbAll(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC",
      [id]
    );

    for (const order of orders) {
      // Fetch address
      order.address = await dbGet("SELECT * FROM addresses WHERE id = ?", [order.address_id]);
      
      // Fetch delivery partner
      if (order.delivery_partner_id) {
        order.delivery_partner = await dbGet("SELECT * FROM delivery_partners WHERE id = ?", [order.delivery_partner_id]);
      }
      
      // Fetch order items with product details
      order.items = await dbAll(
        `SELECT oi.*, p.name as product_name, p.images as product_images, pv.weight_variant 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN product_variants pv ON oi.variant_id = pv.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      order.items.forEach(item => {
        item.product_images = JSON.parse(item.product_images);
      });

      // Fetch payment info
      order.payment = await dbGet("SELECT * FROM payments WHERE order_id = ?", [order.id]);
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer orders', details: error.message });
  }
});

// 17. Delete Product (Admin Only)
router.delete('/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const product = await dbGet("SELECT * FROM products WHERE id = ?", [id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete variants
    await dbRun("DELETE FROM product_variants WHERE product_id = ?", [id]);
    
    // Delete reviews
    await dbRun("DELETE FROM reviews WHERE product_id = ?", [id]);

    // Delete product itself
    await dbRun("DELETE FROM products WHERE id = ?", [id]);

    await logAudit(req, 'DELETE_PRODUCT', `Deleted product ${product.name} (ID: ${id})`);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

// 18. Update Customer Status (Admin Only) - Block/Deactivate
router.put('/customers/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active', 'deactivated', 'blocked'

  if (!['active', 'deactivated', 'blocked'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const customer = await dbGet("SELECT * FROM users WHERE id = ?", [id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await dbRun("UPDATE users SET status = ? WHERE id = ?", [status, id]);
    await logAudit(req, 'UPDATE_CUSTOMER_STATUS', `Updated customer ID ${id} status to ${status}`);
    res.json({ success: true, message: `Customer account ${status} successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer status', details: error.message });
  }
});

// 19. Delete Customer (Admin Only)
router.delete('/customers/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await dbGet("SELECT * FROM users WHERE id = ?", [id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Delete addresses
    await dbRun("DELETE FROM addresses WHERE user_id = ?", [id]);

    // Delete reviews
    await dbRun("DELETE FROM reviews WHERE user_id = ?", [id]);

    // Delete order items of their orders
    await dbRun(`
      DELETE FROM order_items 
      WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)
    `, [id]);

    // Delete payments of their orders
    await dbRun(`
      DELETE FROM payments 
      WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)
    `, [id]);

    // Delete orders
    await dbRun("DELETE FROM orders WHERE user_id = ?", [id]);

    // Delete user
    await dbRun("DELETE FROM users WHERE id = ?", [id]);

    await logAudit(req, 'DELETE_CUSTOMER', `Deleted customer ${customer.email} (ID: ${id})`);
    res.json({ success: true, message: 'Customer account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer', details: error.message });
  }
});

// Helper for setting image uploads extension normalization
const mimeToExt = (mime) => {
  if (!mime) return '.png';
  const cleanMime = mime.toLowerCase();
  if (cleanMime.includes('svg')) return '.svg';
  if (cleanMime.includes('icon') || cleanMime.includes('ico')) return '.ico';
  if (cleanMime.includes('gif')) return '.gif';
  if (cleanMime.includes('jpeg') || cleanMime.includes('jpg')) return '.jpg';
  return '.png';
};

// 12. Update Global Settings (Admin Only - not staff)
router.post('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || !Array.isArray(settings)) return res.status(400).json({ error: 'Settings array is required' });

    for (const { key, value } of settings) {
      if (!key) continue;
      
      let dbValue = value;

      // Handle logo/favicon base64 upload conversion
      if (typeof value === 'string' && value.startsWith('data:image/')) {
        const matches = value.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/);
        if (matches) {
          const ext = mimeToExt(matches[1]);
          const base64Data = value.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `${key}_${Date.now()}${ext}`;
          const filepath = path.join(uploadDir, filename);
          fs.writeFileSync(filepath, buffer);
          dbValue = `/images/${filename}`;
        }
      }

      // Check if key exists
      const existing = await dbGet("SELECT * FROM settings WHERE key = ?", [key]);
      if (existing) {
        await dbRun("UPDATE settings SET value = ? WHERE key = ?", [dbValue, key]);
      } else {
        await dbRun("INSERT INTO settings (key, value) VALUES (?, ?)", [key, dbValue]);
      }
    }
    
    await logAudit(req, 'UPDATE_SETTINGS', `Updated global settings`);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 21. Get All Coupons (Admin/Staff)
router.get('/coupons', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const coupons = await dbAll("SELECT * FROM coupons ORDER BY created_at DESC");
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons', details: error.message });
  }
});

// 22. Create Coupon (Admin Only)
router.post('/coupons', authenticateToken, requireAdmin, async (req, res) => {
  const { code, discount_type, discount_value, min_cart_amount, max_discount, start_date, end_date } = req.body;
  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: 'Code, Discount Type, and Discount Value are required' });
  }

  try {
    // Check if code exists
    const existing = await dbGet("SELECT id FROM coupons WHERE code = ?", [code.trim().toUpperCase()]);
    if (existing) {
      return res.status(400).json({ error: 'A coupon with this code already exists' });
    }

    await dbRun(
      `INSERT INTO coupons (code, discount_type, discount_value, min_cart_amount, max_discount, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        code.trim().toUpperCase(),
        discount_type,
        parseFloat(discount_value),
        parseFloat(min_cart_amount || 0),
        max_discount ? parseFloat(max_discount) : null,
        start_date || null,
        end_date || null
      ]
    );

    await logAudit(req, 'CREATE_COUPON', `Created coupon ${code}`);
    res.json({ success: true, message: `Coupon "${code}" created successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create coupon', details: error.message });
  }
});

// 23. Update Coupon (Admin Only)
router.put('/coupons/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { discount_type, discount_value, min_cart_amount, max_discount, start_date, end_date } = req.body;

  try {
    const existing = await dbGet("SELECT * FROM coupons WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    await dbRun(
      `UPDATE coupons 
       SET discount_type = ?, discount_value = ?, min_cart_amount = ?, max_discount = ?, start_date = ?, end_date = ?
       WHERE id = ?`,
      [
        discount_type || existing.discount_type,
        discount_value !== undefined ? parseFloat(discount_value) : existing.discount_value,
        min_cart_amount !== undefined ? parseFloat(min_cart_amount) : existing.min_cart_amount,
        max_discount !== undefined ? (max_discount ? parseFloat(max_discount) : null) : existing.max_discount,
        start_date !== undefined ? start_date : existing.start_date,
        end_date !== undefined ? end_date : existing.end_date,
        id
      ]
    );

    await logAudit(req, 'UPDATE_COUPON', `Updated coupon ID ${id}`);
    res.json({ success: true, message: 'Coupon updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update coupon', details: error.message });
  }
});

// 24. Toggle Coupon Active Status (Admin Only)
router.patch('/coupons/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (is_active === undefined) {
    return res.status(400).json({ error: 'is_active field is required' });
  }

  try {
    const coupon = await dbGet("SELECT * FROM coupons WHERE id = ?", [id]);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    await dbRun("UPDATE coupons SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, id]);
    await logAudit(req, 'TOGGLE_COUPON', `Toggled coupon ID ${id} is_active=${is_active}`);
    res.json({ success: true, message: `Coupon active status updated to ${is_active ? 'Active' : 'Disabled'}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle coupon status', details: error.message });
  }
});

// 25. Delete Coupon (Admin Only)
router.delete('/coupons/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const coupon = await dbGet("SELECT * FROM coupons WHERE id = ?", [id]);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    await dbRun("DELETE FROM coupons WHERE id = ?", [id]);
    await logAudit(req, 'DELETE_COUPON', `Deleted coupon ${coupon.code} (ID: ${id})`);
    res.json({ success: true, message: 'Coupon code deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete coupon', details: error.message });
  }
});

export default router;
