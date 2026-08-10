import React, { useState, useEffect } from 'react';
import { Flame, Star, ShieldCheck, ShoppingCart, MessageSquare, AlertCircle } from 'lucide-react';
import { showToast } from '../components/Toast';

export default function ProductDetail({ productId, onAddToCart, user, onOpenLogin, onTrackView, showToast: showToastProp, globalCouponCode, setGlobalCouponCode, setCurrentTab }) {
  const [product, setProduct] = useState(null);
  const [activeVariant, setActiveVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [isAdded, setIsAdded] = useState(false);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({ display: 'none' });

  const fetchCoupons = React.useCallback(() => {
    fetch('/api/products/public/coupons')
      .then(res => res.json())
      .then(data => {
        setCoupons(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Error fetching public coupons:', err));
  }, []);

  const fetchProduct = React.useCallback(() => {
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        if (data.variants && data.variants.length) {
          setActiveVariant(data.variants[0]);
        }
        // Track recently viewed
        if (onTrackView) onTrackView(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProduct();
    fetchCoupons();
  }, [fetchProduct, fetchCoupons]);



  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setReviewError('Review comment cannot be empty');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ rating, comment })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to submit review');
        }
        return data;
      })
      .then(() => {
        setReviewSuccess('Thank you! Your verified review has been posted successfully.');
        setComment('');
        setRating(5);
        fetchProduct(); // Refresh reviews list
      })
      .catch(err => {
        setReviewError(err.message);
      })
      .finally(() => {
        setSubmittingReview(false);
      });
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="payment-loader"></div>
        <p>Loading spice profile...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--error)' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 1rem auto' }} />
        <h3>Error loading product details</h3>
        <p>{error || 'Something went wrong.'}</p>
      </div>
    );
  }

  const getSpiceTheme = () => {
    const name = (product?.name || '').toLowerCase();
    if (name.includes('chilli') || name.includes('mirch')) {
      return { secondary: '#A81F0E', secondaryHover: '#8A1507', bg: '#FFF5F5' };
    }
    if (name.includes('turmeric') || name.includes('haldi')) {
      return { secondary: '#D48C00', secondaryHover: '#B27300', bg: '#FFFDF0' };
    }
    if (name.includes('coriander') || name.includes('dhaniya') || name.includes('elaichi') || name.includes('green') || name.includes('herb')) {
      return { secondary: '#557A2A', secondaryHover: '#446221', bg: '#F8FAF2' };
    }
    if (name.includes('masala') || name.includes('blend') || name.includes('biryani') || name.includes('garam') || name.includes('combo')) {
      return { secondary: '#8B5A2B', secondaryHover: '#6E451E', bg: '#FDF8F4' };
    }
    return { secondary: '#C1440E', secondaryHover: '#a53609', bg: '#FFF8F0' };
  };

  const theme = getSpiceTheme();

  // Magnifier zoom lens state & move handlers

  const handleMouseMove = (e) => {
    if (window.innerWidth <= 768) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${product?.images?.[0] || ''})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '220%'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  return (
    <div 
      className="container product-detail-wrapper" 
      style={{ 
        marginTop: '2rem',
        '--theme-secondary': theme.secondary,
        '--theme-secondary-hover': theme.secondaryHover,
        '--theme-secondary-bg': `${theme.secondary}15`,
        '--theme-secondary-border': `${theme.secondary}30`
      }}
    >

      {/* Product Detail Split Layout */}
      <div className="product-detail-split">
        {/* Left Side: Sticky Image box with Magnifier Zoom */}
        <div className="detail-image-sticky">
          <div 
            className="detail-img-box" 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: theme.bg, 
              borderRadius: 'var(--radius-lg)', 
              overflow: 'hidden', 
              minHeight: '400px',
              border: `1.5px dashed ${theme.secondary}20`,
              boxShadow: 'var(--shadow-md)',
              cursor: product.images && product.images.length > 0 ? 'zoom-in' : 'default'
            }}
          >
            {product.images && product.images.length > 0 && product.images[0] ? (
              <>
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fb = e.target.parentElement.querySelector('span');
                    if (fb) fb.style.display = 'block';
                  }}
                />
                {/* Magnifier zoom overlay */}
                <div className="zoom-lens" style={zoomStyle} />
              </>
            ) : null}
            <span 
              style={{ 
                fontSize: '7rem', 
                display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'block' 
              }}
            >
              🌿
            </span>
          </div>
        </div>

        {/* Right Side: Details & Selection */}
        <div>
          <span className="badge badge-category" style={{ marginBottom: '0.75rem' }}>{product.category}</span>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', lineHeight: '1.2' }}>{product.name}</h2>
          
          {/* Average Rating summary */}
          {product.reviews && product.reviews.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', color: '#FFB300' }}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const avg = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
                  return <Star key={i} size={16} fill={i < Math.round(avg) ? '#FFB300' : 'none'} />;
                })}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: '500' }}>
                ({product.reviews.length} Verified Reviews)
              </span>
            </div>
          )}

          <p style={{ color: 'var(--text-light)', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            {product.description}
          </p>

          {/* Spice Level & Payments Row */}
          <div className="product-detail-spice-payment-row">
            {/* Left Column: Heat Spice Level */}
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-light)' }}>Heat Spice Level:</span>
              <div className="spice-level-bar" style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <Flame 
                    key={lvl} 
                    size={20} 
                    fill={lvl <= product.spice_level ? theme.secondary : 'none'} 
                    color={lvl <= product.spice_level ? theme.secondary : '#CCC'} 
                  />
                ))}
                <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', fontWeight: 'bold', color: product.spice_level > 3 ? 'var(--tertiary)' : 'var(--text)' }}>
                  {product.spice_level === 0 ? 'No Heat' : (product.spice_level <= 2 ? 'Mild Heat' : (product.spice_level <= 4 ? 'Medium Spicy' : 'Fiery Hot! 🔥'))}
                </span>
              </div>
            </div>
            
            {/* Right Column: Payment Methods */}
            <div className="product-detail-payment-col">
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-light)' }}>Accepted Payments:</span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', padding: '0.2rem 0.4rem', borderRadius: '4px', backgroundColor: '#E0F2F1', color: '#00695C' }}>
                  📱 UPI
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', padding: '0.2rem 0.4rem', borderRadius: '4px', backgroundColor: '#E3F2FD', color: '#0D47A1' }}>
                  💳 Card
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', padding: '0.2rem 0.4rem', borderRadius: '4px', backgroundColor: '#EDE7F6', color: '#4A148C' }}>
                  🏦 Net Banking
                </span>
              </div>
            </div>
          </div>

          {/* Dropdowns Row: Choose Weight Variant & Available Coupons */}
          <div className="product-detail-dropdowns-row">
            {/* Column 1: Choose Weight Variant */}
            <div>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.5rem' }}>
                Choose Weight Variant
              </label>
              <select 
                className="form-input" 
                value={activeVariant?.id || ''} 
                onChange={(e) => {
                  const selectedId = parseInt(e.target.value);
                  const v = product.variants.find(item => item.id === selectedId);
                  if (v) setActiveVariant(v);
                }}
                style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.stock === 0}>
                    {v.weight_variant} - ₹{v.price} {v.stock === 0 ? '(Out of stock)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Column 2: Available Offers & Coupons */}
            <div>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.5rem' }}>
                Available Offers & Coupons
              </label>
              <select 
                className="form-input custom-copied-badge" 
                value={globalCouponCode || ''} 
                onChange={(e) => {
                  const code = e.target.value;
                  setGlobalCouponCode(code);
                  if (!code) return;
                  navigator.clipboard.writeText(code);
                  if (showToastProp) {
                    showToastProp(`Coupon ${code} selected & copied! 🏷️`, 'success');
                  } else {
                    showToast(`Coupon ${code} selected & copied!`);
                  }
                }}
                style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem', cursor: 'pointer' }}
                disabled={!coupons || coupons.length === 0}
              >
                {coupons && coupons.length > 0 ? (
                  <>
                    <option value="">🏷️ Select Coupon to Copy & Apply</option>
                    {coupons.map((coupon) => (
                      <option key={coupon.id} value={coupon.code}>
                        {coupon.code} - {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`} OFF (Min: ₹{coupon.min_cart_amount})
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">No Active Coupons</option>
                )}
              </select>
            </div>
          </div>
                {/* Purchase details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Total Price</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.secondary }}>
                ₹{activeVariant?.price}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
              <button 
                className="btn btn-outline" 
                onClick={(e) => {
                  onAddToCart(product, activeVariant);
                  setIsAdded(true);
                  if (e && e.currentTarget) {
                    e.currentTarget.classList.add('btn-success-animation');
                    const btn = e.currentTarget;
                    setTimeout(() => {
                      if (btn) btn.classList.remove('btn-success-animation');
                    }, 500);
                  }
                  setTimeout(() => setIsAdded(false), 1500);
                }}
                disabled={!activeVariant || activeVariant.stock === 0}
                style={{ flex: 1, padding: '0.85rem 0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <ShoppingCart size={18} /> {isAdded ? '✓ Added' : 'Add to Cart'}
              </button>

              <button 
                className="btn btn-secondary spring-bounce" 
                onClick={() => {
                  onAddToCart(product, activeVariant);
                  if (setCurrentTab) setCurrentTab('checkout');
                }}
                disabled={!activeVariant || activeVariant.stock === 0}
                style={{ flex: 1, padding: '0.85rem 0.5rem', fontSize: '0.95rem', color: 'white', fontWeight: 'bold' }}
              >
                ⚡ Buy Now
              </button>
            </div>
          </div>

          {product.category === 'Combos' && product.combo_items && product.combo_items.length > 0 && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#F8F9FA', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              <h4 style={{ 
                fontFamily: 'var(--font-body)', 
                fontSize: '0.95rem', 
                fontWeight: 'bold', 
                marginBottom: '0.5rem', 
                color: theme.secondary 
              }}>
                📦 This Combo Pack Includes:
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {product.combo_items.map((item, idx) => (
                  <li key={idx} style={{ 
                    fontSize: '0.9rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>🌿</span>
                      <b>{item.product_name}</b>
                    </span>
                    <span style={{ 
                      backgroundColor: 'white', 
                      padding: '0.1rem 0.5rem', 
                      borderRadius: '4px', 
                      border: '1px solid var(--border)',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      Qty: {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FSSAI Badge & Preservative disclaimer */}
          <div className="product-detail-disclaimers-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
              <ShieldCheck size={18} color="var(--success)" />
              <span>100% Pure & Preservative-Free</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
              <ShieldCheck size={18} color="var(--success)" />
              <span>FSSAI License Compliant Packaging</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients & "How It's Made" Story */}
      <section className="product-detail-ingredients-section">
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Ingredients Used</h3>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {product.ingredients || '100% pure organically grown single-source spice root/seed. No added salts, starches, or artificial flavorings.'}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>How It's Handcrafted (Our USP Story)</h3>
          <p style={{ color: 'var(--text-light)', lineHeight: '1.6', fontSize: '1rem' }}>
            {product.how_its_made || 'Our spices are hand-sorted, triple washed, shade-dried, and then slow ground in a clean stone mortor. Grinding in small lots prevents high friction heat, which preserves the delicate volatile oils and colors.'}
          </p>
        </div>
      </section>

      {/* Verified Buyer Reviews & Rating */}
      <section style={{ marginTop: '4rem', borderTop: '1px solid var(--border)', paddingTop: '3rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Verified Customer Reviews & Ratings</h3>

        <div className="product-detail-reviews-grid">
          {/* Reviews List */}
          <div>
            {product.reviews && product.reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {product.reviews.map((rev) => (
                  <div key={rev.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{rev.user_name}</div>
                      <span className="badge badge-status-delivered" style={{ fontSize: '0.65rem' }}>Verified Buyer</span>
                    </div>
                    
                    <div style={{ display: 'flex', color: '#FFB300', gap: '0.1rem', marginBottom: '0.5rem' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < rev.rating ? '#FFB300' : 'none'} />
                      ))}
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                      "{rev.comment}"
                    </p>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
                      Reviewed on {new Date(rev.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <MessageSquare size={36} style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }} />
                <h4>No Reviews Yet</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Be the first verified customer to leave a review once you try this spice!</p>
              </div>
            )}
          </div>

          {/* Write a Review Form */}
          <div>
            <div className="card" style={{ padding: '2rem' }}>
              <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: '600', marginBottom: '1.25rem' }}>Share Your Experience</h4>
              
              {user ? (
                <form onSubmit={handleReviewSubmit}>
                  {reviewError && (
                    <div style={{ backgroundColor: '#FFEBEE', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <AlertCircle size={16} />
                      <span>{reviewError}</span>
                    </div>
                  )}

                  {reviewSuccess && (
                    <div style={{ backgroundColor: '#E8F5E9', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <ShieldCheck size={16} />
                      <span>{reviewSuccess}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Select Rating</label>
                    <div style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setRating(stars)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#FFB300' }}
                        >
                          <Star size={24} fill={stars <= rating ? '#FFB300' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Review Comment</label>
                    <textarea
                      className="form-input"
                      rows="4"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="What did you prepare with this spice? How was the taste and aroma?"
                      style={{ resize: 'none' }}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-secondary" style={{ width: '100%' }} disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.25rem' }}>
                    You must be logged in and have ordered this spice to write a review.
                  </p>
                  <button className="btn btn-primary" type="button" onClick={onOpenLogin} style={{ width: '100%' }}>
                    Login to Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
