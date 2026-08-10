import React, { useState, useEffect } from 'react';
import { ShoppingBag, User, LogOut, ShieldAlert, Search, Heart, Menu, X } from 'lucide-react';

export default function Navbar({ user, cart, onOpenLogin, onLogout, currentTab, setCurrentTab, onOpenAccount, searchQuery, setSearchQuery, wishlistCount = 0, storeConfig }) {
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('home')}>
          {storeConfig?.logo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img 
                src={storeConfig.logo} 
                alt={storeConfig.brand || "M & R Co."} 
                style={{ height: '40px', objectFit: 'contain', borderRadius: '4px' }} 
              />
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: 'var(--secondary)' }}>
                {storeConfig.brand || "M & R Co."}
              </span>
            </div>
          ) : (
            <h1>
              <span style={{ color: 'var(--primary)' }}>🌿</span> {storeConfig?.brand || "M & R Co."}
            </h1>
          )}
        </div>

        <ul className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <li>
            <button
              onClick={() => { setCurrentTab('home'); setIsMobileMenuOpen(false); }}
              style={{
                background: 'none',
                border: 'none',
                fontWeight: currentTab === 'home' ? '600' : '400',
                color: currentTab === 'home' ? 'var(--secondary)' : 'var(--text)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '1rem'
              }}
            >
              Home
            </button>
          </li>
          <li>
            <button
              onClick={() => { setCurrentTab('products'); setIsMobileMenuOpen(false); }}
              style={{
                background: 'none',
                border: 'none',
                fontWeight: currentTab === 'products' ? '600' : '400',
                color: currentTab === 'products' ? 'var(--secondary)' : 'var(--text)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '1rem'
              }}
            >
              Products
            </button>
          </li>
          <li>
            <button
              onClick={() => { setCurrentTab('about'); setIsMobileMenuOpen(false); }}
              style={{
                background: 'none',
                border: 'none',
                fontWeight: currentTab === 'about' ? '600' : '400',
                color: currentTab === 'about' ? 'var(--secondary)' : 'var(--text)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '1rem'
              }}
            >
              Our Story
            </button>
          </li>

          {(user?.role === 'admin' || user?.role === 'staff') && (
            <li>
              <button
                onClick={() => { setCurrentTab('admin'); setIsMobileMenuOpen(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: currentTab === 'admin' ? '600' : '400',
                  color: currentTab === 'admin' ? 'var(--tertiary)' : 'var(--text)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <ShieldAlert size={16} /> Admin
              </button>
            </li>
          )}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          
          <button 
            className="navbar-mobile-toggle" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Search Bar */}
          <div className="navbar-search" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Search spices..." 
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setCurrentTab('products');
              }}
              style={{
                padding: '0.5rem 1rem 0.5rem 2.2rem',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                width: '180px',
                transition: 'border-color 0.2s'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-light)' }} />
          </div>

          {/* Wishlist Button */}
          {(!user || user?.role === 'customer') && (
            <button
              onClick={() => setCurrentTab('wishlist')}
              className="spring-bounce"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                color: currentTab === 'wishlist' ? 'var(--error)' : 'var(--text)'
              }}
              title="My Wishlist"
            >
              <Heart size={22} fill={wishlistCount > 0 ? 'var(--error)' : 'none'} color={wishlistCount > 0 ? 'var(--error)' : 'currentColor'} />
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-10px',
                    backgroundColor: 'var(--error)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* Cart Button */}
          {(!user || user?.role === 'customer') && (
            <button
              onClick={() => setCurrentTab('cart')}
              className="spring-bounce"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text)'
              }}
            >
              <ShoppingBag size={24} />
              {cartItemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-10px',
                    backgroundColor: 'var(--secondary)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                >
                  {cartItemCount}
                </span>
              )}
            </button>
          )}

          {/* User Section */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', cursor: 'pointer' }}
                onClick={onOpenAccount}
                title="View My Account"
              >
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'capitalize' }}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-light)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onOpenLogin} style={{ padding: '0.5rem 1rem' }}>
              <User size={18} /> Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
