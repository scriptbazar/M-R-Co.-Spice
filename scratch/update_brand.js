import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.db');

const db = new sqlite3.Database(dbPath);

db.run("UPDATE settings SET value = ? WHERE key = 'brand_name'", ['M & R Co.'], function(err) {
  if (err) {
    console.error('Error updating brand name:', err.message);
  } else {
    console.log(`Successfully updated brand name in settings table to 'M & R Co.'. Rows affected: ${this.changes}`);
  }
  db.close();
});
