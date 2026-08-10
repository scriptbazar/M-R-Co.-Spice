import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cart = [], onUpdateQuantity, onRemoveItem, onCheckout }) {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const freeShippingThreshold = 499;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={22} color="var(--secondary)" />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>Your Shopping Bag</h3>
            <span className="badge badge-category" style={{ fontSize: '0.75rem' }}>{cart.length} {cart.length === 1 ? 'Item' : 'Items'}</span>
          </div>
          <button className="cart-drawer-close" onClick={onClose} aria-label="Close cart drawer">
            <X size={22} />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div style={{ padding: '0.75rem 1.25rem', backgroundColor: '#FFFDF0', borderBottom: '1px solid var(--border)' }}>
          {amountNeededForFreeShipping > 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '0.35rem' }}>
              Add <b>₹{amountNeededForFreeShipping}</b> more to get <b>FREE Shipping! 🚚</b>
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 'bold', marginBottom: '0.35rem' }}>
              🎉 You unlocked FREE Shipping!
            </div>
          )}
          <div style={{ height: '6px', backgroundColor: '#E0E0E0', borderRadius: '3px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                backgroundColor: amountNeededForFreeShipping === 0 ? 'var(--success)' : 'var(--secondary)', 
                width: `${freeShippingProgress}%`,
                transition: 'width 0.3s ease' 
              }} 
            />
          </div>
        </div>

        {/* Cart Body */}
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🧺</div>
              <h4>Your bag is empty</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>Explore our authentic spice catalog to add items.</p>
              <button 
                className="btn btn-outline" 
                onClick={onClose}
                style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map((item) => {
                const itemTotal = item.variant.price * item.quantity;
                return (
                  <div key={`${item.product.id}-${item.variant.id}`} className="cart-drawer-item">
                    <div className="cart-drawer-item-img">
                      {item.product.images && item.product.images[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} />
                      ) : (
                        <span>🌿</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                        {item.variant.weight_variant} • ₹{item.variant.price} each
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Quantity Counter */}
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                          <button 
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.variant.id, item.quantity - 1)}
                            style={{ padding: '0.25rem 0.5rem', background: '#F5F5F5', border: 'none', cursor: 'pointer' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ padding: '0 0.6rem', fontSize: '0.85rem', fontWeight: 'bold' }}>{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.variant.id, item.quantity + 1)}
                            style={{ padding: '0.25rem 0.5rem', background: '#F5F5F5', border: 'none', cursor: 'pointer' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--secondary)' }}>
                          ₹{itemTotal}
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      className="cart-drawer-remove"
                      onClick={() => onRemoveItem(item.product.id, item.variant.id)}
                      title="Remove item"
                    >
                      <Trash2 size={16} color="#999" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Subtotal</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--secondary)' }}>₹{subtotal}</span>
            </div>

            <button 
              className="btn btn-secondary spring-bounce" 
              onClick={() => {
                onClose();
                onCheckout();
              }}
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
