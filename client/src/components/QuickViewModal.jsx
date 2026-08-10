import React, { useState } from 'react';
import { X, ShoppingCart, Flame, Star, Eye } from 'lucide-react';

export default function QuickViewModal({ product, onClose, onAddToCart, onBuyNow }) {
  const [activeVariant, setActiveVariant] = useState(product?.variants?.[0] || null);

  if (!product) return null;

  const avgRating = product.reviews && product.reviews.length > 0
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="quick-view-modal" onClick={e => e.stopPropagation()}>
        <button className="quick-view-close" onClick={onClose}>
          <X size={22} />
        </button>

        <div className="quick-view-content">
          {/* Left: Image */}
          <div className="quick-view-image">
            {product.images && product.images.length > 0 && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fb = e.target.parentElement.querySelector('.qv-fallback');
                  if (fb) fb.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="qv-fallback"
              style={{
                display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                background: 'linear-gradient(135deg, #FFE0B2 0%, #FFF8F0 100%)'
              }}
            >
              <span style={{ fontSize: '5rem' }}>🌿</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--secondary)', textTransform: 'uppercase' }}>
                {product.category}
              </span>
            </div>
          </div>

          {/* Right: Details */}
          <div className="quick-view-details">
            <span className="badge badge-category" style={{ marginBottom: '0.5rem' }}>{product.category}</span>
            <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem', lineHeight: '1.2' }}>
              {product.name}
            </h3>

            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', color: '#FFB300' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(parseFloat(avgRating)) ? '#FFB300' : 'none'} />
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  {avgRating} ({product.reviews.length} reviews)
                </span>
              </div>
            )}

            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              {product.description}
            </p>

            {/* Spice Level */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-light)', marginRight: '0.5rem' }}>Heat:</span>
              {[1, 2, 3, 4, 5].map(lvl => (
                <Flame key={lvl} size={16} fill={lvl <= product.spice_level ? 'var(--secondary)' : 'none'} color={lvl <= product.spice_level ? 'var(--secondary)' : '#ccc'} />
              ))}
            </div>

            {/* Variant Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-light)', display: 'block', marginBottom: '0.5rem' }}>
                Choose Weight:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    className={`variant-btn ${activeVariant?.id === v.id ? 'active' : ''}`}
                    onClick={() => setActiveVariant(v)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                  >
                    {v.weight_variant} — ₹{v.price}
                    {v.stock === 0 && ' (Out)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Add to Cart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 'auto', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Price</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                  ₹{activeVariant?.price || 0}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    onAddToCart(product, activeVariant);
                    onClose();
                  }}
                  disabled={!activeVariant || activeVariant.stock === 0}
                  style={{ flex: 1, padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button
                  className="btn btn-secondary spring-bounce"
                  onClick={() => {
                    onAddToCart(product, activeVariant);
                    onClose();
                    if (onBuyNow) onBuyNow();
                  }}
                  disabled={!activeVariant || activeVariant.stock === 0}
                  style={{ flex: 1, padding: '0.75rem 0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  ⚡ Buy Now
                </button>
              </div>
            </div>

            {activeVariant && activeVariant.stock > 0 && activeVariant.stock < 10 && (
              <div style={{ fontSize: '0.75rem', color: 'orange', fontWeight: '600', marginTop: '0.5rem' }}>
                ⚡ Only {activeVariant.stock} left in stock!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
