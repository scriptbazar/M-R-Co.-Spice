# 🌿 M & R Co. Spices (Apice Hub)

> **Authentic & Traditional Homemade Indian Spices E-Commerce Platform**

A full-stack, mobile-first e-commerce web application built for **M & R Co. Spices**. Sourced directly from trusted local farmers, featuring stone-ground spices, custom blends, whole masale, and combo packs.

---

## ✨ Features Highlight

### 📱 Mobile-First & Responsive UX
- **Mobile Bottom Navigation Bar**: Fixed bottom navigation bar for mobile devices (`Home`, `Spices`, `Wishlist`, `Cart`, `Account`) with real-time badge counts.
- **Sliding Mini-Cart Drawer**: Smooth slide-over side drawer triggering on item additions, complete with a **Free Shipping Progress Tracker** (`Add ₹XX more for FREE delivery!`).
- **Layout Thrashing & Flicker Prevention**: Mobile-optimized layouts preventing horizontal overflow and screen flickering across all phone and tablet screen sizes.

### ⚡ Conversion & E-Commerce Tools
- **1-Click "Buy Now"**: Instant checkout bypass from both Product Details and Quick View modal.
- **Product Compare**: Side-by-side comparison bar for spice heat levels, weights, ingredients, and prices.
- **Quick View Modal**: Rapid product inspection without leaving the main catalog page.
- **Dynamic Heat Level Indicator**: Flame icon ratings showing heat intensity (Mild Heat to Fiery Hot 🔥).
- **Verified Buyer Reviews**: Customer ratings and reviews system.

### 🔑 Demo Accounts & Quick Fill
The application includes built-in 1-Click Quick Fill credentials on the login modal:
- 👤 **Customer / User**: `raj@gmail.com` / `user123`
- 👑 **Admin Owner**: `admin@mrco.com` / `admin123`
- 📦 **Staff / Packer**: `staff@mrco.com` / `staff123`

### 💳 Payments & Logistics
- **Multi-Gateway Integration**: Cashfree, Razorpay, PayU, PhonePe, and Cash on Delivery (COD).
- **Payment Test Simulators**: Built-in test sandbox popups for simulating payment success/failure.
- **Shiprocket Logistics**: Rate calculations, tracking waybills, and order status webhook simulation.

### 📊 Admin Control Center
- Live sales metrics, revenue overview graphs, low stock alerts.
- Product inventory management with variant pricing and combo items.
- Discount coupon creator (Percentage & Flat INR discounts).
- Order status workflow (Pending ➔ Processing ➔ Shipped ➔ Delivered).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Framer Motion, Lucide React Icons, Vanilla CSS3 (Custom Design Tokens & Glassmorphism).
- **Backend**: Node.js, Express.js, SQLite3 (Zero-config embedded DB).
- **Authentication**: JWT (JSON Web Tokens), Bcrypt password hashing.
- **Security**: Helmet, Express Rate Limiting, CORS.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/scriptbazar/M-R-Co.-Spice.git
   cd M-R-Co.-Spice
   ```

2. **Install dependencies**:
   ```bash
   npm run install-all
   ```

3. **Initialize SQLite Database & Seed Data**:
   ```bash
   npm run init-db
   ```

4. **Start Backend Server**:
   ```bash
   npm run backend
   ```
   *(Backend runs on `http://localhost:5000`)*

5. **Start Frontend Dev Server**:
   ```bash
   npm run frontend
   ```
   *(Frontend runs on `http://localhost:5173`)*

---

## 📂 Project Structure

```
apice-hub/
├── client/                     # Vite + React Frontend
│   ├── public/                 # Static assets & product images
│   └── src/
│       ├── components/         # Navbar, Footer, BottomNav, CartDrawer, QuickViewModal...
│       ├── pages/              # Home, Products, ProductDetail, Cart, Checkout, AdminDashboard...
│       ├── App.jsx             # Main Application Routing & State
│       └── index.css           # Global Design System & Responsive Stylesheet
├── src/
│   ├── db/                     # SQLite Schema & Seeding Scripts
│   └── server/                 # Express API Routes & Middleware
├── package.json
└── README.md
```

---

## 📄 License

Created for **M & R Co. Spices**. All rights reserved.
