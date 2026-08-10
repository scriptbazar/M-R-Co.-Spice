import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dbExec, dbRun, dbGet } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to hash passwords using built-in crypto module
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const initializeDatabase = async () => {
  try {
    console.log('Starting database initialization...');
    
    // Read and execute schema
    const schemaPath = path.resolve(__dirname, './schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await dbExec(schemaSql);
    console.log('Schema loaded successfully.');

    // Check if settings table is already populated (indicates it has been seeded)
    const settingsCheck = await dbGet("SELECT COUNT(*) as count FROM settings");
    
    if (settingsCheck.count === 0) {
      console.log('No data found. Seeding initial database tables...');

      // 1. Seed System Settings
      const defaultSettings = [
        ['brand_name', 'M & R Co.'],
        ['fssai_license_number', '22724999000123'],
        ['gateway_cashfree_active', '1'],
        ['gateway_cashfree_keys', JSON.stringify({ appId: 'cf_app_id_test_9238', secretKey: 'cf_secret_key_test_ab872d829103c8', mode: 'TEST' })],
        ['gateway_razorpay_active', '1'],
        ['gateway_razorpay_keys', JSON.stringify({ keyId: 'rzp_test_5jD38d82JD', keySecret: 'rzp_secret_test_23Jd8d73hS', mode: 'TEST' })],
        ['gateway_payu_active', '0'],
        ['gateway_payu_keys', JSON.stringify({ merchantKey: 'payu_key_test_123', salt: 'payu_salt_test_456', mode: 'TEST' })],
        ['gateway_phonepe_active', '0'],
        ['gateway_phonepe_keys', JSON.stringify({ merchantId: 'phonepe_mid_test_7788', saltKey: 'phonepe_salt_test_abc', saltIndex: '1', mode: 'TEST' })],
        ['gateway_cod_active', '1'],
        ['shiprocket_active', '0'],
        ['shiprocket_email', 'test@shiprocket.com'],
        ['shiprocket_password', 'password'],
        ['shiprocket_token', ''],
        ['shiprocket_token_expiry', ''],
        ['shiprocket_webhook_token', crypto.randomBytes(16).toString('hex')],
        ['social_instagram', 'https://instagram.com'],
        ['social_facebook', 'https://facebook.com'],
        ['social_twitter', 'https://twitter.com'],
        ['social_youtube', 'https://youtube.com']
      ];

      for (const [key, val] of defaultSettings) {
        await dbRun("INSERT INTO settings (key, value) VALUES (?, ?)", [key, val]);
      }
      console.log('Seeded settings.');

      // 2. Seed Users (1 Admin, 1 Customer, 1 Staff)
      const adminPass = hashPassword('admin123');
      const custPass = hashPassword('user123');
      const staffPass = hashPassword('staff123');

      // Admin
      await dbRun(
        "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
        ['M & R Co. Owner', 'admin@mrco.com', '9876543210', adminPass, 'admin']
      );
      // Staff
      await dbRun(
        "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
        ['Packer Dev', 'staff@mrco.com', '9876543211', staffPass, 'staff']
      );
      // Customer
      const customer = await dbRun(
        "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
        ['Raj Kumar', 'raj@gmail.com', '9876543212', custPass, 'customer']
      );

      // Seed Address for Customer
      await dbRun(
        "INSERT INTO addresses (user_id, label, full_address, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [customer.id, 'Home', 'H.No 404, Spice Street, Sector 62', 'Noida', 'Uttar Pradesh', '201301', 1]
      );
      await dbRun(
        "INSERT INTO addresses (user_id, label, full_address, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [customer.id, 'Office', 'Tower B, Tech Park, Sector 142', 'Noida', 'Uttar Pradesh', '201305', 0]
      );
      console.log('Seeded users and initial customer addresses.');

      // 3. Seed Delivery Partners
      const partners = [
        ['Shiprocket (Delhivery)', '+91 11 4040 4040', 'courier'],
        ['Ramesh Kumar (Local delivery boy)', '+91 9988776655', 'local']
      ];
      for (const [name, contact, type] of partners) {
        await dbRun("INSERT INTO delivery_partners (name, contact, type) VALUES (?, ?, ?)", [name, contact, type]);
      }
      console.log('Seeded delivery partners.');

      // 4. Seed Products and Product Variants
      const productsData = [
        {
          name: 'Kashmiri Lal Mirch Powder',
          description: 'Premium mild heat chilli powder known for its vibrant red color and rich aroma. Essential for Indian curries.',
          ingredients: '100% stemless sun-dried Kashmiri Red Chillies.',
          how_its_made: 'Our Kashmiri Red Chillies are sourced directly from Jammu & Kashmir farmers, sun-dried on hygienic racks, stem-cleaned, and cold-ground to retain their natural oils and bright red pigment.',
          spice_level: 2,
          category: 'Powders',
          images: JSON.stringify(['/images/kashmiri_mirch.jpg']),
          variants: [
            { weight: '100g', price: 95, stock: 50 },
            { weight: '250g', price: 220, stock: 35 },
            { weight: '500g', price: 420, stock: 20 }
          ]
        },
        {
          name: 'Lakadong Haldi (Turmeric) Powder',
          description: 'Grown in Jaintia Hills, Lakadong Turmeric is highly coveted for its high curcumin content (above 7%), offering incredible health benefits and golden color.',
          ingredients: 'Pure Lakadong Turmeric roots.',
          how_its_made: 'Harvested by local farmers in Meghalaya, the turmeric roots are washed thoroughly, sliced, sun-dried under nets, and slow-ground. It has no artificial color or starch fillers.',
          spice_level: 0,
          category: 'Powders',
          images: JSON.stringify(['/images/haldi.jpg']),
          variants: [
            { weight: '100g', price: 110, stock: 60 },
            { weight: '250g', price: 260, stock: 40 },
            { weight: '500g', price: 499, stock: 15 }
          ]
        },
        {
          name: 'Special Garam Masala',
          description: 'A traditional royal spice blend of 15 hand-selected whole spices, adding intense aroma and complexity to dishes.',
          ingredients: 'Cardamom, Cinnamon, Cloves, Black Pepper, Star Anise, Nutmeg, Mace, Coriander, Cumin, Fennel, Stone Flower, Ginger, Bay Leaf.',
          how_its_made: 'Spices are individually dry-roasted at precise temperatures to release their volatile oils, mixed in our signature family ratio, and coarse-ground for a bursting flavor profile.',
          spice_level: 4,
          category: 'Blends',
          images: JSON.stringify(['/images/garam_masala.jpg']),
          variants: [
            { weight: '50g', price: 75, stock: 80 },
            { weight: '100g', price: 140, stock: 50 },
            { weight: '250g', price: 320, stock: 30 }
          ]
        },
        {
          name: 'Teja Guntur Whole Red Chilli',
          description: 'High-heat whole dried red chillies from Guntur, ideal for tempering (tadka), pickles, and spice paste.',
          ingredients: 'Stem-removed dried Guntur Teja chillies.',
          how_its_made: 'Sourced from the famous Guntur spice yard, hand-sorted to remove damaged pods, stems clipped, and solar-dried to keep the spiciness intact.',
          spice_level: 5,
          category: 'Whole',
          images: JSON.stringify(['/images/guntur_chilli.jpg']),
          variants: [
            { weight: '100g', price: 80, stock: 40 },
            { weight: '250g', price: 185, stock: 25 }
          ]
        },
        {
          name: 'Organic Dhaniya (Coriander) Powder',
          description: 'Double cleaned, lightly roasted coriander seeds ground to form a sweet, woody, and cooling spice powder.',
          ingredients: '100% Organic Coriander seeds.',
          how_its_made: 'Our coriander seeds are roasted in batches at low heat to enhance their sweet aroma, cooled, and fine-ground in sterile conditions.',
          spice_level: 1,
          category: 'Powders',
          images: JSON.stringify(['/images/dhaniya.jpg']),
          variants: [
            { weight: '100g', price: 70, stock: 45 },
            { weight: '250g', price: 160, stock: 30 },
            { weight: '500g', price: 300, stock: 15 }
          ]
        },
        {
          name: 'Royal Biryani Masala Combo',
          description: 'An premium culinary bundle including our Signature Biryani Spice Mix (100g), Whole Spice Tempering Kit (50g), and a bottle of Natural Kewra Water Spray (100ml) for restaurant-like aroma.',
          ingredients: 'Spices blend, whole spices, food-grade Kewra extract.',
          how_its_made: 'Our Biryani spice blend is ground raw (unroasted) to let the flavors cook slowly with the rice and meat, releasing sweet floral top-notes of mace and cardamom.',
          spice_level: 3,
          category: 'Combos',
          images: JSON.stringify(['/images/biryani_combo.jpg']),
          variants: [
            { weight: '1 Combo', price: 349, stock: 20 }
          ]
        }
      ];

      for (const p of productsData) {
        const prodResult = await dbRun(
          `INSERT INTO products (name, description, ingredients, how_its_made, spice_level, category, images, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.name, p.description, p.ingredients, p.how_its_made, p.spice_level, p.category, p.images, 1]
        );

        for (const v of p.variants) {
          await dbRun(
            "INSERT INTO product_variants (product_id, weight_variant, price, stock) VALUES (?, ?, ?, ?)",
            [prodResult.id, v.weight, v.price, v.stock]
          );
        }
      }
      console.log('Seeded products and product variants successfully.');

      // 5. Seed Reviews
      const reviews = [
        [1, customer.id, 'Raj Kumar', 5, 'Very beautiful color, mild heat as expected. Perfect for my paneer gravy.'],
        [1, customer.id, 'Pooja Sharma', 4, 'Packaging was superb. The chilli powder has a wonderful earthy aroma.'],
        [2, customer.id, 'Raj Kumar', 5, 'You can feel the pure curcumin content! High quality golden haldi. Must buy.'],
        [2, customer.id, 'Anil Verma', 5, 'Authentic taste. A small pinch goes a long way. Will buy again.'],
        [3, customer.id, 'Sunita Devi', 5, 'The roasted aroma of this garam masala is divine. Swaad badh gaya khane ka. Homemade feel!']
      ];
      for (const [prodId, userId, userName, rating, comment] of reviews) {
        await dbRun(
          "INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)",
          [prodId, userId, userName, rating, comment]
        );
      }
      console.log('Seeded product reviews.');
      console.log('Database Seeding Complete.');
    } else {
      console.log('Database already initialized. Seeding skipped.');
    }

    // Ensure Shiprocket settings are seeded (handles existing databases gracefully)
    const shiprocketCheck = await dbGet("SELECT COUNT(*) as count FROM settings WHERE key = 'shiprocket_active'");
    if (shiprocketCheck.count === 0) {
      console.log('Seeding missing Shiprocket settings...');
      const shiprocketSettings = [
        ['shiprocket_active', '0'],
        ['shiprocket_email', 'test@shiprocket.com'],
        ['shiprocket_password', 'password'],
        ['shiprocket_token', ''],
        ['shiprocket_token_expiry', ''],
        ['shiprocket_webhook_token', crypto.randomBytes(16).toString('hex')]
      ];
      for (const [key, val] of shiprocketSettings) {
        await dbRun("INSERT INTO settings (key, value) VALUES (?, ?)", [key, val]);
      }
    }

    // Ensure Social Media settings are seeded (handles existing databases gracefully)
    const socialCheck = await dbGet("SELECT COUNT(*) as count FROM settings WHERE key = 'social_instagram'");
    if (socialCheck.count === 0) {
      console.log('Seeding missing social media settings...');
      const socialSettings = [
        ['social_instagram', 'https://instagram.com'],
        ['social_facebook', 'https://facebook.com'],
        ['social_twitter', 'https://twitter.com'],
        ['social_youtube', 'https://youtube.com']
      ];
      for (const [key, val] of socialSettings) {
        await dbRun("INSERT INTO settings (key, value) VALUES (?, ?)", [key, val]);
      }
    }
    // 6. Seed Pages (CMS) if not seeded
    const pagesCheck = await dbGet("SELECT COUNT(*) as count FROM pages");
    if (pagesCheck && pagesCheck.count === 0) {
      console.log('Seeding initial CMS pages...');
      const defaultPages = [
        ['about', 'Our Story', '<h1>Our Story</h1><p>Welcome to M & R Co.. We are dedicated to providing 100% homemade, stone-ground spices.</p>'],
        ['contact', 'Contact Us', '<h1>Contact Us</h1><p>Email: support@mrco.com<br>Phone: +91 98765 43210</p>'],
        ['terms', 'Terms & Conditions', '<h1>Terms & Conditions</h1><p>All transactions are subject to standard consumer laws in India. Deliveries are made within 3-7 business days.</p>'],
        ['privacy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>We respect your privacy. Your information is encrypted and stored securely.</p>'],
        ['refund', 'Refund & Returns Policy', '<h1>Refund Policy</h1><p>Since spices are food items, returns are accepted only if packaging is damaged upon receipt or incorrect item is delivered.</p>']
      ];
      for (const [slug, title, content] of defaultPages) {
        await dbRun("INSERT INTO pages (slug, title, content) VALUES (?, ?, ?)", [slug, title, content]);
      }
      console.log('Seeded CMS pages.');
    }

  } catch (error) {
    console.error('Error during database initialization:', error);
  }
};

// If run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase().then(() => {
    process.exit(0);
  });
}

export default initializeDatabase;
