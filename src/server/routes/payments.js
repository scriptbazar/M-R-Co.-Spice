import express from 'express';
import { dbGet, dbAll, dbRun } from '../../db/database.js';
import { authenticateToken } from './auth.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

// 1. Get List of Active Payment Gateways for Checkout Page
router.get('/gateways', async (req, res) => {
  try {
    const settings = await dbAll("SELECT key, value FROM settings WHERE key LIKE 'gateway_%'");
    
    const activeGateways = {
      Cashfree: false,
      Razorpay: false,
      PayU: false,
      PhonePe: false,
      COD: false
    };

    settings.forEach(s => {
      if (s.key === 'gateway_cashfree_active') activeGateways.Cashfree = s.value === '1';
      if (s.key === 'gateway_razorpay_active') activeGateways.Razorpay = s.value === '1';
      if (s.key === 'gateway_payu_active') activeGateways.PayU = s.value === '1';
      if (s.key === 'gateway_phonepe_active') activeGateways.PhonePe = s.value === '1';
      if (s.key === 'gateway_cod_active') activeGateways.COD = s.value === '1';
    });

    res.json(activeGateways);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve active payment gateways', details: error.message });
  }
});

// 2. Verify Payment (Simulated Webhook / Callback from Frontend Simulator)
// ─── SEC-04 FIX ─────────────────────────────────────────────────────────────
// CRITICAL: This route simulates payment gateway callbacks for local development.
// In PRODUCTION it is completely disabled — real gateway S2S webhooks must be used.
// In DEVELOPMENT a SIMULATOR_SECRET header is required so only our local payment
// simulator can call it — arbitrary users CANNOT spoof a "Success" status.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify', authenticateToken, async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // SEC-04: Block entirely in production — real gateways use their own webhook routes
  if (isProduction) {
    return res.status(403).json({
      error: 'Simulated payment verification is disabled in production. ' +
             'Use Razorpay/Cashfree/PayU webhook callbacks instead.'
    });
  }

  // SEC-04: In development, require our internal simulator secret header
  // This prevents any browser user from manually calling this endpoint
  const simulatorSecret = req.headers['x-simulator-secret'];
  const expectedSecret = process.env.SIMULATOR_SECRET || 'dev-simulator-secret-change-me';
  if (simulatorSecret !== expectedSecret) {
    return res.status(403).json({
      error: 'Unauthorized. Payment simulator secret is invalid or missing.'
    });
  }

  const { order_id, status, gateway, transaction_id } = req.body;

  if (!order_id || !status || !gateway) {
    return res.status(400).json({ error: 'Missing payment verification details' });
  }

  // Validate status — only allow known values
  const allowedStatuses = ['Success', 'Failed'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid payment status. Must be one of: ${allowedStatuses.join(', ')}` });
  }

  try {
    const order = await dbGet("SELECT * FROM orders WHERE id = ? AND user_id = ?", [order_id, req.user.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Prevent re-processing already paid orders
    if (order.payment_status === 'Paid' && status === 'Success') {
      return res.status(409).json({ error: 'Order is already marked as paid.' });
    }

    const now = new Date().toISOString();
    const mockTxnId = transaction_id || 'SIM-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    if (status === 'Success') {
      await dbRun(
        "UPDATE orders SET payment_status = 'Paid', status = 'Confirmed' WHERE id = ?",
        [order_id]
      );

      const existingPay = await dbGet("SELECT id FROM payments WHERE order_id = ?", [order_id]);
      if (existingPay) {
        await dbRun(
          "UPDATE payments SET status = 'Success', transaction_id = ?, paid_at = ? WHERE order_id = ?",
          [mockTxnId, now, order_id]
        );
      } else {
        await dbRun(
          "INSERT INTO payments (order_id, gateway, transaction_id, amount, status, paid_at) VALUES (?, ?, ?, ?, ?, ?)",
          [order_id, gateway, mockTxnId, order.total_amount, 'Success', now]
        );
      }

      res.json({ success: true, message: 'Payment successfully processed and verified. Order confirmed.' });
    } else {
      await dbRun(
        "UPDATE orders SET payment_status = 'Failed' WHERE id = ?",
        [order_id]
      );

      const existingPay = await dbGet("SELECT id FROM payments WHERE order_id = ?", [order_id]);
      if (existingPay) {
        await dbRun(
          "UPDATE payments SET status = 'Failed', transaction_id = ? WHERE order_id = ?",
          [mockTxnId, order_id]
        );
      } else {
        await dbRun(
          "INSERT INTO payments (order_id, gateway, transaction_id, amount, status) VALUES (?, ?, ?, ?, ?)",
          [order_id, gateway, mockTxnId, order.total_amount, 'Failed']
        );
      }

      res.json({ success: false, message: 'Payment marked as failed.' });
    }
  } catch (error) {
    console.error('Payment verify error:', error);
    // SEC-02: Never expose internal error details to client
    res.status(500).json({ error: 'Server error processing payment verification' });
  }
});

// 3. Create Razorpay Order
router.post('/razorpay/create-order', authenticateToken, async (req, res) => {
  const { order_id } = req.body;
  if (!order_id) return res.status(400).json({ error: 'Order ID is required' });

  try {
    // Verify order
    const order = await dbGet("SELECT * FROM orders WHERE id = ? AND user_id = ?", [order_id, req.user.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Fetch Razorpay credentials from settings
    const rzpSettings = await dbGet("SELECT value FROM settings WHERE key = 'gateway_razorpay_keys'");
    if (!rzpSettings) return res.status(500).json({ error: 'Razorpay keys not configured in Admin panel' });
    
    const keys = JSON.parse(rzpSettings.value);
    if (!keys.keyId || !keys.keySecret) return res.status(500).json({ error: 'Invalid Razorpay keys' });

    const instance = new Razorpay({ key_id: keys.keyId, key_secret: keys.keySecret });

    const options = {
      amount: Math.round(order.total_amount * 100),  // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `rcpt_${order.id}`
    };

    const razorpayOrder = await instance.orders.create(options);
    
    // Store razorpay_order_id in payments table as pending
    const now = new Date().toISOString();
    await dbRun(
      "INSERT INTO payments (order_id, gateway, transaction_id, amount, status, paid_at) VALUES (?, ?, ?, ?, ?, ?)",
      [order.id, 'Razorpay', razorpayOrder.id, order.total_amount, 'Pending', now]
    );

    res.json({
      id: razorpayOrder.id,
      currency: razorpayOrder.currency,
      amount: razorpayOrder.amount,
      keyId: keys.keyId // needed by frontend to init checkout
    });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    res.status(500).json({ error: 'Failed to create Razorpay order', details: error.message });
  }
});

// 4. Verify Razorpay Signature
router.post('/razorpay/verify', authenticateToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

  try {
    // BUG-01: Verify order belongs to the authenticated user
    const order = await dbGet("SELECT * FROM orders WHERE id = ? AND user_id = ?", [order_id, req.user.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const rzpSettings = await dbGet("SELECT value FROM settings WHERE key = 'gateway_razorpay_keys'");
    const keys = JSON.parse(rzpSettings.value);

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', keys.keySecret)
                                    .update(body.toString())
                                    .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const now = new Date().toISOString();

      // Mark order as paid
      await dbRun("UPDATE orders SET payment_status = 'Paid', status = 'Confirmed' WHERE id = ?", [order_id]);
      
      // Update payment record
      await dbRun(
        "UPDATE payments SET status = 'Success', transaction_id = ?, paid_at = ? WHERE gateway = 'Razorpay' AND order_id = ?",
        [razorpay_payment_id, now, order_id]
      );

      res.json({ success: true, message: 'Payment verified successfully.' });
    } else {
      await dbRun("UPDATE orders SET payment_status = 'Failed' WHERE id = ?", [order_id]);
      await dbRun("UPDATE payments SET status = 'Failed' WHERE gateway = 'Razorpay' AND order_id = ?", [order_id]);
      res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }
  } catch (error) {
    console.error("Razorpay Verify Error:", error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// 5. Create Cashfree Order
router.post('/cashfree/create-order', authenticateToken, async (req, res) => {
  const { order_id } = req.body;
  try {
    // Verify order belongs to the authenticated user
    const order = await dbGet("SELECT o.*, u.phone, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ? AND o.user_id = ?", [order_id, req.user.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const cfSettings = await dbGet("SELECT value FROM settings WHERE key = 'gateway_cashfree_keys'");
    const keys = JSON.parse(cfSettings.value);

    const environment = keys.mode === 'PROD' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
    const reqBody = {
      order_id: `order_${order.id}_${Date.now()}`,
      order_amount: order.total_amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `cust_${req.user.id}`,
        customer_name: order.name,
        customer_phone: order.phone || "9999999999",
        customer_email: order.email || "test@mrco.com"
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?order_id={order_id}`
      }
    };

    const response = await axios.post(`${environment}/orders`, reqBody, {
      headers: {
        "x-api-version": "2022-09-01",
        "x-client-id": keys.appId,
        "x-client-secret": keys.secretKey,
        "Content-Type": "application/json"
      }
    });

    const payment_session_id = response.data.payment_session_id;

    const now = new Date().toISOString();
    await dbRun(
      "INSERT INTO payments (order_id, gateway, transaction_id, amount, status, paid_at) VALUES (?, ?, ?, ?, ?, ?)",
      [order.id, 'Cashfree', reqBody.order_id, order.total_amount, 'Pending', now]
    );

    res.json({ payment_session_id, order_id: reqBody.order_id });
  } catch (error) {
    console.error('Cashfree create order error:', error);
    res.status(500).json({ error: 'Failed to create Cashfree order' });
  }
});


// 6. Generate PayU Hash
router.post('/payu/hash', authenticateToken, async (req, res) => {
  const { order_id } = req.body;
  try {
    // BUG-05: Verify order belongs to the authenticated user
    const order = await dbGet("SELECT o.*, u.name, u.email, u.phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ? AND o.user_id = ?", [order_id, req.user.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const settings = await dbGet("SELECT value FROM settings WHERE key = 'gateway_payu_keys'");
    const keys = JSON.parse(settings.value);

    const txnid = `txn_${order.id}_${Date.now()}`;
    const amount = order.total_amount;
    const productinfo = 'M & R Co. Order';
    const firstname = order.name;
    const email = order.email || 'support@mrco.com';

    // Hash sequence: key|txnid|amount|productinfo|firstname|email|||||||||||salt
    const hashString = `${keys.merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${keys.salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const now = new Date().toISOString();
    await dbRun(
      "INSERT INTO payments (order_id, gateway, transaction_id, amount, status, paid_at) VALUES (?, ?, ?, ?, ?, ?)",
      [order.id, 'PayU', txnid, amount, 'Pending', now]
    );

    res.json({
      key: keys.merchantKey,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone: order.phone || '9999999999',
      surl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/payu/verify`,
      furl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/payu/verify`,
      hash
    });
  } catch (err) {
    console.error('PayU hash error:', err);
    res.status(500).json({ error: 'PayU Hash generation failed' });
  }
});

// 7. PhonePe Create Pay
router.post('/phonepe/pay', authenticateToken, async (req, res) => {
  const { order_id } = req.body;
  try {
    // BUG-05: Verify order belongs to the authenticated user
    const order = await dbGet("SELECT * FROM orders WHERE id = ? AND user_id = ?", [order_id, req.user.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const settings = await dbGet("SELECT value FROM settings WHERE key = 'gateway_phonepe_keys'");
    const keys = JSON.parse(settings.value);

    const txnid = `PP_${order.id}_${Date.now()}`;
    const payloadData = {
      merchantId: keys.merchantId,
      merchantTransactionId: txnid,
      merchantUserId: `MUID_${req.user.id}`,
      amount: order.total_amount * 100,
      redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?status=success`,
      redirectMode: "REDIRECT",
      callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/phonepe/callback`,
      paymentInstrument: { type: "PAY_PAGE" }
    };

    const base64Payload = Buffer.from(JSON.stringify(payloadData)).toString('base64');
    const checksum = crypto.createHash('sha256').update(base64Payload + "/pg/v1/pay" + keys.saltKey).digest('hex') + "###" + keys.saltIndex;

    const envUrl = keys.mode === 'PROD' ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay' : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

    const response = await axios.post(envUrl, { request: base64Payload }, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      }
    });

    res.json({ redirectUrl: response.data.data.instrumentResponse.redirectInfo.url });
  } catch (err) {
    console.error('PhonePe integration error:', err);
    res.status(500).json({ error: 'PhonePe integration failed' });
  }
});

// 8. Razorpay S2S Webhook
router.post('/razorpay/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_change_me';

  try {
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    const digestBuffer = Buffer.from(digest, 'utf-8');
    const signatureBuffer = Buffer.from(signature || '', 'utf-8');

    if (digestBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Handle the webhook event
    const { event, payload } = req.body;
    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      // Find payment record
      const payment = await dbGet("SELECT * FROM payments WHERE transaction_id = ?", [razorpayOrderId]);
      if (payment) {
        const now = new Date().toISOString();
        await dbRun("UPDATE orders SET payment_status = 'Paid', status = 'Confirmed' WHERE id = ?", [payment.order_id]);
        await dbRun(
          "UPDATE payments SET status = 'Success', transaction_id = ?, paid_at = ? WHERE id = ?",
          [razorpayPaymentId, now, payment.id]
        );
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
