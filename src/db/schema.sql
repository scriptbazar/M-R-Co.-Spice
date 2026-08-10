-- Database schema for Apice Spices (Homemade Spices E-commerce Website)

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'customer', -- 'customer', 'admin', 'staff'
  status TEXT DEFAULT 'active', -- 'active', 'blocked', 'deactivated'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  label TEXT NOT NULL, -- e.g., 'Home', 'Office'
  full_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  ingredients TEXT,
  how_its_made TEXT,
  spice_level INTEGER DEFAULT 0, -- 0 to 5
  category TEXT NOT NULL, -- 'Powders', 'Whole', 'Blends', 'Combos'
  images TEXT NOT NULL, -- JSON string array of image URLs/paths
  is_active INTEGER DEFAULT 1
);

-- Product Variants Table (e.g., 100g, 250g, 500g)
CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  weight_variant TEXT NOT NULL, -- e.g., '100g', '250g', '500g', '1kg'
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  type TEXT DEFAULT 'courier' -- 'courier' or 'local'
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Placed', -- 'Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'
  total_amount REAL NOT NULL,
  ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME,
  payment_method TEXT NOT NULL, -- 'Cashfree', 'Razorpay', 'PayU', 'PhonePe', 'COD'
  payment_status TEXT DEFAULT 'Pending', -- 'Pending', 'Paid', 'Failed', 'Refunded'
  address_id INTEGER NOT NULL,
  delivery_partner_id INTEGER,
  tracking_number TEXT,
  expected_delivery_date DATETIME,
  actual_delivery_date DATETIME,
  ordered_lat REAL,
  ordered_lon REAL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (address_id) REFERENCES addresses(id),
  FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  variant_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- Payments Table (Transaction History)
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  gateway TEXT NOT NULL, -- 'Cashfree', 'Razorpay', 'PayU', 'PhonePe', 'COD'
  transaction_id TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL, -- 'Success', 'Pending', 'Failed', 'Refunded'
  paid_at DATETIME,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Settings Table (for payment gateway flags, keys, store info)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pages Table (for CMS content like terms, privacy, about)
CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Alter orders table to support coupons
-- ALTER TABLE orders ADD COLUMN coupon_code TEXT;
-- ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0;

-- Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL, -- 'percentage' or 'flat'
  discount_value REAL NOT NULL,
  min_cart_amount REAL DEFAULT 0,
  max_discount REAL, -- for percentage discounts
  start_date DATETIME,
  end_date DATETIME,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
