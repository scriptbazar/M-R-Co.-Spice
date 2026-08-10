import React from 'react';
import { X, Flame, Star, ShoppingCart } from 'lucide-react';

export default function ProductCompare({ compareProducts, onRemoveCompare, onAddToCart, onClearCompare }) {
  if (!compareProducts || compareProducts.length === 0) return null;

  const getAvgRating = (product) => {
    if (!product.reviews || product.reviews.length === 0) return null;
    return (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1);
  };

  return (
    <div className="compare-overlay" onClick={onClearCompare}>
      <div className="compare-modal" onClick={e => e.stopPropagation()}>
        <div className="compare-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>📊 Product Comparison</h3>
          <button onClick={onClearCompare} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
            <X size={22} />
          </button>
        </div>

        <div className="compare-table-wrapper">
          <table className="compare-table">
            <thead>
              <tr>
                <th style={{ width: '140px' }}>Feature</th>
                {compareProducts.map(p => (
                  <th key={p.id}>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => onRemoveCompare(p.id)}
                        style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={12} />
                      </button>
                      <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FFE0B2, #FFF8F0)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt={p.name} style={{ height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : <span style={{ fontSize: '2.5rem' }}>🌿</span>}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', textAlign: 'center' }}>{p.name}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="compare-label">Category</td>
                {compareProducts.map(p => (
                  <td key={p.id}>
                    <span className="badge badge-category">{p.category}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="compare-label">Price Range</td>
                {compareProducts.map(p => (
                  <td key={p.id} style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>
                    ₹{Math.min(...p.variants.map(v => v.price))} — ₹{Math.max(...p.variants.map(v => v.price))}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="compare-label">Spice Level</td>
                {compareProducts.map(p => (
                  <td key={p.id}>
                    <div style={{ display: 'flex', gap: '0.15rem' }}>
                      {[1, 2, 3, 4, 5].map(lvl => (
                        <Flame key={lvl} size={14} fill={lvl <= p.spice_level ? 'var(--secondary)' : 'none'} color={lvl <= p.spice_level ? 'var(--secondary)' : '#ccc'} />
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="compare-label">Rating</td>
                {compareProducts.map(p => {
                  const avg = getAvgRating(p);
                  return (
                    <td key={p.id}>
                      {avg ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <div style={{ display: 'flex', color: '#FFB300' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} fill={i < Math.round(parseFloat(avg)) ? '#FFB300' : 'none'} />
                            ))}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{avg}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>No reviews</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="compare-label">Variants</td>
                {compareProducts.map(p => (
                  <td key={p.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {p.variants.map(v => (
                        <span key={v.id} style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          {v.weight_variant} — ₹{v.price} {v.stock === 0 ? '❌' : `(${v.stock} in stock)`}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="compare-label">Description</td>
                {compareProducts.map(p => (
                  <td key={p.id} style={{ fontSize: '0.8rem', color: 'var(--text-light)', lineHeight: '1.4' }}>
                    {p.description.length > 120 ? p.description.slice(0, 120) + '...' : p.description}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="compare-label">Action</td>
                {compareProducts.map(p => {
                  const defaultVar = p.variants?.[0];
                  return (
                    <td key={p.id}>
                      <button
                        className="btn btn-primary"
                        onClick={() => onAddToCart(p, defaultVar)}
                        disabled={!defaultVar || defaultVar.stock === 0}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        <ShoppingCart size={14} /> Add to Cart
                      </button>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
