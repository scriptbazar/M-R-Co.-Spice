import express from 'express';
import { dbAll, dbGet, dbRun } from '../../db/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Generate unique order number (e.g., MRCO-20260621-XXXX)
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randStr = Math.floor(1000 + Math.random() * 9000);
  return `MRCO-${dateStr}-${randStr}`;
};

// 1. Create Order
router.post('/', authenticateToken, async (req, res) => {
  const { items, address_id, payment_method, latitude, longitude, coupon_code, delivery_partner_id, shipping_charges } = req.body;
  const userId = req.user.id;

  if (!items || !items.length || !address_id || !payment_method) {
    return res.status(400).json({ error: 'Missing order details (items, address, or payment method)' });
  }

  try {
    // Validate address belongs to user
    const address = await dbGet("SELECT * FROM addresses WHERE id = ? AND user_id = ?", [address_id, userId]);
    if (!address) {
      return res.status(400).json({ error: 'Invalid address selected' });
    }

    // Begin manual validation & pricing calculation
    let subtotalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await dbGet("SELECT name, is_active FROM products WHERE id = ?", [item.product_id]);
      if (!product || !product.is_active) {
        return res.status(400).json({ error: `Product not available` });
      }

      const variant = await dbGet("SELECT * FROM product_variants WHERE id = ? AND product_id = ?", [item.variant_id, item.product_id]);
      if (!variant) {
        return res.status(400).json({ error: `Variant not found` });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name} (${variant.weight_variant}). Available: ${variant.stock}` });
      }

      subtotalAmount += variant.price * item.quantity;
      validatedItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: variant.price,
        weight_variant: variant.weight_variant
      });
    }

    // Process coupon code if present
    let discountAmount = 0;
    let validatedCouponCode = null;

    if (coupon_code) {
      const coupon = await dbGet("SELECT * FROM coupons WHERE code = ? AND is_active = 1", [coupon_code.trim().toUpperCase()]);
      if (coupon) {
        const now = new Date().toISOString();
        let couponValid = true;
        
        if (coupon.start_date && coupon.start_date > now) couponValid = false;
        if (coupon.end_date && coupon.end_date < now) couponValid = false;
        if (subtotalAmount < (coupon.min_cart_amount || 0)) couponValid = false;

        if (couponValid) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotalAmount * coupon.discount_value) / 100;
            if (coupon.max_discount && discountAmount > coupon.max_discount) {
              discountAmount = coupon.max_discount;
            }
          } else if (coupon.discount_type === 'flat') {
            discountAmount = coupon.discount_value;
          }
          if (discountAmount > subtotalAmount) {
            discountAmount = subtotalAmount;
          }
          validatedCouponCode = coupon.code;
        }
      }
    }

    // SEC-10: Server-side shipping validation — never trust the browser value blindly.
    // Recompute the minimum acceptable shipping charge based on our business rules:
    // - Free shipping for orders over ₹500 (subtotal after discounts)
    // - Minimum ₹30 for orders under ₹500
    // The client-sent value is accepted only if it is >= the server-calculated minimum.
    const subtotalAfterDiscount = subtotalAmount - discountAmount;
    const minAllowedShipping = subtotalAfterDiscount >= 500 ? 0 : 30;

    let finalShippingCharges;
    if (shipping_charges !== undefined && shipping_charges !== null) {
      const clientShipping = parseFloat(shipping_charges);
      // Accept client value only if it is NOT less than our minimum
      if (clientShipping < minAllowedShipping) {
        return res.status(400).json({ 
          error: `Invalid shipping charges. Minimum shipping for your order is ₹${minAllowedShipping}.` 
        });
      }
      finalShippingCharges = clientShipping;
    } else {
      // Fallback: compute a default if no shipping was provided
      finalShippingCharges = subtotalAfterDiscount >= 500 ? 0 : 49;
    }
      
    const finalTotalAmount = Math.max(0, subtotalAmount - discountAmount + finalShippingCharges);


    // Set dates
    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 5); // Default delivery in 5 days
    const orderNumber = generateOrderNumber();

    // Create order
    const result = await dbRun(
      `INSERT INTO orders (
        user_id, order_number, status, total_amount, payment_method, 
        payment_status, address_id, expected_delivery_date, ordered_lat, ordered_lon,
        coupon_code, discount_amount, delivery_partner_id, shipping_charges
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, orderNumber, 'Placed', finalTotalAmount, payment_method,
        'Pending', address_id, expectedDelivery.toISOString(),
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        validatedCouponCode,
        discountAmount,
        delivery_partner_id || null,
        finalShippingCharges
      ]
    );

    const orderId = result.id;

    // Insert order items and deduct stock
    for (const item of validatedItems) {
      await dbRun(
        "INSERT INTO order_items (order_id, product_id, variant_id, quantity, price) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.product_id, item.variant_id, item.quantity, item.price]
      );

      await dbRun(
        "UPDATE product_variants SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.variant_id]
      );
    }

    // Create entry in payments table if online payment
    if (payment_method !== 'COD') {
      const transactionId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      await dbRun(
        "INSERT INTO payments (order_id, gateway, transaction_id, amount, status) VALUES (?, ?, ?, ?, ?)",
        [orderId, payment_method, transactionId, finalTotalAmount, 'Pending']
      );
    }

    res.json({
      success: true,
      orderId,
      orderNumber,
      totalAmount: finalTotalAmount,
      discountAmount,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// 2. Get User Orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await dbAll(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC",
      [req.user.id]
    );

    for (const order of orders) {
      // Fetch Address
      order.address = await dbGet("SELECT * FROM addresses WHERE id = ?", [order.address_id]);
      // Fetch Partner
      if (order.delivery_partner_id) {
        order.delivery_partner = await dbGet("SELECT * FROM delivery_partners WHERE id = ?", [order.delivery_partner_id]);
      }
      // Fetch items with details
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
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve orders', details: error.message });
  }
});

// 3. Get Single Order Detail
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const order = await dbGet("SELECT * FROM orders WHERE id = ? AND user_id = ?", [id, req.user.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.address = await dbGet("SELECT * FROM addresses WHERE id = ?", [order.address_id]);
    
    if (order.delivery_partner_id) {
      order.delivery_partner = await dbGet("SELECT * FROM delivery_partners WHERE id = ?", [order.delivery_partner_id]);
    }

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

    // Fetch payments
    order.payment = await dbGet("SELECT * FROM payments WHERE order_id = ?", [order.id]);

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve order details', details: error.message });
  }
});

// 4. Cancel Order (Only if Placed or Confirmed)
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const order = await dbGet("SELECT * FROM orders WHERE id = ? AND user_id = ?", [id, req.user.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'Placed' && order.status !== 'Confirmed') {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }

    // Cancel order
    await dbRun("UPDATE orders SET status = 'Cancelled' WHERE id = ?", [id]);

    // Restore stock
    const items = await dbAll("SELECT variant_id, quantity FROM order_items WHERE order_id = ?", [id]);
    for (const item of items) {
      await dbRun("UPDATE product_variants SET stock = stock + ? WHERE id = ?", [item.quantity, item.variant_id]);
    }

    // If online payment, change status to refunded or failed
    await dbRun("UPDATE payments SET status = 'Refunded' WHERE order_id = ?", [id]);
    await dbRun("UPDATE orders SET payment_status = 'Refunded' WHERE id = ?", [id]);

    res.json({ success: true, message: 'Order cancelled and stock restored successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel order', details: error.message });
  }
});

// 5. Reorder
router.post('/:id/reorder', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const oldOrder = await dbGet("SELECT * FROM orders WHERE id = ? AND user_id = ?", [id, req.user.id]);
    if (!oldOrder) {
      return res.status(404).json({ error: 'Original order not found' });
    }

    const items = await dbAll("SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?", [id]);
    
    // We will return the items so that the frontend cart can load them for checkout
    // This is the most practical way to 'reorder' as it lets the customer review the cart before paying.
    res.json({
      success: true,
      items,
      message: 'Items loaded for reorder'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate reorder', details: error.message });
  }
});

// 6. Validate Coupon Code (Public)
router.post('/validate-coupon', async (req, res) => {
  const { coupon_code, cart_amount } = req.body;
  if (!coupon_code) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  try {
    const coupon = await dbGet("SELECT * FROM coupons WHERE code = ? AND is_active = 1", [coupon_code.trim().toUpperCase()]);
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code or coupon has expired' });
    }

    const now = new Date().toISOString();
    if (coupon.start_date && coupon.start_date > now) {
      return res.status(400).json({ error: 'Coupon is not active yet' });
    }
    if (coupon.end_date && coupon.end_date < now) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    const minAmount = coupon.min_cart_amount || 0;
    if (cart_amount < minAmount) {
      return res.status(400).json({ error: `This coupon requires a minimum cart amount of ₹${minAmount}` });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (cart_amount * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else if (coupon.discount_type === 'flat') {
      discount = coupon.discount_value;
    }

    if (discount > cart_amount) {
      discount = cart_amount;
    }

    res.json({
      success: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: Math.round(discount * 100) / 100,
      message: 'Coupon validated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate coupon', details: error.message });
  }
});

// Helper to parse weight strings (e.g., '250g', '1kg') to kg
const parseWeightToKg = (weightStr) => {
  if (!weightStr) return 0.25;
  const clean = weightStr.toLowerCase().trim();
  const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 0.25;
  if (clean.includes('kg')) {
    return num;
  } else if (clean.includes('g') || clean.includes('gm')) {
    return num / 1000;
  }
  return num / 1000;
};

// 7. Calculate Dynamic Shipping Rates
router.post('/calculate-shipping', authenticateToken, async (req, res) => {
  const { address_id, items, payment_method } = req.body;
  if (!address_id || !items || !items.length) {
    return res.status(400).json({ error: 'Missing address_id or cart items' });
  }

  try {
    const address = await dbGet("SELECT * FROM addresses WHERE id = ? AND user_id = ?", [address_id, req.user.id]);
    if (!address) {
      return res.status(404).json({ error: 'Selected address not found' });
    }

    // Compute total weight
    let totalWeight = 0;
    for (const item of items) {
      const variant = await dbGet("SELECT weight_variant FROM product_variants WHERE id = ?", [item.variant_id]);
      if (variant) {
        totalWeight += parseWeightToKg(variant.weight_variant) * item.quantity;
      } else {
        totalWeight += 0.25 * item.quantity;
      }
    }

    // Fetch delivery partners
    let partners = await dbAll("SELECT * FROM delivery_partners");
    if (!partners || partners.length === 0) {
      // Seed if missing
      await dbRun("INSERT INTO delivery_partners (name, contact, type) VALUES (?, ?, ?)", ['Shiprocket (Delhivery)', '+91 11 4040 4040', 'courier']);
      await dbRun("INSERT INTO delivery_partners (name, contact, type) VALUES (?, ?, ?)", ['Ramesh Kumar (Local delivery boy)', '+91 9988776655', 'local']);
      partners = await dbAll("SELECT * FROM delivery_partners");
    }

    const stateLower = address.state.toLowerCase();
    const cityLower = address.city.toLowerCase();
    const pincode = address.pincode.trim();

    // Determine if local region (Delhi NCR, Noida, parts of UP)
    const isLocalRegion = stateLower.includes('delhi') || 
                          stateLower.includes('uttar pradesh') || 
                          stateLower.includes('haryana') ||
                          pincode.startsWith('11') ||
                          pincode.startsWith('201') ||
                          pincode.startsWith('12');

    const active = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_active'");
    const isShiprocketActive = active?.value === '1';

    const options = [];
    let hasCourierOption = false;

    if (isShiprocketActive) {
      try {
        const { getShiprocketServiceability } = await import('../services/shiprocket.js');
        const isCod = payment_method === 'COD';
        const srResult = await getShiprocketServiceability(address.pincode, totalWeight, isCod);
        
        if (srResult.success && srResult.available_couriers && srResult.available_couriers.length > 0) {
          const courierPartner = partners.find(p => p.type === 'courier') || partners[0] || { id: 1 };
          srResult.available_couriers.forEach((c) => {
            options.push({
              id: courierPartner.id,
              name: `${c.courier_name} (via Shiprocket)`,
              type: 'courier',
              cost: c.rate,
              etd: c.etd,
              description: c.description || `Delivery via ${c.courier_name}`
            });
          });
          hasCourierOption = true;
        }
      } catch (err) {
        console.error('Shiprocket serviceability error, falling back to manual estimation:', err);
      }
    }

    for (const partner of partners) {
      if (partner.type === 'local') {
        // Local boy eligibility: Noida, Delhi or Pincodes starts with 201 or 110
        const isEligible = stateLower.includes('delhi') || 
                           stateLower.includes('uttar pradesh') || 
                           cityLower.includes('noida') || 
                           cityLower.includes('greater noida') ||
                           pincode.startsWith('201') ||
                           pincode.startsWith('110');
        if (isEligible) {
          options.push({
            id: partner.id,
            name: partner.name,
            type: partner.type,
            cost: 30,
            etd: '1-2 Days (Same/Next Day)',
            description: 'Fast local delivery by our store courier'
          });
        }
      } else if (!hasCourierOption) {
        // Fallback to manual Shiprocket estimation if Shiprocket was inactive/failed
        let cost = isLocalRegion ? 45 : 65;
        if (totalWeight > 0.5) {
          const extraWeight = totalWeight - 0.5;
          const extraHalfKgs = Math.ceil(extraWeight / 0.5);
          cost += extraHalfKgs * (isLocalRegion ? 20 : 30);
        }
        if (payment_method === 'COD') {
          cost += 40;
        }
        options.push({
          id: partner.id,
          name: partner.name,
          type: partner.type,
          cost: Math.round(cost),
          etd: isLocalRegion ? '2-3 Days' : '4-7 Days',
          description: `Standard delivery via ${partner.name}`
        });
      }
    }

    res.json({
      success: true,
      options,
      totalWeightKg: Math.round(totalWeight * 100) / 100
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate shipping rate', details: error.message });
  }
});

// 8. Track order shipment (Customer & Admin)
router.get('/:id/track', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const order = await dbGet("SELECT * FROM orders WHERE id = ?", [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Authorization check: either the owner of the order or an admin/staff
    if (order.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Access denied to track this order' });
    }

    if (!order.tracking_number) {
      return res.status(400).json({ error: 'Tracking number not available for this order' });
    }

    // Call service layer tracking
    const { trackShiprocketShipment } = await import('../services/shiprocket.js');
    const result = await trackShiprocketShipment(order.tracking_number);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tracking data', details: error.message });
  }
});

export default router;
