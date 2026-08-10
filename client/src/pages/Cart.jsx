import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShoppingCart, ArrowRight, Heart, Gift, Sparkles } from 'lucide-react';

export default function Cart({ cart, onUpdateQty, onRemove, onSaveForLater, savedItems, onMoveToCart, onRemoveSaved, onCheckout, user, onOpenLogin, globalCouponCode, setGlobalCouponCode, setCurrentTab }) {
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [couponError, setCouponError] = useState('');

  const [shippingCost, setShippingCost] = useState(49);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [usingDynamicShipping, setUsingDynamicShipping] = useState(false);
  const [shippingLabel, setShippingLabel] = useState('Delivery Charges:');

  const activeSubtotal = cart.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const shipping = shippingCost;
  
  // Calculate discount
  const finalDiscount = discount;
  const total = Math.max(0, activeSubtotal - finalDiscount + shipping);

  // Dynamically calculate estimated shipping rates if logged in and has address
  React.useEffect(() => {
    if (!user || cart.length === 0) {
      setShippingCost(activeSubtotal > 500 || activeSubtotal === 0 ? 0 : 49);
      setUsingDynamicShipping(false);
      setShippingLabel('Delivery Charges:');
      return;
    }

    setShippingLoading(true);
    fetch('/api/auth/addresses', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(addresses => {
        if (!Array.isArray(addresses) || addresses.length === 0) {
          setShippingCost(activeSubtotal > 500 || activeSubtotal === 0 ? 0 : 49);
          setUsingDynamicShipping(false);
          setShippingLabel('Delivery Charges (No address saved):');
          setShippingLoading(false);
          return;
        }

        const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
        
        const orderItems = cart.map(item => ({
          product_id: item.product.id,
          variant_id: item.variant.id,
          quantity: item.quantity
        }));

        return fetch('/api/orders/calculate-shipping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            address_id: defaultAddr.id,
            items: orderItems,
            payment_method: 'COD'
          })
        });
      })
      .then(res => {
        if (!res) return;
        return res.json();
      })
      .then(data => {
        if (data && data.success && data.options && data.options.length > 0) {
          const option = data.options[0];
          setShippingCost(option.cost);
          setUsingDynamicShipping(true);
          setShippingLabel(`Delivery (${option.name}):`);
        } else {
          setShippingCost(activeSubtotal > 500 || activeSubtotal === 0 ? 0 : 49);
          setUsingDynamicShipping(false);
          setShippingLabel('Delivery Charges:');
        }
        setShippingLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dynamic shipping for cart:', err);
        setShippingCost(activeSubtotal > 500 || activeSubtotal === 0 ? 0 : 49);
        setUsingDynamicShipping(false);
        setShippingLabel('Delivery Charges:');
        setShippingLoading(false);
      });
  }, [user, cart, activeSubtotal]);

  // Auto-apply globalCouponCode when it changes or when the cart subtotal changes
  React.useEffect(() => {
    if (globalCouponCode && couponApplied !== globalCouponCode && activeSubtotal > 0) {
      setCouponError('');
      fetch('/api/orders/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ coupon_code: globalCouponCode, cart_amount: activeSubtotal })
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to validate coupon');
          return data;
        })
        .then(data => {
          setCouponApplied(data.code);
          setDiscount(data.discount_amount);
        })
        .catch(err => {
          setCouponError(err.message);
          setCouponApplied('');
          setDiscount(0);
        });
    } else if (!globalCouponCode && couponApplied) {
      setCouponApplied('');
      setDiscount(0);
    }
  }, [globalCouponCode, activeSubtotal]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    fetch('/api/orders/validate-coupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ coupon_code: code, cart_amount: activeSubtotal })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to validate coupon');
        return data;
      })
      .then(data => {
        setCouponApplied(data.code);
        setDiscount(data.discount_amount);
        setCouponCode('');
        setGlobalCouponCode(data.code); // Sync globally
      })
      .catch(err => {
        setCouponError(err.message);
      });
  };

  const handleRemoveCoupon = () => {
    setCouponApplied('');
    setDiscount(0);
    setGlobalCouponCode(''); // Sync globally
  };

  const handleCheckoutClick = () => {
    if (!user) {
      onOpenLogin(() => onCheckout({ discount: finalDiscount, code: couponApplied }));
    } else {
      onCheckout({ discount: finalDiscount, code: couponApplied });
    }
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Shopping Cart</h2>

      {cart.length === 0 ? (
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
            backgroundColor: '#FFE8D6', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--secondary)',
            boxShadow: 'inset 0 4px 10px rgba(193, 68, 14, 0.05)'
          }}>
            <ShoppingCart size={42} style={{ strokeWidth: '1.5px' }} />
          </motion.div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--text)' }}>Your Spice Cart is Empty</h3>
          <p style={{ color: 'var(--text-light)', maxWidth: '420px', fontSize: '1rem', lineHeight: '1.6', margin: '0 auto' }}>
            Add our hand-selected, sun-dried, and slow stone-ground artisanal spices to start cooking delicious, aromatic meals.
          </p>
          <button 
            onClick={() => setCurrentTab('products')} 
            className="btn btn-secondary" 
            style={{ padding: '0.8rem 2.2rem', cursor: 'pointer', fontSize: '1rem', boxShadow: 'var(--shadow-md)' }}
          >
            Explore Spices Catalog
          </button>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Popular categories:</span>
            {['Powders', 'Blends', 'Combos'].map((c) => (
              <button 
                key={c}
                onClick={() => { setCurrentTab('products'); }}
                style={{ 
                  background: 'none', 
                  border: '1px solid var(--border)', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '15px', 
                  fontSize: '0.8rem', 
                  color: 'var(--text)', 
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--secondary)'; e.currentTarget.style.color = 'var(--secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Active Cart Items */}
          <div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ fontWeight: '600', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                Items ({cart.length})
              </div>
              
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.variant.id}`} className="cart-item">
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden', flexShrink: 0 }}>
                      {item.product.images && item.product.images.length > 0 && item.product.images[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                      ) : null}
                      <span style={{ display: item.product.images && item.product.images.length > 0 && item.product.images[0] ? 'none' : 'flex' }}>🌿</span>
                    </div>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: '600', fontSize: '1rem' }}>{item.product.name}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        Weight: {item.variant.weight_variant}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                        ₹{item.variant.price} / item
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    {/* Quantity Edit */}
                    <div className="quantity-controls">
                      <button className="qty-btn" onClick={() => onUpdateQty(item.product.id, item.variant.id, item.quantity - 1)}>-</button>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{item.quantity}</span>
                      <button className="qty-btn" onClick={() => onUpdateQty(item.product.id, item.variant.id, item.quantity + 1)}>+</button>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
                        ₹{(item.variant.price * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => onSaveForLater(item)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }} 
                        title="Save for Later"
                      >
                        <Heart size={18} />
                      </button>
                      <button 
                        onClick={() => onRemove(item.product.id, item.variant.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }} 
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Pricing summary */}
          <div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', fontFamily: 'var(--font-body)' }}>Order Summary</h3>
              
              {/* Promo Coupon box */}
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-light)' }}>Promo Coupon Code</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter Coupon Code" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value)}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} 
                  />
                  <button type="submit" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Apply</button>
                </div>
                {couponError && <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>{couponError}</span>}
                {couponApplied && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E8F5E9', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--success)' }}>
                    <span>Applied: <b>{couponApplied}</b></span>
                    <button type="button" onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Remove</button>
                  </div>
                )}
              </form>

              {/* Price Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div className="flex-between">
                  <span>Price Subtotal:</span>
                  <span>₹{activeSubtotal.toFixed(2)}</span>
                </div>
                {finalDiscount > 0 && (
                  <div className="flex-between" style={{ color: 'var(--success)', fontWeight: '500' }}>
                    <span>Coupon Discount:</span>
                    <span>-₹{finalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex-between">
                  <span>{shippingLabel}</span>
                  {shippingLoading ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Calculating...</span>
                  ) : (
                    <span>{shipping === 0 ? <span style={{ color: 'var(--success)' }}>FREE</span> : `₹${shipping.toFixed(2)}`}</span>
                  )}
                </div>
                {!usingDynamicShipping && shipping > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'orange', textAlign: 'right', marginTop: '-0.5rem' }}>
                    Shop for ₹{(500 - activeSubtotal).toFixed(2)} more for Free Shipping
                  </span>
                )}
                {usingDynamicShipping && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--success)', textAlign: 'right', marginTop: '-0.5rem' }}>
                    Calculated based on your default delivery address.
                  </span>
                )}
                <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--secondary)' }}>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button className="btn btn-secondary" onClick={handleCheckoutClick} style={{ width: '100%', marginTop: '1rem' }}>
                Proceed to Checkout <ArrowRight size={18} />
              </button>
              
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                <Sparkles size={14} color="var(--primary)" /> Small batch fresh ground guarantee.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save For Later Section */}
      {savedItems.length > 0 && (
        <section style={{ marginTop: '4rem', borderTop: '1px solid var(--border)', paddingTop: '2.5rem', marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={20} fill="var(--secondary)" color="var(--secondary)" /> Saved for Later
          </h3>
          <div className="card" style={{ padding: '1.5rem' }}>
            {savedItems.map((item) => (
              <div key={`${item.product.id}-${item.variant.id}`} className="cart-item">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '55px', height: '55px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', overflow: 'hidden', flexShrink: 0 }}>
                    {item.product.images && item.product.images.length > 0 && item.product.images[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                    ) : null}
                    <span style={{ display: item.product.images && item.product.images.length > 0 && item.product.images[0] ? 'none' : 'flex' }}>🌿</span>
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: '600', fontSize: '0.95rem' }}>{item.product.name}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      Weight: {item.variant.weight_variant}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                      ₹{item.variant.price}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => onMoveToCart(item)} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                    Move to Cart
                  </button>
                  <button 
                    onClick={() => onRemoveSaved(item.product.id, item.variant.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
