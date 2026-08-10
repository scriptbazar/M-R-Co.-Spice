import React, { useState, useEffect } from 'react';
import { X, CreditCard, Landmark, Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';

export default function PaymentSimulators({ gateway, orderId, orderNumber, amount, onSuccess, onFailure }) {
  const [method, setMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('user@upi');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [expiry, setExpiry] = useState('12/29');
  const [cvv, setCvv] = useState('123');
  const [bank, setBank] = useState('SBI');
  const [processing, setProcessing] = useState(false);
  const [timer, setTimer] = useState(180); // 3 minutes for PhonePe/UPI

  useEffect(() => {
    let interval;
    if (gateway === 'PhonePe') {
      interval = setInterval(() => {
        setTimer(t => (t > 0 ? t - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gateway]);

  const handlePay = (isSuccess) => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const transactionId = 'TXN-' + gateway.toUpperCase().slice(0, 3) + '-' + Math.floor(100000 + Math.random() * 900000);
      if (isSuccess) {
        onSuccess(transactionId);
      } else {
        onFailure(transactionId);
      }
    }, 1500);
  };

  const getHeaderClass = () => {
    switch (gateway) {
      case 'Razorpay': return 'modal-header-razorpay';
      case 'Cashfree': return 'modal-header-cashfree';
      case 'PayU': return 'modal-header-payu';
      case 'PhonePe': return 'modal-header-phonepe';
      default: return 'modal-header-razorpay';
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="modal-overlay">
      <div className="payment-modal">
        {/* Header */}
        <div className={`payment-modal-header ${getHeaderClass()}`} style={{ color: 'white', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.5px' }}>Payment Gateway Secure Sandbox</div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white', fontFamily: 'var(--font-body)' }}>{gateway} Checkout</h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Order ID:</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{orderNumber || `MRCO-${orderId}`}</div>
          </div>
        </div>

        {/* Amount bar */}
        <div style={{ backgroundColor: '#F5F5F5', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-light)', fontWeight: '500' }}>Amount Payable:</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text)' }}>₹{amount.toFixed(2)}</span>
        </div>

        {/* Processing State */}
        {processing ? (
          <div className="payment-modal-body" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div className="payment-loader"></div>
            <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Processing Transaction...</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Please do not close this window or hit back button.</p>
          </div>
        ) : (
          <div className="payment-modal-body">
            {/* Gateway UI Customizations */}
            {gateway === 'PhonePe' && (
              <div style={{ backgroundColor: '#ECE5F4', color: '#5f259f', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: '500' }}>
                <span>UPI Direct Payment Mode</span>
                <span>Session Expires: {formatTimer(timer)}</span>
              </div>
            )}

            {gateway === 'Cashfree' && (
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.5rem' }}>
                Powered by Cashfree Payments India. Select method below to pay.
              </p>
            )}

            {/* Payment Methods tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setMethod('upi')}
                style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', borderBottom: method === 'upi' ? '2px solid var(--secondary)' : 'none', fontWeight: method === 'upi' ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text)' }}
              >
                <Smartphone size={16} /> UPI
              </button>
              <button 
                onClick={() => setMethod('card')}
                style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', borderBottom: method === 'card' ? '2px solid var(--secondary)' : 'none', fontWeight: method === 'card' ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text)' }}
              >
                <CreditCard size={16} /> Card
              </button>
              <button 
                onClick={() => setMethod('netbanking')}
                style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', borderBottom: method === 'netbanking' ? '2px solid var(--secondary)' : 'none', fontWeight: method === 'netbanking' ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text)' }}
              >
                <Landmark size={16} /> NetBanking
              </button>
            </div>

            {/* Method Details */}
            {method === 'upi' && (
              <div>
                <div className="form-group">
                  <label>Enter Virtual Payment Address (VPA)</label>
                  <input type="text" className="form-input" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="username@upi" />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={14} color="var(--success)" /> Safe and Secure transactions.
                </div>
              </div>
            )}

            {method === 'card' && (
              <div>
                <div className="form-group">
                  <label>Card Number</label>
                  <input type="text" className="form-input" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="4111 2222 3333 4444" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input type="text" className="form-input" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input type="password" className="form-input" value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123" />
                  </div>
                </div>
              </div>
            )}

            {method === 'netbanking' && (
              <div>
                <div className="form-group">
                  <label>Select Bank</label>
                  <select className="form-input" value={bank} onChange={e => setBank(e.target.value)}>
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="KOTAK">Kotak Mahindra Bank</option>
                  </select>
                </div>
              </div>
            )}

            {/* Simulation CTA buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={() => handlePay(false)} 
                className="btn btn-outline" 
                style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
              >
                <AlertCircle size={16} /> Fail Payment
              </button>
              <button 
                onClick={() => handlePay(true)} 
                className="btn btn-secondary"
                style={{ backgroundColor: gateway === 'PhonePe' ? '#5f259f' : (gateway === 'PayU' ? '#a4c639' : (gateway === 'Razorpay' ? '#0b72e7' : 'var(--secondary)')) }}
              >
                <ShieldCheck size={16} /> Pay Securely
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-light)' }}>
              🔒 PCI-DSS Compliant. M & R Co. does not store card information.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
