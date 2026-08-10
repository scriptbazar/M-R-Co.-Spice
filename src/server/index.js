import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbGet } from '../db/database.js';

// ─── SECURITY: JWT_SECRET ───────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'apice_spices_super_secret_jwt_key_2026_default';
}

// Import Route modules
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import pagesRoutes from './routes/pages.js';
import shiprocketRoutes from './routes/shiprocket.js';
import initializeDatabase from '../db/init.js';

// Auto-seed database schema & initial data if needed
initializeDatabase().catch(err => console.error('Database auto-init error:', err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Redirect HTTP to HTTPS in production
if (isProduction) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && !req.secure) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// ─── SECURITY MIDDLEWARE ─────────────────────────────────────────────────────

// SEC-03: Helmet adds security headers (XSS, clickjacking, MIME sniffing protection)
// CSP enabled — restricts sources to prevent XSS attacks
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to be served cross-origin
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://apis.google.com",
        // Allow Google GSI (Sign In) library
        "https://accounts.google.com/gsi/client"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for inline styles used by the React app
        "https://fonts.googleapis.com"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"], // Allow HTTPS images (product images from external CDN)
      connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com"],
      frameSrc: ["https://accounts.google.com"], // Required for Google One Tap iframe
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isProduction ? [] : null, // Force HTTPS in production
    }
  },
  hsts: isProduction // Enable HSTS only in production
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
}));

// SEC-02: CORS - only allow requests from our own frontend
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000', // common dev alternative
  'http://localhost:5000', // when serving statically
];
app.use(cors({
  origin: (origin, callback) => {
    // In production: block requests with no Origin header (Postman, curl, server scripts)
    // In development: allow them for easier local testing
    if (!origin) {
      if (isProduction) {
        return callback(new Error('CORS: Direct server-to-server requests are not allowed in production.'));
      }
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin '${origin}' is not allowed by policy.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '5mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve product images statically
app.use('/images', express.static(path.resolve(__dirname, '../../public/images')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/shiprocket', shiprocketRoutes);

// General status check (public info only - no sensitive data)
app.get('/api/status', async (req, res) => {
  try {
    const brand = await dbGet("SELECT value FROM settings WHERE key = 'brand_name'");
    const fssai = await dbGet("SELECT value FROM settings WHERE key = 'fssai_license_number'");
    const email = await dbGet("SELECT value FROM settings WHERE key = 'contact_email'");
    const phone = await dbGet("SELECT value FROM settings WHERE key = 'contact_phone'");
    const address = await dbGet("SELECT value FROM settings WHERE key = 'store_address'");
    const logo = await dbGet("SELECT value FROM settings WHERE key = 'store_logo'");
    const favicon = await dbGet("SELECT value FROM settings WHERE key = 'store_favicon'");
    const pincode = await dbGet("SELECT value FROM settings WHERE key = 'store_pincode'");
    const instagram = await dbGet("SELECT value FROM settings WHERE key = 'social_instagram'");
    const facebook = await dbGet("SELECT value FROM settings WHERE key = 'social_facebook'");
    const twitter = await dbGet("SELECT value FROM settings WHERE key = 'social_twitter'");
    const youtube = await dbGet("SELECT value FROM settings WHERE key = 'social_youtube'");
    res.json({
      status: 'active',
      brand: brand?.value || 'M & R Co.',
      fssai: fssai?.value || '',
      email: email?.value || 'support@mrco.com',
      phone: phone?.value || '+91 98765 43210',
      address: address?.value || 'H.No 12, Spice Garden Road,\nKhari Baoli, Old Delhi, India',
      logo: logo?.value || '',
      favicon: favicon?.value || '',
      pincode: pincode?.value || '110006',
      instagram: instagram?.value || '',
      facebook: facebook?.value || '',
      twitter: twitter?.value || '',
      youtube: youtube?.value || '',
      googleClientId: process.env.GOOGLE_CLIENT_ID || '1061905389658-dummy.apps.googleusercontent.com'
    });
  } catch (err) {
    // SEC-11: Don't expose internal error details in production
    console.error('Status endpoint error:', err);
    res.status(500).json({ error: 'Service temporarily unavailable' });
  }
});

// Serve frontend static assets in production
const clientBuildPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// Fallback to client routing for non-API calls
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Resource not found. Please ensure frontend is built.');
    }
  });
});

// Global error handler (SEC-11: hide internal details in production)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  if (isProduction) {
    res.status(500).json({ error: 'Something went wrong on the server' });
  } else {
    res.status(500).json({ error: 'Something went wrong on the server', details: err.message });
  }
});

// Start Server (Skip listen when running on Vercel Serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
