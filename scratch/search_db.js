import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Check settings
  db.all("SELECT * FROM settings", [], (err, rows) => {
    if (err) console.error(err);
    else {
      console.log('--- SETTINGS ---');
      rows.forEach(r => {
        if (r.value && r.value.toLowerCase().includes('apice')) {
          console.log(`Setting [${r.key}]: ${r.value}`);
        }
      });
    }
  });

  // Check users
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) console.error(err);
    else {
      console.log('--- USERS ---');
      rows.forEach(r => {
        if ((r.name && r.name.toLowerCase().includes('apice')) || (r.email && r.email.toLowerCase().includes('apice'))) {
          console.log(`User [${r.id}]: Name: ${r.name}, Email: ${r.email}`);
        }
      });
    }
  });

  // Check pages
  db.all("SELECT * FROM pages", [], (err, rows) => {
    if (err) console.error(err);
    else {
      console.log('--- PAGES ---');
      rows.forEach(r => {
        if ((r.title && r.title.toLowerCase().includes('apice')) || (r.content && r.content.toLowerCase().includes('apice'))) {
          console.log(`Page [${r.slug}]: Title: ${r.title}`);
        }
      });
    }
  });
  
  // Check products
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) console.error(err);
    else {
      console.log('--- PRODUCTS ---');
      rows.forEach(r => {
        if ((r.name && r.name.toLowerCase().includes('apice')) || (r.description && r.description.toLowerCase().includes('apice'))) {
          console.log(`Product [${r.id}]: ${r.name}`);
        }
      });
    }
  });
});

db.close();
