import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Update brand_name setting
  db.run("UPDATE settings SET value = ? WHERE key = 'brand_name'", ['M&R Co'], function(err) {
    if (err) console.error('Error brand_name:', err.message);
    else console.log(`settings.brand_name updated. Rows: ${this.changes}`);
  });

  // 2. Update users table emails and names
  db.run("UPDATE users SET email = REPLACE(email, '@apice.com', '@mrco.com')", function(err) {
    if (err) console.error('Error users email:', err.message);
    else console.log(`users emails updated. Rows: ${this.changes}`);
  });

  db.run("UPDATE users SET name = 'M&R Co Owner' WHERE name = 'Apice Owner'", function(err) {
    if (err) console.error('Error users name:', err.message);
    else console.log(`users name updated. Rows: ${this.changes}`);
  });

  // 3. Update CMS pages content
  db.run("UPDATE pages SET content = REPLACE(content, 'Apice Spices', 'M&R Co')", function(err) {
    if (err) console.error('Error pages content Apice Spices:', err.message);
    else console.log(`pages content Apice Spices updated. Rows: ${this.changes}`);
  });

  db.run("UPDATE pages SET content = REPLACE(content, 'Apice', 'M&R Co')", function(err) {
    if (err) console.error('Error pages content Apice:', err.message);
    else console.log(`pages content Apice updated. Rows: ${this.changes}`);
  });

  db.run("UPDATE pages SET title = REPLACE(title, 'Apice Spices', 'M&R Co')", function(err) {
    if (err) console.error('Error pages title Apice Spices:', err.message);
    else console.log(`pages title Apice Spices updated. Rows: ${this.changes}`);
  });

  db.run("UPDATE pages SET title = REPLACE(title, 'Apice', 'M&R Co')", function(err) {
    if (err) console.error('Error pages title Apice:', err.message);
    else console.log(`pages title Apice updated. Rows: ${this.changes}`);
  });
});

db.close((err) => {
  if (err) console.error('Error closing DB:', err.message);
  else console.log('Database connection closed.');
});
