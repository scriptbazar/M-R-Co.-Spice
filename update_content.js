import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, './database.db');

const db = new sqlite3.Database(dbPath);

const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const aboutContent = `
<div style="font-family: var(--font-body); color: var(--text);">
  
  <!-- Hero Section -->
  <div style="text-align: center; margin-bottom: 4rem; background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('/images/hero_spices.png') center/cover; padding: 6rem 2rem; border-radius: var(--radius-lg); color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
    <h1 style="font-family: var(--font-heading); font-size: 3.5rem; margin-bottom: 1.5rem; color: #FFF; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Our Story</h1>
    <p style="font-size: 1.25rem; max-width: 650px; margin: 0 auto; line-height: 1.6; text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">Bringing the authentic, stone-ground flavors of traditional Indian kitchens directly to your doorstep. Crafted with love, grounded in heritage.</p>
  </div>

  <!-- Content Section 1 -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; margin-bottom: 5rem;">
    <div>
      <h2 style="font-family: var(--font-heading); color: var(--secondary); font-size: 2.2rem; margin-bottom: 1.5rem;">A Passion for Pure Spices</h2>
      <p style="margin-bottom: 1rem; font-size: 1.1rem; line-height: 1.7; color: var(--text-light);">M & R Co. was born out of a simple desire: to bring back the lost aroma of pure, homemade spices. In today's fast-paced world, commercial spices often lose their essential oils and vibrant colors due to high-heat grinding and artificial fillers.</p>
      <p style="font-size: 1.1rem; line-height: 1.7; color: var(--text-light);">We wanted to change that. By going back to the roots of Indian culinary traditions, we ensure every pinch of our spice delivers maximum flavor, natural health benefits, and unadulterated goodness.</p>
    </div>
    <div>
      <img src="/images/indian_farm.png" alt="Indian Spice Farm" style="width: 100%; border-radius: var(--radius-md); box-shadow: 0 8px 24px rgba(0,0,0,0.1); object-fit: cover; aspect-ratio: 4/3;" />
    </div>
  </div>

  <!-- Content Section 2 -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; margin-bottom: 5rem;">
    <div style="order: 2;">
      <h2 style="font-family: var(--font-heading); color: var(--secondary); font-size: 2.2rem; margin-bottom: 1.5rem;">The Stone-Ground Difference</h2>
      <p style="margin-bottom: 1rem; font-size: 1.1rem; line-height: 1.7; color: var(--text-light);">Our secret lies in how we process our raw ingredients. Every batch is meticulously cleaned, sun-dried, and <b>cold-ground on traditional stone mills (chakkis)</b>.</p>
      <p style="font-size: 1.1rem; line-height: 1.7; color: var(--text-light);">Unlike modern high-speed steel grinders that burn away delicate volatile oils, our slow stone-grinding process retains the vibrant colors, rich aromas, and potent nutritional profiles of the spices.</p>
    </div>
    <div style="order: 1;">
      <img src="/images/stone_grinding.png" alt="Stone Grinding Process" style="width: 100%; border-radius: var(--radius-md); box-shadow: 0 8px 24px rgba(0,0,0,0.1); object-fit: cover; aspect-ratio: 4/3;" />
    </div>
  </div>

  <!-- Value Pillars -->
  <div style="text-align: center; margin-bottom: 3rem;">
    <h2 style="font-family: var(--font-heading); font-size: 2.5rem; margin-bottom: 3rem;">Why Choose M & R Co.?</h2>
  </div>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-bottom: 5rem;">
    <div style="background: #FFFDF9; border: 1px solid var(--border); padding: 2.5rem 2rem; border-radius: var(--radius-md); text-align: center; transition: transform 0.3s ease; cursor: pointer;" onMouseOver="this.style.transform='translateY(-5px)'" onMouseOut="this.style.transform='translateY(0)'">
      <div style="font-size: 3.5rem; margin-bottom: 1rem;">🌿</div>
      <h3 style="color: var(--secondary); margin-bottom: 0.75rem; font-size: 1.4rem;">100% Natural</h3>
      <p style="color: var(--text-light); font-size: 1rem; line-height: 1.6;">No artificial colors, preservatives, or MSG. Just pure, unadulterated goodness directly from nature to your kitchen.</p>
    </div>
    <div style="background: #FFFDF9; border: 1px solid var(--border); padding: 2.5rem 2rem; border-radius: var(--radius-md); text-align: center; transition: transform 0.3s ease; cursor: pointer;" onMouseOver="this.style.transform='translateY(-5px)'" onMouseOut="this.style.transform='translateY(0)'">
      <div style="font-size: 3.5rem; margin-bottom: 1rem;">🪨</div>
      <h3 style="color: var(--secondary); margin-bottom: 0.75rem; font-size: 1.4rem;">Stone Ground</h3>
      <p style="color: var(--text-light); font-size: 1rem; line-height: 1.6;">We use slow, low-temperature stone grinding to retain all the delicate volatile oils and rich natural aromas.</p>
    </div>
    <div style="background: #FFFDF9; border: 1px solid var(--border); padding: 2.5rem 2rem; border-radius: var(--radius-md); text-align: center; transition: transform 0.3s ease; cursor: pointer;" onMouseOver="this.style.transform='translateY(-5px)'" onMouseOut="this.style.transform='translateY(0)'">
      <div style="font-size: 3.5rem; margin-bottom: 1rem;">👩‍🌾</div>
      <h3 style="color: var(--secondary); margin-bottom: 0.75rem; font-size: 1.4rem;">Farmer Sourced</h3>
      <p style="color: var(--text-light); font-size: 1rem; line-height: 1.6;">Directly partnered with traditional farming communities in Guntur, Kashmir, and Meghalaya for fair trade.</p>
    </div>
  </div>

  <!-- FSSAI Badge -->
  <div style="text-align: center; border-top: 1px solid var(--border); padding-top: 4rem; padding-bottom: 2rem;">
    <h3 style="margin-bottom: 1.5rem; color: var(--text); font-family: var(--font-heading); font-size: 1.5rem;">Certified Quality You Can Trust</h3>
    <div style="display: inline-flex; align-items: center; gap: 1.5rem; padding: 1.5rem 3rem; border: 2px dashed var(--primary); border-radius: var(--radius-sm); background: #fdfbf7;">
      <span style="font-size: 2rem;">🛡️</span>
      <div style="text-align: left;">
        <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-light); margin-bottom: 0.25rem;">Food Safety & Standards Authority</div>
        <div style="font-weight: bold; color: var(--secondary); font-size: 1.1rem;">FSSAI LIC NO: 22724999000123</div>
      </div>
    </div>
  </div>
</div>
`;

const privacyContent = `
<div>
  <h1>Privacy Policy</h1>
  <p><strong>Last Updated: June 23, 2026</strong></p>
  <p>Welcome to <strong>M & R Co.</strong>. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at <a href="mailto:support@mrco.com">support@mrco.com</a>.</p>
  
  <h2>1. Information We Collect</h2>
  <p>We collect personal information that you voluntarily provide to us when registering on the website, expressing an interest in obtaining information about us or our products, or when purchasing products. The personal information that we collect includes:</p>
  <ul>
    <li><strong>Personal Identifiers:</strong> Name, email address, mobile number.</li>
    <li><strong>Billing & Shipping Data:</strong> Delivery addresses, billing addresses, and pin codes.</li>
    <li><strong>Authentication Information:</strong> Hashed passwords and authentication tokens (including Google Sign-In profile info).</li>
    <li><strong>Payment Details:</strong> All payments are processed securely via Cashfree or Razorpay. We do not store credit card numbers, CVVs, or net banking passwords on our servers.</li>
  </ul>

  <h2>2. How We Use Your Information</h2>
  <p>We use personal information collected via our website for a variety of business purposes, including:</p>
  <ul>
    <li><strong>Order Fulfillment:</strong> Processing payments, arranging shipment via our partner <strong>Shiprocket</strong>, and tracking orders.</li>
    <li><strong>Account Management:</strong> Managing user registrations, orders, and dashboard configurations.</li>
    <li><strong>Customer Support:</strong> Responding to inquiries, resolving billing disputes, and collecting feedback.</li>
    <li><strong>Marketing Communications:</strong> Sending updates, promotional offers, and newsletters (you can opt-out at any time).</li>
  </ul>

  <h2>3. Information Sharing and Disclosure</h2>
  <p>We only share information with your consent, to comply with laws, to provide you with services, or to fulfill business obligations. Our key third-party partners include:</p>
  <ul>
    <li><strong>Logistics Partners:</strong> <em>Shiprocket</em> and associated couriers (Delhivery, Blue Dart) to deliver your orders safely.</li>
    <li><strong>Payment Gateways:</strong> <em>Razorpay</em> and <em>Cashfree</em> to secure credit/debit card, UPI, and net banking transactions.</li>
    <li><strong>Analytics Providers:</strong> <em>Google Analytics</em> to understand traffic and improve user interface behavior.</li>
  </ul>

  <h2>4. Cookies and Tracking</h2>
  <p>We use cookies and similar tracking technologies to access or store information. These cookies help us maintain your shopping cart state, keep you logged in, and analyze web traffic. You can configure your browser to reject cookies, but some parts of our website may not function correctly.</p>

  <h2>5. Data Security</h2>
  <p>We implement a variety of security measures to maintain the safety of your personal information. Your account password is encrypted using high-security hashing (bcrypt). All transaction communication is processed over secure, SSL/TLS-encrypted channels.</p>

  <h2>6. Your Rights</h2>
  <p>Under applicable Indian IT laws, you have the right to access, correct, or request the deletion of your personal data. To make such a request, please contact our Grievance Officer.</p>

  <h2>7. Contact and Grievance Officer</h2>
  <p>If you have questions or comments about this policy, you may contact our Grievance Officer:</p>
  <blockquote>
    <strong>Grievance Officer:</strong> Satish Kumar<br />
    <strong>Address:</strong> H.No 12, Spice Garden Road, Khari Baoli, Old Delhi, India - 110006<br />
    <strong>Email:</strong> grievance@mrco.com<br />
    <strong>Phone:</strong> +91 98765 43210
  </blockquote>
</div>
`;

const termsContent = `
<div>
  <h1>Terms & Conditions</h1>
  <p><strong>Last Updated: June 23, 2026</strong></p>
  <p>Welcome to <strong>M & R Co.</strong>. These Terms & Conditions govern your use of our website and the purchase of our products. By accessing our site or purchasing our items, you agree to be bound by these terms.</p>

  <h2>1. Account Registration</h2>
  <p>To place orders, you may create an account using Google Sign-In or your email address. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

  <h2>2. Products and Pricing</h2>
  <ul>
    <li><strong>Authenticity and Natural Variations:</strong> Our spices are handcrafted, stone-ground, and sun-dried without artificial colors or fillers. Due to the natural agricultural sourcing from Guntur, Kashmir, and Meghalaya, slight variations in color, texture, and aroma across batches are normal and are a hallmark of purity.</li>
    <li><strong>Spice Levels:</strong> Spice indicator levels (0 to 5) shown on products are indicative and designed to help customers choose suitable items.</li>
    <li><strong>Pricing:</strong> All prices listed are in Indian Rupees (INR) and are inclusive of GST unless stated otherwise. We reserve the right to change prices and correct typographical errors at any time.</li>
  </ul>

  <h2>3. Payments and Security</h2>
  <p>We support multiple online payment options, including UPI, Net Banking, Credit/Debit cards (handled through Razorpay and Cashfree gateways), as well as Cash on Delivery (COD). All online payments must be successfully authorized before dispatch.</p>

  <h2>4. Delivery Policy</h2>
  <p>Our products are freshly packed at our store in Old Delhi and shipped via our logistics aggregator, <strong>Shiprocket</strong>. We deliver to most pincodes within India. Standard delivery times are <strong>3 to 7 business days</strong>. M & R Co. is not responsible for courier delays due to force majeure events (e.g., severe weather, floods, strikes, or government restrictions).</p>

  <h2>5. Intellectual Property</h2>
  <p>All content, including product photos, graphics, brand logos, and recipe descriptions on this website, is the exclusive intellectual property of M & R Co.. Any unauthorized copying, distribution, or commercial reuse is strictly prohibited.</p>

  <h2>6. Limitation of Liability</h2>
  <p>M & R Co. shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our products. We offer our items "as is" with FSSAI-certified safety compliance.</p>

  <h2>7. Governing Law and Jurisdiction</h2>
  <p>These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes arising out of your purchase or use of the website shall be subject exclusively to the courts of <strong>New Delhi, Delhi, India</strong>.</p>
</div>
`;

const refundContent = `
<div>
  <h1>Refund & Returns Policy</h1>
  <p><strong>Last Updated: June 23, 2026</strong></p>
  <p>At <strong>M & R Co.</strong>, we take great pride in the quality, purity, and hygiene of our stone-ground spices. Because our products are food items, we maintain a strict return policy to ensure safety standards for all our customers.</p>

  <h2>1. General Policy on Returns</h2>
  <p>In accordance with food safety standards and FSSAI guidelines, <strong>all spices, spice powders, and food bundles are non-returnable and non-refundable once opened</strong>. We cannot accept returns of food products due to simple change of mind or personal preference.</p>

  <h2>2. Eligible Exceptions for Replacement/Refund</h2>
  <p>We will happily replace your item or issue a full refund if:</p>
  <ul>
    <li>The product received has physical damage (e.g., a torn spice packet or a broken container seal on arrival).</li>
    <li>The wrong item was delivered (e.g., Kashmiri Lal Mirch instead of Lakadong Haldi).</li>
    <li>The product package has expired prior to the delivery date.</li>
  </ul>

  <h2>3. Mandate: Unboxing Video Requirement</h2>
  <blockquote>
    <strong>IMPORTANT:</strong> To prevent fraudulent claims and verify transit damage, customers <strong>must record a continuous, unedited unboxing video</strong>. The video must start by showing the courier label, opening the outer cardboard box/flyer, and inspecting the inner spice packaging and safety seals.
  </blockquote>
  <p>Claims for damaged, leaking, or missing items will not be processed without a valid, unedited unboxing video.</p>

  <h2>4. Reporting Window</h2>
  <p>You must report any issues, along with the unboxing video and photos of the package, within <strong>48 hours of delivery</strong>. You can reach out to us at:</p>
  <ul>
    <li><strong>Email:</strong> <a href="mailto:support@mrco.com">support@mrco.com</a></li>
    <li><strong>WhatsApp/Call:</strong> +91 98765 43210</li>
  </ul>
  <p>Any claims made after 48 hours from the time of delivery will not be eligible for review.</p>

  <h2>5. Refund Process</h2>
  <p>Once our quality assurance team verifies the unboxing video, your refund will be approved:</p>
  <ul>
    <li>Refunds will be processed back to the original payment source (UPI, Card, or Net Banking) via our payment gateway within <strong>5 to 7 business days</strong>.</li>
    <li>For Cash on Delivery (COD) orders, our support team will contact you to request bank account details or a UPI ID to initiate an online transfer.</li>
  </ul>

  <h2>6. Order Cancellation</h2>
  <p>Orders can only be cancelled before they are dispatched. Once a package is handed over to our shipping partner (Shiprocket/courier), the order cannot be cancelled under any circumstances.</p>
</div>
`;

const contactContent = `
<div>
  <h1>Contact Us</h1>
  <p>We are here to assist you with your orders, feedback, bulk inquiries, or any spice-related questions.</p>
  
  <h2>Our Main Office & Experience Store</h2>
  <p>Visit us to experience the aroma of fresh, stone-ground spices:</p>
  <p>
    <strong>M & R Co. Hub</strong><br />
    H.No 12, Spice Garden Road,<br />
    Khari Baoli, Old Delhi, India - 110006
  </p>

  <h2>Helpline Numbers</h2>
  <ul>
    <li><strong>Customer Support:</strong> +91 98765 43210 (Mon-Sat, 9:00 AM - 6:00 PM)</li>
    <li><strong>Bulk Orders & Business Inquiries:</strong> +91 98765 43211</li>
  </ul>

  <h2>Email Correspondence</h2>
  <ul>
    <li><strong>General Support:</strong> <a href="mailto:support@mrco.com">support@mrco.com</a></li>
    <li><strong>Partnerships & Wholesale:</strong> <a href="mailto:sales@mrco.com">sales@mrco.com</a></li>
    <li><strong>Careers:</strong> <a href="mailto:jobs@mrco.com">jobs@mrco.com</a></li>
  </ul>
</div>
`;

const pages = [
  { slug: 'about', title: 'Our Story', content: aboutContent },
  { slug: 'privacy', title: 'Privacy Policy', content: privacyContent },
  { slug: 'terms', title: 'Terms & Conditions', content: termsContent },
  { slug: 'refund', title: 'Refund & Returns Policy', content: refundContent },
  { slug: 'contact', title: 'Contact Us', content: contactContent }
];

async function main() {
  try {
    console.log('Updating CMS pages in database...');
    
    for (const page of pages) {
      console.log(`Updating page: ${page.title} (${page.slug})...`);
      await runQuery(
        "INSERT OR REPLACE INTO pages (slug, title, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        [page.slug, page.title, page.content]
      );
    }
    
    console.log('All policy pages updated successfully in the database!');
  } catch (err) {
    console.error('Error executing database updates:', err);
  } finally {
    db.close();
  }
}

main();
