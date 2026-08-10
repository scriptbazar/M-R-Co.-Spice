import express from 'express';
import { dbAll, dbGet, dbRun } from '../../db/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// 1. Get All Products (with filters)
router.get('/', async (req, res) => {
  const { category, spice_level, q } = req.query;

  try {
    let sql = "SELECT * FROM products WHERE is_active = 1";
    const params = [];

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    if (spice_level !== undefined && spice_level !== '') {
      sql += " AND spice_level = ?";
      params.push(parseInt(spice_level));
    }

    if (q) {
      sql += " AND (name LIKE ? OR description LIKE ?)";
      params.push(`%${q}%`, `%${q}%`);
    }

    const products = await dbAll(sql, params);

    // Fetch and attach variants for each product
    for (const p of products) {
      p.images = JSON.parse(p.images);
      p.variants = await dbAll("SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC", [p.id]);
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// 2. Get Single Product Details (including variants and reviews)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await dbGet("SELECT * FROM products WHERE id = ?", [id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.images = JSON.parse(product.images);
    product.variants = await dbAll("SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC", [id]);
    product.reviews = await dbAll("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC", [id]);

    product.combo_items = await dbAll(`
      SELECT ci.*, p.name as product_name, p.images as product_images
      FROM combo_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.combo_id = ?
    `, [id]);

    product.combo_items.forEach(item => {
      try {
        item.product_images = JSON.parse(item.product_images);
      } catch (e) {
        item.product_images = [];
      }
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product details', details: error.message });
  }
});

// 3. Post a Review (Authenticated - checks if user bought the product)
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;
  const userName = req.user.name;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // Optional check: Verify if the user has purchased this product
    const checkPurchase = await dbGet(`
      SELECT COUNT(*) as count 
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'Delivered'
    `, [userId, id]);

    const isVerified = checkPurchase.count > 0;

    // For ease of testing, if there are no delivered orders, we'll still allow it but mark as unverified
    // Wait, the prompt says "reviews & ratings (sirf verified buyers)".
    // Let's enforce that if they don't have a delivered order for this product, we'll return an error:
    if (!isVerified) {
      return res.status(403).json({ 
        error: 'Only verified buyers can leave a review. You must have a Delivered order for this product.' 
      });
    }

    await dbRun(
      "INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [id, userId, userName, rating, comment]
    );

    res.json({ success: true, message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit review', details: error.message });
  }
});

// 4. Get active coupons (public) - Only safe display fields returned
router.get('/public/coupons', async (req, res) => {
  try {
    // BUG-02: Only expose fields needed for display, not internals
    const coupons = await dbAll(
      "SELECT code, discount_type, discount_value, min_cart_amount, max_discount, end_date FROM coupons WHERE is_active = 1 ORDER BY created_at DESC"
    );
    res.json(coupons);
  } catch (error) {
    console.error('Public coupons error:', error);
    res.status(500).json({ error: 'Failed to fetch active coupons' });
  }
});


// 5. Get top reviews for testimonials (public)
router.get('/public/testimonials', async (req, res) => {
  try {
    const testimonials = await dbAll(`
      SELECT r.*, p.name as product_name 
      FROM reviews r 
      JOIN products p ON r.product_id = p.id 
      WHERE r.rating >= 4 
      ORDER BY r.created_at DESC 
      LIMIT 3
    `);
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch testimonials', details: error.message });
  }
});

export default router;
