import React, { useState, useEffect } from 'react';
import { FileText, RotateCcw, AlertTriangle, Calendar, Truck, ArrowRight, ShieldCheck, XCircle, ClipboardList } from 'lucide-react';
import OrderStepper from '../components/OrderStepper';
import { showToast } from '../components/Toast';

export default function MyOrders({ onReorder, setCurrentTab }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeInvoice, setActiveInvoice] = useState(null); // { order }
  const [trackingData, setTrackingData] = useState({}); // { orderId: data }
  const [loadingTracking, setLoadingTracking] = useState({}); // { orderId: boolean }

  const handleFetchTracking = (orderId) => {
    setLoadingTracking(prev => ({ ...prev, [orderId]: true }));
    fetch(`/api/orders/${orderId}/track`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch tracking data');
        return data;
      })
      .then(data => {
        setLoadingTracking(prev => ({ ...prev, [orderId]: false }));
        if (data.success && data.tracking_data) {
          setTrackingData(prev => ({ ...prev, [orderId]: data.tracking_data }));
          showToast('Tracking data updated!', 'success');
        } else {
          showToast('Tracking information not updated yet.', 'info');
        }
      })
      .catch(err => {
        setLoadingTracking(prev => ({ ...prev, [orderId]: false }));
        showToast('Tracking Error: ' + err.message, 'error');
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleCancelOrder = (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This will restore product inventory immediately.')) {
      return;
    }

    fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          showToast(data.error);
          return;
        }
        showToast(data.message);
        fetchOrders();
      })
      .catch(err => showToast('Failed to cancel order: ' + err.message));
  };

  const handleReorderClick = (orderId) => {
    fetch(`/api/orders/${orderId}/reorder`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          showToast(data.error);
          return;
        }
        onReorder(data.items);
        showToast('All items from this order have been loaded into your cart.');
        setCurrentTab('cart');
      })
      .catch(err => showToast('Reorder failed: ' + err.message));
  };

  const handlePrintInvoice = (order) => {
    // Construct HTML in a new print window for generating a clean PDF invoice
    const printWindow = window.open('', '_blank');
    const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderDiscount = order.discount_amount || 0;
    const orderShipping = (order.shipping_charges !== undefined && order.shipping_charges !== null) ? order.shipping_charges : (itemsSubtotal > 500 ? 0 : 49);
    const grandTotalVal = order.total_amount;

    const invoiceHtml = `
      <html>
      <head>
        <title>Invoice - ${order.order_number}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 20px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #C1440E; padding-bottom: 10px; margin-bottom: 30px; }
          .brand-logo { font-size: 24px; font-weight: bold; color: #C1440E; }
          .invoice-title { font-size: 28px; font-weight: bold; text-align: right; text-transform: uppercase; color: #444; }
          .details { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
          .bill-to, .invoice-info { width: 45%; }
          .section-title { font-weight: bold; color: #7A1F1F; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
          th { background-color: #FFF8F0; border-bottom: 2px solid #ddd; text-align: left; padding: 10px; font-weight: bold; }
          td { border-bottom: 1px solid #eee; padding: 10px; }
          .totals { text-align: right; font-size: 14px; }
          .totals table { width: 320px; margin-left: auto; border: none; }
          .totals td { border: none; padding: 5px 10px; }
          .grand-total { font-size: 18px; font-weight: bold; color: #C1440E; }
          .footer { text-align: center; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 50px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-logo">🌿 M & R Co.</div>
            <div style="font-size: 12px; margin-top: 5px;">Authentic Homemade Spice Brand</div>
            <div style="font-size: 11px;">FSSAI LIC NO: 22724999000123</div>
          </div>
          <div>
            <div class="invoice-title">Tax Invoice</div>
            <div style="font-size: 13px; text-align: right; margin-top: 5px;">Invoice No: <b>INV-${order.order_number.split('-').pop()}</b></div>
          </div>
        </div>

        <div class="details">
          <div class="bill-to">
            <div class="section-title">Delivery Address</div>
            <div style="font-weight: bold; margin-bottom: 5px;">${order.customer_name || 'Customer'}</div>
            <div>${order.address?.full_address}</div>
            <div>${order.address?.city}, ${order.address?.state} - ${order.address?.pincode}</div>
          </div>
          <div class="invoice-info">
            <div class="section-title">Order Information</div>
            <div>Order Reference: <b>${order.order_number}</b></div>
            <div>Date Placed: ${new Date(order.ordered_at).toLocaleString()}</div>
            <div>Payment Mode: ${order.payment_method}</div>
            <div>Payment Status: <b>${order.payment_status}</b></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Spice Item</th>
              <th>Variant Weight</th>
              <th>Rate (INR)</th>
              <th>Qty</th>
              <th>Subtotal (INR)</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td><b>${item.product_name}</b></td>
                <td>${item.weight_variant}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>₹${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Subtotal:</td>
              <td>₹${itemsSubtotal.toFixed(2)}</td>
            </tr>
            ${orderDiscount > 0 ? `
            <tr>
              <td>Coupon Discount (${order.coupon_code || 'Applied'}):</td>
              <td>-₹${orderDiscount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Delivery Charges:</td>
              <td>${orderShipping === 0 ? 'FREE' : `₹${orderShipping.toFixed(2)}`}</td>
            </tr>
            <tr class="grand-total">
              <td>Total Amount Paid:</td>
              <td>₹${grandTotalVal.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>Thank you for buying homemade artisanal spices and supporting local households!</p>
          <p>If you have any questions, contact us at <b>support@mrco.com</b> or call <b>+91 98765 43210</b></p>
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="payment-loader"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>My Spices Orders</h2>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <ClipboardList size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3>No Orders Placed Yet</h3>
          <p style={{ color: 'var(--text-light)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>You haven't ordered any of our stone-ground spices yet.</p>
          <button className="btn btn-secondary" onClick={() => setCurrentTab('products')}>Start Shopping</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="card" style={{ borderLeft: '4px solid var(--secondary)', padding: '2rem' }}>
              {/* Order Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Order Reference</span>
                  <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: '700', fontSize: '1.15rem' }}>{order.order_number}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <Calendar size={14} /> Placed: {new Date(order.ordered_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Status</span>
                    <div>
                      <span className={`badge ${
                        order.status === 'Delivered' ? 'badge-status-delivered' : 
                        (order.status === 'Cancelled' || order.status === 'Refunded' ? 'badge-status-cancelled' : 'badge-status-pending')
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Payment</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {order.payment_method} - <span style={{ color: order.payment_status === 'Paid' ? 'var(--success)' : 'orange' }}>{order.payment_status}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Amount</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                      ₹{order.total_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items grid */}
              <div style={{ margin: '1.5rem 0' }}>
                <h5 style={{ fontFamily: 'var(--font-body)', fontWeight: '600', marginBottom: '0.75rem' }}>Spice Items Ordered</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span>🌿</span>
                        <span><b>{item.product_name}</b> ({item.weight_variant})</span>
                      </div>
                      <span style={{ color: 'var(--text-light)' }}>
                        ₹{item.price} &times; {item.quantity} = <b>₹{(item.price * item.quantity).toFixed(2)}</b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details */}
              <div style={{ backgroundColor: '#FDFCF7', border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-md)', margin: '1.5rem 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-light)' }}>Shipping Address</div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: '500' }}>
                    {order.address?.full_address}, {order.address?.city}, {order.address?.state} - {order.address?.pincode}
                  </p>
                </div>
                
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-light)' }}>Order Location (GPS)</div>
                  {order.ordered_lat && order.ordered_lon ? (
                    <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: '500' }}>
                      <a 
                        href={`https://www.google.com/maps?q=${order.ordered_lat},${order.ordered_lon}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--secondary)', textDecoration: 'underline', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        📍 {order.ordered_lat.toFixed(4)}°, {order.ordered_lon.toFixed(4)}°
                      </a>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginTop: '0.15rem' }}>Captured at placement</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                      GPS details not captured
                    </p>
                  )}
                </div>
                
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-light)' }}>Delivery Partner</div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: '500' }}>
                    {order.delivery_partner ? `${order.delivery_partner.name} (${order.delivery_partner.contact})` : 'Awaiting courier pickup...'}
                  </p>
                  {order.tracking_number && (
                    <>
                      <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 'bold', marginTop: '0.25rem' }}>
                        Tracking ID: {order.tracking_number}
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleFetchTracking(order.id)}
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          disabled={loadingTracking[order.id]}
                        >
                          <Truck size={12} /> {loadingTracking[order.id] ? 'Fetching...' : 'Track Order Status'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-light)' }}>Expected Delivery</div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Truck size={14} color="var(--secondary)" /> {order.actual_delivery_date ? `Delivered on: ${new Date(order.actual_delivery_date).toLocaleDateString()}` : new Date(order.expected_delivery_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {trackingData[order.id] && (
                <div style={{ backgroundColor: '#FFF', border: '1px solid var(--border)', padding: '1.5rem', borderRadius: 'var(--radius-md)', margin: '1.5rem 0', boxShadow: 'var(--shadow-sm)' }}>
                  <h5 style={{ fontFamily: 'var(--font-body)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🚚 Live Shipment Tracking (AWB: {order.tracking_number})
                    </span>
                    <button 
                      onClick={() => setTrackingData(prev => { const copy = {...prev}; delete copy[order.id]; return copy; })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontWeight: 'bold', fontSize: '1rem' }}
                    >
                      ✕ Close
                    </button>
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border)' }}>
                    {trackingData[order.id].shipment_track_activities?.map((act, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-1.95rem', top: '4px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: idx === 0 ? 'var(--secondary)' : 'var(--text-light)', border: '2px solid white', boxShadow: '0 0 0 2px var(--border)' }}></div>
                        <div style={{ fontWeight: 'bold', color: idx === 0 ? 'var(--secondary)' : 'var(--text)' }}>
                          {act.activity}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.15rem' }}>
                          Location: <b>{act.location || 'In Transit'}</b> | Status: <b>{act['sr-status']}</b> | Date: {new Date(act.date).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {(!trackingData[order.id].shipment_track_activities || trackingData[order.id].shipment_track_activities.length === 0) && (
                      <p style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '0.85rem' }}>No tracking activities recorded yet by courier partner.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Visual stepper */}
              <OrderStepper status={order.status} />

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handlePrintInvoice(order)} 
                  className="btn btn-outline" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                >
                  <FileText size={16} /> Print Tax Invoice (PDF)
                </button>
                
                <button 
                  onClick={() => handleReorderClick(order.id)} 
                  className="btn btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', backgroundColor: 'var(--primary)' }}
                >
                  <RotateCcw size={16} /> Quick Reorder
                </button>

                {(order.status === 'Placed' || order.status === 'Confirmed') && (
                  <button 
                    onClick={() => handleCancelOrder(order.id)} 
                    className="btn btn-outline" 
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                  >
                    <XCircle size={16} /> Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
