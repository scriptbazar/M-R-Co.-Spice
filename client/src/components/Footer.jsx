import React from 'react';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

export default function Footer({ setCurrentTab, storeConfig }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3>{storeConfig?.brand || 'M & R Co.'}</h3>
            <p>100% Homemade, stone-ground, authentic Indian spices crafted with care. No artificial colors, preservatives, or fillers.</p>
            <div className="fssai-badge">
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Food Safety Standards</div>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary)' }}>FSSAI LIC NO: {storeConfig?.fssai || '22724999000123'}</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
              {storeConfig?.instagram && (
                <a href={storeConfig.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} aria-label="Instagram">
                  <Instagram size={20} />
                </a>
              )}
              {storeConfig?.facebook && (
                <a href={storeConfig.facebook} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} aria-label="Facebook">
                  <Facebook size={20} />
                </a>
              )}
              {storeConfig?.twitter && (
                <a href={storeConfig.twitter} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} aria-label="Twitter">
                  <Twitter size={20} />
                </a>
              )}
              {storeConfig?.youtube && (
                <a href={storeConfig.youtube} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} aria-label="YouTube">
                  <Youtube size={20} />
                </a>
              )}
            </div>
          </div>
          
          <div>
            <h3>Quick Links</h3>
            <ul style={{ padding: 0 }}>
              <li><a href="#home" onClick={(e) => { e.preventDefault(); setCurrentTab('home'); }}>Home Page</a></li>
              <li><a href="#products" onClick={(e) => { e.preventDefault(); setCurrentTab('products'); }}>All Spices</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); setCurrentTab('about'); }}>Our Story</a></li>
            </ul>
          </div>
          
          <div>
            <h3>Our Policies</h3>
            <ul style={{ padding: 0 }}>
              <li><a href="#privacy" onClick={(e) => { e.preventDefault(); setCurrentTab('privacy'); }}>Privacy Policy</a></li>
              <li><a href="#terms" onClick={(e) => { e.preventDefault(); setCurrentTab('terms'); }}>Terms & Conditions</a></li>
              <li><a href="#refund" onClick={(e) => { e.preventDefault(); setCurrentTab('refund'); }}>Refund & Returns</a></li>
            </ul>
          </div>
          
          <div>
            <h3>Contact Us</h3>
            <p style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentTab('contact')}>View Contact Details</p>
            <div style={{ whiteSpace: 'pre-line', marginBottom: '0.5rem' }}>{storeConfig?.address || 'H.No 12, Spice Garden Road,\nKhari Baoli, Old Delhi, India'}</div>
            <p>Phone: {storeConfig?.phone || '+91 98765 43210'}</p>
            <p>Email: {storeConfig?.email || 'support@mrco.com'}</p>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', opacity: 0.6 }}>
          &copy; {new Date().getFullYear()} {storeConfig?.brand || 'M & R Co.'}. All Rights Reserved. Crafted for spice lovers in India.
        </div>
      </div>
    </footer>
  );
}
