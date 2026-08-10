import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, MapPin, DollarSign, Activity } from 'lucide-react';

export default function UserAnalytics({ setCurrentTab }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="payment-loader"></div>
        <p>Analyzing your order records...</p>
      </div>
    );
  }

  // 1. Calculations & Metrics
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.payment_status === 'Paid' ? o.total_amount : 0), 0);
  const avgOrderValue = totalOrders > 0 ? (orders.reduce((sum, o) => sum + o.total_amount, 0) / totalOrders) : 0;
  
  // Geolocation locations count
  const geoLocations = orders.filter(o => o.ordered_lat && o.ordered_lon);
  const uniqueGeoCount = new Set(geoLocations.map(o => `${o.ordered_lat.toFixed(3)},${o.ordered_lon.toFixed(3)}`)).size;

  // Status distributions
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  // Product and Category counts
  const categoryCounts = {};
  const spiceCounts = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      // Find category of item (we can guess or mock, or read item category if backend provides it.
      // Wait, orders.js doesn't fetch category directly, but we can match products category since we have products list or we can use item product_name to categorize)
      // Actually, order items have product_id, price, quantity. 
      // Let's check item fields. In orders.js GET /:
      // item.product_name, item.product_images, item.weight_variant.
      // Since it doesn't return category directly in orders.js (it does join p.name, p.images), we can fall back to standard categorizations or fetch categories.
      // Wait, let's look at item fields in orders.js GET /:
      // "SELECT oi.*, p.name as product_name, p.images as product_images, pv.weight_variant"
      // Ah! Category isn't selected, but we can extract categories if we inspect product_name or if we use common keywords. Let's do keyword matching for safety:
      let cat = 'Powders';
      const name = item.product_name.toLowerCase();
      if (name.includes('combo') || name.includes('pack') || name.includes('set')) cat = 'Combos';
      else if (name.includes('blend') || name.includes('masala') || name.includes('garam')) cat = 'Blends';
      else if (name.includes('whole') || name.includes('sabut') || name.includes('seed')) cat = 'Whole';
      
      categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
      spiceCounts[item.product_name] = (spiceCounts[item.product_name] || 0) + item.quantity;
    });
  });

  // Sort top spices
  const topSpices = Object.entries(spiceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="container" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>My Spices Analytics</h2>
          <p style={{ color: 'var(--text-light)' }}>Personal insights and locations tracking for your organic homemade spice orders.</p>
        </div>
        <button className="btn btn-outline" onClick={() => setCurrentTab('orders')}>
          📦 View Order History
        </button>
      </div>

      {totalOrders === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <Activity size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3>No Analytics Available</h3>
          <p style={{ color: 'var(--text-light)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Please place your first order to generate personalized analytics reports.</p>
          <button className="btn btn-secondary" onClick={() => setCurrentTab('products')}>Explore Spices Catalog</button>
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--secondary)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FFE8D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={24} color="var(--secondary)" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Orders</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '0.15rem' }}>{totalOrders}</h3>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--success)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#E2F0D9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={24} color="var(--success)" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Spent</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '0.15rem', color: 'var(--success)' }}>₹{totalSpent.toFixed(2)}</h3>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #3498DB', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#EAF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={24} color="#3498DB" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Order</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '0.15rem' }}>₹{avgOrderValue.toFixed(2)}</h3>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FFF2CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={24} color="var(--primary)" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order GPS Locations</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '0.15rem' }}>{uniqueGeoCount}</h3>
              </div>
            </div>
          </div>

          {/* Graphical Analytics Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginBottom: '2.5rem' }}>
            {/* Left: Preferences */}
            <div className="card" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
              <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontFamily: 'var(--font-body)', fontWeight: 'bold' }}>
                🌿 Spice Category Preference
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {['Powders', 'Whole', 'Blends', 'Combos'].map(cat => {
                  const count = categoryCounts[cat] || 0;
                  const totalItems = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
                  const percentage = totalItems > 0 ? ((count / totalItems) * 100).toFixed(0) : 0;
                  
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                        <span>{cat === 'Powders' ? '🌶️ Ground Powders' : cat === 'Whole' ? '🌱 Whole Spices' : cat === 'Blends' ? '✨ Gourmet Blends' : '🎁 Value Combos'}</span>
                        <span style={{ color: 'var(--secondary)' }}>{count} items ({percentage}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#EEE', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: cat === 'Powders' ? 'var(--secondary)' : cat === 'Whole' ? 'var(--success)' : cat === 'Blends' ? '#3498DB' : 'var(--primary)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: '2rem', marginBottom: '1.25rem', fontFamily: 'var(--font-body)', fontWeight: 'bold' }}>
                🏆 Top Ordered Spices
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {topSpices.length > 0 ? (
                  topSpices.map(([name, count], idx) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#FFFDF9', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>#{idx + 1}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{name}</span>
                      </div>
                      <span className="badge" style={{ backgroundColor: 'var(--secondary)', color: 'white', fontWeight: 'bold' }}>{count} Ordered</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '0.85rem' }}>No data available.</p>
                )}
              </div>
            </div>

            {/* Right: Status Breakdown & GPS Log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Status Breakdown card */}
              <div className="card" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
                <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontFamily: 'var(--font-body)', fontWeight: 'bold' }}>
                  📊 Order Status Distribution
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                  {['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map(status => {
                    const count = statusCounts[status] || 0;
                    return (
                      <div key={status} style={{ padding: '0.75rem', backgroundColor: '#FDFCF7', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase' }}>{status}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: status === 'Delivered' ? 'var(--success)' : status === 'Cancelled' ? 'var(--error)' : 'var(--secondary)', marginTop: '0.25rem' }}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Location Tracking Log */}
              <div className="card" style={{ flex: 1, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
                <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontWeight: 'bold' }}>
                  📍 Order Placement Location Log
                </h3>

                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Address</th>
                        <th>Coordinates</th>
                        <th>Tracking</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id}>
                          <td><b>{order.order_number.split('-').pop()}</b></td>
                          <td style={{ fontSize: '0.75rem' }}>
                            {order.address ? `${order.address.label} (${order.address.city})` : '—'}
                          </td>
                          <td>
                            {order.ordered_lat && order.ordered_lon ? (
                              <span style={{ fontFamily: 'monospace' }}>
                                {order.ordered_lat.toFixed(3)}, {order.ordered_lon.toFixed(3)}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.75rem' }}>Not Captured</span>
                            )}
                          </td>
                          <td>
                            {order.ordered_lat && order.ordered_lon ? (
                              <a 
                                href={`https://www.google.com/maps?q=${order.ordered_lat},${order.ordered_lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline"
                                style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', textDecoration: 'none' }}
                              >
                                View 🌐
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-light)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
