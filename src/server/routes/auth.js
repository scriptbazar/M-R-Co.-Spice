import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { dbGet, dbRun, dbAll } from '../../db/database.js';

dotenv.config();

const router = express.Router();

// SEC-01: JWT_SECRET with fallback for Vercel serverless environment
export const JWT_SECRET = process.env.JWT_SECRET || 'apice_spices_super_secret_jwt_key_2026_default';

// SEC-06: Rate limiters to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 attempts per IP per window
  message: { error: 'Too many attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 signup attempts per IP per hour
  message: { error: 'Too many signup attempts from this IP, please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to verify JWT tokens
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Middleware to verify Admin role
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Helper to hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const verifyPassword = async (password, hash) => {
  // Fallback for legacy sha256 hashes (64 hex characters)
  if (!hash.startsWith('$2b$') && hash.length === 64) {
    const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
    return legacyHash === hash;
  }
  return await bcrypt.compare(password, hash);
};

// OTP endpoints are deactivated
router.post('/send-otp', (req, res) => {
  return res.status(400).json({ error: 'Mobile OTP login is disabled. Please sign in using Google or Email/Password.' });
});

router.post('/verify-otp', (req, res) => {
  return res.status(400).json({ error: 'Mobile OTP login is disabled. Please sign in using Google or Email/Password.' });
});

// 1. Password Login (SEC-06: rate limited)
router.post('/login-password', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  // SEC-09: Basic input length validation
  if (email.length > 255 || password.length > 128) {
    return res.status(400).json({ error: 'Invalid input length.' });
  }

  try {
    const user = await dbGet("SELECT * FROM users WHERE email = ?", [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please sign up first.' });
    }

    if (user.status === 'blocked' || user.status === 'deactivated') {
      return res.status(403).json({ error: `Your account has been ${user.status}. Please contact support.` });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

// 2. Password Signup (SEC-06: strict rate limited)
router.post('/signup-password', strictLimiter, async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields (name, email, phone, password) are required.' });
  }

  // SEC-09: Input length validation
  if (name.length > 100 || email.length > 255 || phone.length > 20 || password.length > 128) {
    return res.status(400).json({ error: 'One or more fields exceed maximum allowed length.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();

  try {
    // Check if email already registered
    const existingEmail = await dbGet("SELECT id FROM users WHERE email = ?", [cleanEmail]);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered. Please log in.' });
    }

    // Check if phone already registered
    const existingPhone = await dbGet("SELECT id FROM users WHERE phone = ?", [cleanPhone]);
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already registered.' });
    }

    const passHash = await bcrypt.hash(password, 10);
    // SEC-08: Role is ALWAYS 'customer' on self-registration.
    // Admin/staff roles must be assigned manually via the Admin panel.
    const role = 'customer';

    const result = await dbRun(
      "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [name.trim(), cleanEmail, cleanPhone, passHash, role]
    );

    const token = jwt.sign(
      { id: result.id, name: name.trim(), email: cleanEmail, phone: cleanPhone, role: role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: result.id,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        role: role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup. Please try again.' });
  }
});

// Google Sign-In Endpoint
router.post('/google-login', authLimiter, async (req, res) => {
  const { credential, action, is_mock, mock_email, mock_name } = req.body;

  try {
    let email;
    let name;

    // SEC-07: Developer mock bypass ONLY allowed in development environment
    if (is_mock) {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'Mock login is disabled in production.' });
      }
      if (!mock_email) {
        return res.status(400).json({ error: 'Mock email is required for developer bypass' });
      }
      email = mock_email.trim().toLowerCase();
      name = mock_name ? mock_name.trim() : `Mock User (${email.split('@')[0]})`;
    } else {
      if (!credential) {
        return res.status(400).json({ error: 'Google credential (ID token) is required' });
      }

      // Verify token with Google APIs
      try {
        const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const payload = response.data;

        if (!payload || !payload.email) {
          return res.status(400).json({ error: 'Invalid Google token payload' });
        }

        email = payload.email.trim().toLowerCase();
        name = payload.name || payload.given_name || email.split('@')[0];
      } catch (verifyError) {
        console.error('Google token verification failed:', verifyError.message);
        return res.status(400).json({ error: 'Failed to verify Google token.' });
      }
    }

    // Database lookup
    let user = await dbGet("SELECT * FROM users WHERE email = ?", [email]);

    if (action === 'login') {
      if (!user) {
        return res.status(404).json({ error: 'Account not found. Please sign up first.' });
      }
      
      // Check if blocked or deactivated
      if (user.status === 'blocked' || user.status === 'deactivated') {
        return res.status(403).json({ error: `Your account has been ${user.status}. Please contact support.` });
      }
    } else {
      // action === 'signup'
      if (!user) {
        // SEC-08: Role is always 'customer' for new Google sign-ups
        // Admin/staff roles must be assigned manually via the Admin panel.
        const role = 'customer';

        const placeholderPhone = `GGL_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const passHash = await bcrypt.hash(randomPassword, 10);

        const result = await dbRun(
          "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
          [name, email, placeholderPhone, passHash, role]
        );

        user = {
          id: result.id,
          name: name,
          email: email,
          phone: placeholderPhone,
          role: role
        };
      } else {
        // User already exists, log them in
        if (user.status === 'blocked' || user.status === 'deactivated') {
          return res.status(403).json({ error: `Your account has been ${user.status}. Please contact support.` });
        }
      }
    }

    // Sign Token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ error: 'Server error during Google login. Please try again.' });
  }
});

// 4. Get Current User Details
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet("SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.status === 'blocked' || user.status === 'deactivated') {
      return res.status(403).json({ error: `Your account has been ${user.status}.` });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// 5. Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { name, email, phone } = req.body;
  // SEC-09: Input validation
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required.' });
  }
  if (name.length > 100 || email.length > 255 || phone.length > 20) {
    return res.status(400).json({ error: 'One or more fields exceed maximum allowed length.' });
  }
  try {
    await dbRun(
      "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?",
      [name.trim(), email.trim().toLowerCase(), phone.trim(), req.user.id]
    );
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile. Email or Phone might already be registered.' });
  }
});

// --- ADDRESS CRUD ---

// Get User Addresses
router.get('/addresses', authenticateToken, async (req, res) => {
  try {
    const addresses = await dbAll("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC", [req.user.id]);
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Add Address
router.post('/addresses', authenticateToken, async (req, res) => {
  const { label, full_address, city, state, pincode, is_default } = req.body;
  if (!label || !full_address || !city || !state || !pincode) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // If setting as default, clear other defaults first
    if (is_default) {
      await dbRun("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [req.user.id]);
    }

    // Check if user has any addresses already
    const checkCount = await dbGet("SELECT COUNT(*) as count FROM addresses WHERE user_id = ?", [req.user.id]);
    const makeDefault = checkCount.count === 0 ? 1 : (is_default ? 1 : 0);

    const result = await dbRun(
      "INSERT INTO addresses (user_id, label, full_address, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [req.user.id, label, full_address, city, state, pincode, makeDefault]
    );

    res.json({ success: true, id: result.id, message: 'Address added successfully' });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Failed to add address. Please try again.' });
  }
});

// Set Address as Default
router.put('/addresses/:id/default', authenticateToken, async (req, res) => {
  const { id } = req.params;
  // SEC-06: Validate ID is a positive integer
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'Invalid address ID.' });
  }
  try {
    await dbRun("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [req.user.id]);
    await dbRun("UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?", [id, req.user.id]);
    res.json({ success: true, message: 'Default address updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

// Delete Address
router.delete('/addresses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  // SEC-06: Validate ID is a positive integer
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'Invalid address ID.' });
  }
  try {
    // Check if deleting default
    const addr = await dbGet("SELECT is_default FROM addresses WHERE id = ? AND user_id = ?", [id, req.user.id]);
    if (!addr) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await dbRun("DELETE FROM addresses WHERE id = ? AND user_id = ?", [id, req.user.id]);

    // If deleted address was default, make the next one default
    if (addr.is_default) {
      const nextAddr = await dbGet("SELECT id FROM addresses WHERE user_id = ? LIMIT 1", [req.user.id]);
      if (nextAddr) {
        await dbRun("UPDATE addresses SET is_default = 1 WHERE id = ?", [nextAddr.id]);
      }
    }

    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// Newsletter Subscription (SEC-06: rate limited)
router.post('/subscribe', rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }), async (req, res) => {
  const { email } = req.body;
  // SEC-09: Validate email format and length
  if (!email || !email.includes('@') || email.length > 255) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await dbGet("SELECT id FROM subscribers WHERE email = ?", [cleanEmail]);
    if (existing) {
      return res.status(200).json({ success: true, message: 'You are already subscribed to our newsletter!' });
    }

    await dbRun("INSERT INTO subscribers (email) VALUES (?)", [cleanEmail]);
    res.json({ success: true, message: 'Thanks for subscribing! Check your email for the discount code.' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Subscription failed. Please try again.' });
  }
});

// 6. Change Password (Authenticated, rate limited)
router.put('/change-password', authenticateToken, authLimiter, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }
  // SEC-09: Password length validation
  if (newPassword.length < 6 || newPassword.length > 128) {
    return res.status(400).json({ error: 'New password must be between 6 and 128 characters.' });
  }

  try {
    const user = await dbGet("SELECT password_hash FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await dbRun("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, req.user.id]);

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

export default router;
