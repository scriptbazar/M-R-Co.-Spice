import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.db');

const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM settings", [], (err, rows) => {
  if (err) console.error(err);
  else {
    rows.forEach(r => {
      console.log(`${r.key}: ${r.value}`);
    });
  }
  db.close();
});
