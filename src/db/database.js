import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const dbPath = isVercel 
  ? path.join('/tmp', 'database.db')
  : path.resolve(__dirname, '../../database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    // Migration: Add status column to users table if it doesn't exist
    db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'", (err) => {
      // Error is normal if the column already exists, so we ignore it
    });
    // Migration: Add geolocation columns to orders table if they don't exist
    db.run("ALTER TABLE orders ADD COLUMN ordered_lat REAL", (err) => {});
    db.run("ALTER TABLE orders ADD COLUMN ordered_lon REAL", (err) => {});
    // Migration: Add coupon fields to orders table if they don't exist
    db.run("ALTER TABLE orders ADD COLUMN coupon_code TEXT", (err) => {});
    db.run("ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0", (err) => {});
    // Migration: Add shipping_charges column to orders table if it doesn't exist
    db.run("ALTER TABLE orders ADD COLUMN shipping_charges REAL DEFAULT 0", (err) => {});
    db.run(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating subscribers table:', err.message);
    });

    // Create audit_logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_email TEXT,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating audit_logs table:', err.message);
    });

    // Create combo_items table
    db.run(`
      CREATE TABLE IF NOT EXISTS combo_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        combo_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (combo_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating combo_items table:', err.message);
    });

    // Create coupons table
    db.run(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        min_cart_amount REAL DEFAULT 0,
        max_discount REAL,
        start_date DATETIME,
        end_date DATETIME,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating coupons table:', err.message);
      } else {
        // Seed default coupon if none exist
        db.get("SELECT COUNT(*) as count FROM coupons", [], (err, row) => {
          if (!err && row.count === 0) {
            db.run("INSERT INTO coupons (code, discount_type, discount_value, min_cart_amount, max_discount) VALUES (?, ?, ?, ?, ?)", 
              ['WELCOME10', 'percentage', 10, 200, 100]);
            db.run("INSERT INTO coupons (code, discount_type, discount_value, min_cart_amount, max_discount) VALUES (?, ?, ?, ?, ?)", 
              ['SPICE20', 'percentage', 20, 500, 200]);
            db.run("INSERT INTO coupons (code, discount_type, discount_value, min_cart_amount) VALUES (?, ?, ?, ?)", 
              ['FLAT50', 'flat', 50, 300]);
            console.log('Seeded default coupons into database.');
          }
        });
      }
    });
  }
});

// Helper functions to return promises
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('Database Run Error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Database Get Error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Database All Error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const dbExec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        console.error('Database Exec Error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export default db;
