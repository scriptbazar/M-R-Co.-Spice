import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, X, ArrowUp, Eye, EyeOff } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import DynamicPage from './pages/DynamicPage';
import About from './pages/About';
import Wishlist from './pages/Wishlist';
import Contact from './pages/Contact';
import ToastContainer, { showToast } from './components/Toast';
import QuickViewModal from './components/QuickViewModal';
import ProductCompare from './components/ProductCompare';
import BottomNav from './components/BottomNav';
import CartDrawer from './components/CartDrawer';

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [currentTab, setCurrentTab] = useState('home');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [storeConfig, setStoreConfig] = useState(null);
  
  // Auth Modal State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', or 'forgot'
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [postAuthCallback, setPostAuthCallback] = useState(null); // Callback after successful login
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');

  // Signup Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [checkoutMeta, setCheckoutMeta] = useState({ discount: 0, code: '' });
  const [globalCouponCode, setGlobalCouponCode] = useState('');

  // ======= NEW FEATURE STATES =======

  // Wishlist
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('mrco_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Recently Viewed
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const saved = localStorage.getItem('mrco_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Product Compare
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Quick View
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Back to Top
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Persist wishlist
  useEffect(() => {
    localStorage.setItem('mrco_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Persist recently viewed
  useEffect(() => {
    localStorage.setItem('mrco_recently_viewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Wishlist operations
  const handleToggleWishlist = (product) => {
    const exists = wishlist.find(p => p.id === product.id);
    if (exists) {
      setWishlist(prev => prev.filter(p => p.id !== product.id));
      showToast(`${product.name} removed from wishlist`, 'info');
    } else {
      setWishlist(prev => [...prev, product]);
      showToast(`${product.name} added to wishlist! 💖`, 'success');
    }
  };

  const handleRemoveFromWishlist = (productId) => {
    const product = wishlist.find(p => p.id === productId);
    setWishlist(prev => prev.filter(p => p.id !== productId));
    if (product) showToast(`${product.name} removed from wishlist`, 'info');
  };

  const isInWishlist = (productId) => {
    return wishlist.some(p => p.id === productId);
  };

  // Recently Viewed tracking
  const handleTrackView = (product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 8);
      return updated;
    });
  };

  // Product Compare operations
  const handleToggleCompare = (product) => {
    const exists = compareList.find(p => p.id === product.id);
    if (exists) {
      setCompareList(prev => prev.filter(p => p.id !== product.id));
      showToast(`${product.name} removed from compare`, 'info');
    } else {
      if (compareList.length >= 3) {
        showToast('Maximum 3 products can be compared!', 'warning');
        return;
      }
      setCompareList(prev => [...prev, product]);
      showToast(`${product.name} added to compare 📊`, 'success');
    }
  };

  const isInCompare = (productId) => {
    return compareList.some(p => p.id === productId);
  };

  const handleRemoveCompare = (productId) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  };

  const handleClearCompare = () => {
    setCompareList([]);
    setShowCompareModal(false);
  };

  // Quick View
  const handleQuickView = (product) => {
    setQuickViewProduct(product);
  };

  useEffect(() => {
    // 1. Restore auth state
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Session expired');
          return res.json();
        })
        .then(data => {
          setUser(data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        });
    }

    // 2. Fetch products for catalog
    setProductsLoading(true);
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Error fetching products:', err))
      .finally(() => {
        setProductsLoading(false);
      });

    // 3. Fetch global status configuration
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        setStoreConfig(data);
      })
      .catch(console.error);
  }, []); // Only fetch initial app data once on mount

  // Dynamic Favicon Updater
  useEffect(() => {
    if (storeConfig && storeConfig.favicon) {
      const link = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = storeConfig.favicon;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = storeConfig.favicon;
        document.head.appendChild(newLink);
      }
    }
  }, [storeConfig]);

  // Centralized Route Guard Effect
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'staff') {
        const restrictedForAdmin = ['orders', 'account', 'analytics', 'checkout', 'cart', 'wishlist'];
        if (restrictedForAdmin.includes(currentTab)) {
          setCurrentTab('admin');
        }
      } else if (user.role === 'customer') {
        if (currentTab === 'admin') {
          setCurrentTab('home');
        }
      }
    } else {
      const authRequired = ['orders', 'account', 'analytics', 'checkout', 'admin'];
      if (authRequired.includes(currentTab)) {
        setCurrentTab('home');
      }
    }
  }, [user, currentTab]);

  // Cart operations
  const handleAddToCart = (product, variant) => {
    if (!variant || variant.stock === 0) return showToast('Select variant or variant is out of stock', 'error');

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id && item.variant.id === variant.id);
      
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + 1;
        if (newQty > variant.stock) {
          showToast(`Cannot add more. Only ${variant.stock} units available in stock.`, 'warning');
          return prev;
        }
        updated[existingIdx].quantity = newQty;
        return updated;
      } else {
        return [...prev, { product, variant, quantity: 1 }];
      }
    });

    showToast(`${product.name} (${variant.weight_variant}) added to cart! 🛒`, 'success');
    if (currentTab !== 'checkout') {
      setCartDrawerOpen(true);
    }
  };

  const handleUpdateCartQty = (productId, variantId, newQty) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId, variantId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.variant.id === variantId) {
        if (newQty > item.variant.stock) {
          showToast(`Only ${item.variant.stock} units available in stock.`, 'warning');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveCartItem = (productId, variantId) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.variant.id === variantId)));
    showToast('Item removed from cart', 'info');
  };

  const handleSaveForLater = (cartItem) => {
    // 1. Remove from active cart
    handleRemoveCartItem(cartItem.product.id, cartItem.variant.id);
    // 2. Push to saved list
    setSavedItems(prev => {
      const exists = prev.some(item => item.product.id === cartItem.product.id && item.variant.id === cartItem.variant.id);
      if (exists) return prev;
      return [...prev, cartItem];
    });
    showToast('Item saved for later ✅', 'success');
  };

  const handleMoveToCart = (savedItem) => {
    // 1. Remove from saved
    setSavedItems(prev => prev.filter(item => !(item.product.id === savedItem.product.id && item.variant.id === savedItem.variant.id)));
    // 2. Add back to cart
    handleAddToCart(savedItem.product, savedItem.variant);
  };

  const handleRemoveSaved = (productId, variantId) => {
    setSavedItems(prev => prev.filter(item => !(item.product.id === productId && item.variant.id === variantId)));
  };

  const handleReorderCart = (reorderItems) => {
    // reorderItems: [{ product_id, variant_id, quantity }]
    // Match against available products catalog
    const newCartItems = [];
    
    reorderItems.forEach(item => {
      const matchedProd = products.find(p => p.id === item.product_id);
      if (matchedProd) {
        const matchedVar = matchedProd.variants.find(v => v.id === item.variant_id);
        if (matchedVar && matchedVar.stock > 0) {
          const qty = Math.min(item.quantity, matchedVar.stock);
          newCartItems.push({
            product: matchedProd,
            variant: matchedVar,
            quantity: qty
          });
        }
      }
    });

    if (newCartItems.length > 0) {
      setCart(newCartItems);
      showToast('Previous order items added to cart! 🛒', 'success');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentTab('home');
    setGlobalCouponCode('');
    showToast('You have logged out successfully.', 'info');
  };

  const handleProfileUpdate = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(() => {});
    }
  };

  const handleOpenLoginModal = (callback = null) => {
    setPostAuthCallback(() => callback);
    setLoginModalOpen(true);
    setAuthError('');
    setAuthSuccess('');
  };

  // Regular Email/Password Login
  const handleEmailLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    fetch('/api/auth/login-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data;
      })
      .then(data => {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setLoginModalOpen(false);
        
        // Reset forms
        setLoginEmail('');
        setLoginPassword('');

        showToast(`Welcome back, ${data.user.name}! 🌿`, 'success');
        if (data.user.role === 'admin' || data.user.role === 'staff') {
          setCurrentTab('admin');
        }
      })
      .catch(err => {
        setAuthError(err.message || 'Login failed');
      });
  };

  // Regular Email/Password Signup
  const handleEmailSignup = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    fetch('/api/auth/signup-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: signupName,
        email: signupEmail,
        phone: signupPhone,
        password: signupPassword
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data;
      })
      .then(data => {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setLoginModalOpen(false);
        
        // Reset forms
        setSignupName('');
        setSignupEmail('');
        setSignupPhone('');
        setSignupPassword('');

        showToast(`Account created successfully! Welcome, ${data.user.name}! 🎉`, 'success');
      })
      .catch(err => {
        setAuthError(err.message || 'Signup failed');
      });
  };

  // Forgot Password Handler (local simulation - shows message to contact support)
  const handleForgotPassword = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!forgotEmail.trim()) {
      setAuthError('Please enter your registered email address.');
      return;
    }
    setAuthSuccess(`If an account exists for ${forgotEmail}, a password reset link has been sent. Please check your inbox or contact support@mrco.com`);
    setForgotEmail('');
  };



  const handleCheckoutInitiate = (meta) => {
    setCheckoutMeta(meta);
    setCurrentTab('checkout');
  };

  const handleOrderSuccess = () => {
    setCart([]); // Clear Cart
    setCurrentTab('orders');
    setGlobalCouponCode('');
    showToast('Order placed successfully! 🎉', 'success');
  };

  const hideHeaderFooter = ['admin', 'orders', 'account', 'analytics'].includes(currentTab);

  return (
    <div className="app-container">
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Header Navigation */}
      {!hideHeaderFooter && (
        <Navbar 
          user={user} 
          cart={cart} 
          onOpenLogin={handleOpenLoginModal} 
          onLogout={handleLogout}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenAccount={() => user ? setCurrentTab('account') : handleOpenLoginModal(() => setCurrentTab('account'))}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          wishlistCount={wishlist.length}
          storeConfig={storeConfig}
        />
      )}

      {/* Main Pages router */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', minHeight: '100%' }}
          >
            {currentTab === 'home' && (
              <Home 
                products={products} 
                productsLoading={productsLoading}
                onAddToCart={handleAddToCart} 
                setCurrentTab={setCurrentTab}
                setCategoryFilter={setCategoryFilter}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                isInWishlist={isInWishlist}
                recentlyViewed={recentlyViewed}
                setSelectedProductId={setSelectedProductId}
                onTrackView={handleTrackView}
              />
            )}
            
            {currentTab === 'products' && (
              <Products 
                products={products} 
                productsLoading={productsLoading}
                onAddToCart={handleAddToCart}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                onSelectProduct={setSelectedProductId}
                setCurrentTab={setCurrentTab}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                isInWishlist={isInWishlist}
                compareList={compareList}
                onToggleCompare={handleToggleCompare}
                isInCompare={isInCompare}
                onQuickView={handleQuickView}
                recentlyViewed={recentlyViewed}
                onTrackView={handleTrackView}
              />
            )}

            {currentTab === 'product-detail' && (
              <ProductDetail 
                productId={selectedProductId}
                onAddToCart={handleAddToCart}
                user={user}
                onOpenLogin={() => handleOpenLoginModal()}
                onTrackView={handleTrackView}
                showToast={showToast}
                globalCouponCode={globalCouponCode}
                setGlobalCouponCode={setGlobalCouponCode}
              />
            )}

            {currentTab === 'about' && (
              <About setCurrentTab={setCurrentTab} />
            )}

            {currentTab === 'privacy' && (
              <DynamicPage slug="privacy" />
            )}

            {currentTab === 'terms' && (
              <DynamicPage slug="terms" />
            )}

            {currentTab === 'refund' && (
              <DynamicPage slug="refund" />
            )}

            {currentTab === 'contact' && (
              <Contact />
            )}

            {currentTab === 'cart' && (
              <Cart 
                cart={cart}
                onUpdateQty={handleUpdateCartQty}
                onRemove={handleRemoveCartItem}
                onSaveForLater={handleSaveForLater}
                savedItems={savedItems}
                onMoveToCart={handleMoveToCart}
                onRemoveSaved={handleRemoveSaved}
                onCheckout={handleCheckoutInitiate}
                user={user}
                onOpenLogin={handleOpenLoginModal}
                globalCouponCode={globalCouponCode}
                setGlobalCouponCode={setGlobalCouponCode}
                setCurrentTab={setCurrentTab}
              />
            )}

            {currentTab === 'checkout' && (
              <Checkout 
                cart={cart}
                checkoutMeta={checkoutMeta}
                onOrderSuccess={handleOrderSuccess}
                onBackToCart={() => setCurrentTab('cart')}
                setCurrentTab={setCurrentTab}
                globalCouponCode={globalCouponCode}
                setGlobalCouponCode={setGlobalCouponCode}
              />
            )}

            {currentTab === 'wishlist' && (
              <div className="container" style={{ marginTop: '2rem' }}>
                <Wishlist
                  wishlist={wishlist}
                  onRemoveFromWishlist={handleRemoveFromWishlist}
                  onAddToCart={handleAddToCart}
                  setCurrentTab={setCurrentTab}
                />
              </div>
            )}

            {currentTab === 'orders' && (
              <CustomerDashboard 
                user={user}
                onProfileUpdate={handleProfileUpdate}
                onReorder={handleReorderCart}
                setCurrentTab={setCurrentTab}
                initialTab="orders"
                onLogout={handleLogout}
              />
            )}

            {currentTab === 'admin' && (
              <AdminDashboard 
                user={user} 
                onLogout={handleLogout}
                storeConfig={storeConfig}
                setStoreConfig={setStoreConfig}
              />
            )}

            {currentTab === 'account' && (
              <CustomerDashboard 
                user={user}
                onProfileUpdate={handleProfileUpdate}
                onReorder={handleReorderCart}
                setCurrentTab={setCurrentTab}
                initialTab="profile"
                onLogout={handleLogout}
              />
            )}

            {currentTab === 'analytics' && (
              <CustomerDashboard 
                user={user}
                onProfileUpdate={handleProfileUpdate}
                onReorder={handleReorderCart}
                setCurrentTab={setCurrentTab}
                initialTab="analytics"
                onLogout={handleLogout}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
          onBuyNow={() => setCurrentTab('checkout')}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => setCurrentTab('checkout')}
      />

      {/* Product Compare Floating Bar */}
      {compareList.length > 0 && !showCompareModal && (
        <div className="compare-floating-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>📊 Compare ({compareList.length}/3)</span>
            <div className="compare-pills">
              {compareList.map(p => (
                <div key={p.id} className="compare-pill">
                  {p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name}
                  <button onClick={() => handleRemoveCompare(p.id)}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowCompareModal(true)}
              disabled={compareList.length < 2}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              Compare Now
            </button>
            <button 
              className="btn btn-outline" 
              onClick={handleClearCompare}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Product Compare Modal */}
      {showCompareModal && (
        <ProductCompare
          compareProducts={compareList}
          onRemoveCompare={handleRemoveCompare}
          onAddToCart={handleAddToCart}
          onClearCompare={handleClearCompare}
        />
      )}

      {/* Auth Modal Overlay */}
      {loginModalOpen && (
        <div className="modal-overlay" onClick={() => setLoginModalOpen(false)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="payment-modal-header" style={{ backgroundColor: 'var(--secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }}>
              <h3 style={{ color: 'white', fontFamily: 'var(--font-body)', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Account Access</h3>
              <button 
                onClick={() => setLoginModalOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            <div className="payment-modal-body" style={{ padding: '1.5rem' }}>
              {/* Tab Navigation */}
              <div className="auth-modal-tabs">
                <button 
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                >
                  Log In
                </button>
                <button 
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                  className={`auth-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
                >
                  Sign Up
                </button>
              </div>
              {authMode === 'forgot' && (
                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} className="auth-back-link">← Back to Login</button>
                  <span style={{ fontWeight: 'bold', color: 'var(--text)', fontSize: '0.95rem' }}>Reset Password</span>
                </div>
              )}

              {authError && (
                <div style={{ backgroundColor: '#FFEBEE', color: 'var(--error)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div style={{ backgroundColor: '#E8F5E9', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* Form Modes */}
              {authMode === 'login' ? (
                <form onSubmit={handleEmailLogin}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="name@example.com" 
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Password</label>
                    <div className="auth-password-wrapper">
                      <input 
                        type={showLoginPassword ? "text" : "password"} 
                        className="form-input" 
                        placeholder="••••••••" 
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        required 
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button 
                        type="button" 
                        className="auth-password-toggle"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
                    <button 
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthSuccess(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)', fontSize: '0.8rem', textDecoration: 'underline', padding: 0 }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}>
                    Log In Securely
                  </button>

                  {/* Quick Fill Demo Credentials */}
                  <div style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#FFF8F0',
                    border: '1px solid var(--primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      🔑 Quick Demo Credentials (1-Click Fill):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div 
                        onClick={() => {
                          setLoginEmail('raj@gmail.com');
                          setLoginPassword('user123');
                          setAuthError('');
                        }}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '0.5rem 0.75rem', 
                          backgroundColor: 'white', 
                          border: '1px solid var(--border)', 
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer'
                        }}
                        className="spring-bounce"
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--text)' }}>👤 Customer / User</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>raj@gmail.com • user123</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--secondary)', backgroundColor: '#FFF3E0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Fill ⚡</span>
                      </div>

                      <div 
                        onClick={() => {
                          setLoginEmail('admin@mrco.com');
                          setLoginPassword('admin123');
                          setAuthError('');
                        }}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '0.5rem 0.75rem', 
                          backgroundColor: 'white', 
                          border: '1px solid var(--secondary)', 
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer'
                        }}
                        className="spring-bounce"
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--secondary)' }}>👑 Admin Owner</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>admin@mrco.com • admin123</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'white', backgroundColor: 'var(--secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Fill ⚡</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '1.25rem', color: 'var(--text-light)' }}>
                    Don't have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Sign Up
                    </button>
                  </p>
                </form>
              ) : authMode === 'forgot' ? (
                <form onSubmit={handleForgotPassword}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1.25rem' }}>
                    Enter your registered email address and we'll send you a password reset link.
                  </p>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Registered Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="name@example.com" 
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}>
                    Send Reset Link
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '1rem', color: 'var(--text-light)' }}>
                    Or contact us at <b>support@mrco.com</b>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleEmailSignup}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Full Name" 
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="Email Address" 
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Mobile Number</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ border: '1px solid var(--border)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: '#EEE', fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 'bold' }}>+91</span>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Mobile Number" 
                        maxLength="10"
                        value={signupPhone} 
                        onChange={e => setSignupPhone(e.target.value.replace(/\D/g, ''))} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Password</label>
                    <div className="auth-password-wrapper">
                      <input 
                        type={showSignupPassword ? "text" : "password"} 
                        className="form-input" 
                        placeholder="Password" 
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        required 
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button 
                        type="button" 
                        className="auth-password-toggle"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                      >
                        {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}>
                    Create Account
                  </button>



                  <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '1.25rem', color: 'var(--text-light)' }}>
                    Already have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Log In
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Details */}
      {!hideHeaderFooter && <Footer setCurrentTab={setCurrentTab} storeConfig={storeConfig} />}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title="Back to Top">
          <ArrowUp size={22} />
        </button>
      )}

      {/* Floating WhatsApp Chat */}
      <a 
        href={`https://wa.me/${(storeConfig?.phone || '919876543210').replace(/[^0-9]/g, '')}`} 
        className="whatsapp-float" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" style={{ width: '35px', height: '35px' }}>
          {/* FontAwesome Free WhatsApp Icon Path */}
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
      </a>

      {/* Mobile Bottom Navigation Bar */}
      {!hideHeaderFooter && (
        <BottomNav 
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          wishlistCount={wishlist.length}
          user={user}
          onOpenLogin={handleOpenLoginModal}
        />
      )}
    </div>
  );
}
