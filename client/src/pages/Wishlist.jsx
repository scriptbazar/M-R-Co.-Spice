import { Heart, ShoppingCart, Trash2, PackageOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Wishlist({ wishlist, onRemoveFromWishlist, onAddToCart, setCurrentTab }) {
  if (!wishlist || wishlist.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '5rem 2rem', 
        backgroundColor: 'white', 
        borderRadius: 'var(--radius-lg)', 
        boxShadow: 'var(--shadow-md)', 
        border: '1px solid var(--border)', 
        marginBottom: '3rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
          style={{ 
          width: '100px', 
          height: '100px', 
          borderRadius: '50%', 
          backgroundColor: '#FFEBEE', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'var(--error)',
          boxShadow: 'inset 0 4px 10px rgba(211, 47, 47, 0.05)',
          animation: 'heartPulse 1.5s ease-in-out infinite'
        }}>
          <Heart size={42} fill="var(--error)" style={{ strokeWidth: '1.5px' }} />
        </motion.div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--text)' }}>Your Wishlist is Empty</h3>
        <p style={{ color: 'var(--text-light)', maxWidth: '420px', fontSize: '1rem', lineHeight: '1.6', margin: '0 auto' }}>
          Tap the heart icon on any artisanal blend or stone-ground powder to build your personal selection of favorites.
        </p>
        <button 
          onClick={() => setCurrentTab('products')} 
          className="btn btn-primary" 
          style={{ padding: '0.8rem 2.2rem', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-md)' }}
        >
          <PackageOpen size={18} /> Explore Spices Catalog
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            💖 My Wishlist
          </h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      <div className="wishlist-grid">
        {wishlist.map((product) => {
          const defaultVariant = product.variants?.[0] || { price: 0, weight_variant: '', stock: 0 };

          return (
            <div key={product.id} className="card" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
              {/* Remove from wishlist */}
              <button
                onClick={() => onRemoveFromWishlist(product.id)}
                className="wishlist-heart-btn"
                style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 5 }}
                title="Remove from Wishlist"
              >
                <Heart size={22} fill="var(--error)" color="var(--error)" />
              </button>

              {/* Image */}
              <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                {product.images && product.images.length > 0 && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fb = e.target.parentElement.querySelector('.wl-fallback');
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="wl-fallback"
                  style={{
                    display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%',
                    background: 'linear-gradient(135deg, #FFE0B2, #FFF8F0)'
                  }}
                >
                  <span style={{ fontSize: '3rem' }}>🌿</span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '1.25rem' }}>
                <span className="badge badge-category" style={{ marginBottom: '0.5rem' }}>{product.category}</span>
                <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1rem',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>From</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                      ₹{defaultVariant.price}
                      <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-light)' }}> / {defaultVariant.weight_variant}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => onRemoveFromWishlist(product.id)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => onAddToCart(product, defaultVariant)}
                      disabled={defaultVariant.stock === 0}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      <ShoppingCart size={14} /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
