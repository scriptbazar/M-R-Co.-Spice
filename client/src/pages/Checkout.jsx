import React, { useState, useEffect } from 'react';
import { Plus, Check, ShieldCheck, MapPin, Landmark, AlertCircle, ArrowLeft, Truck } from 'lucide-react';
import PaymentSimulators from '../components/PaymentSimulators';
import { showToast } from '../components/Toast';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const loadCashfreeScript = () => {
  return new Promise((resolve) => {
    if (window.Cashfree) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const loadPayUScript = () => {
  return new Promise((resolve) => {
    if (window.bolt) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sboxcheckout-static.citruspay.com/bolt/run/bolt.min.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout({ cart, checkoutMeta, onOrderSuccess, onBackToCart, setCurrentTab, globalCouponCode, setGlobalCouponCode }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [gateways, setGateways] = useState({ Cashfree: false, Razorpay: false, PayU: false, PhonePe: false, COD: false });
  const [selectedGateway, setSelectedGateway] = useState('');
  const [loadingGateways, setLoadingGateways] = useState(true);

  // Shipping partner and rates states
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Address creation form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [label, setLabel] = useState('Home');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressError, setAddressError] = useState('');

  // Payment simulator state
  const [activePaymentSimulator, setActivePaymentSimulator] = useState(null); // { gateway, orderId, orderNumber, amount }

  const subtotal = cart.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(checkoutMeta.code || '');
  const [couponDiscount, setCouponDiscount] = useState(checkoutMeta.discount || 0);
  const [couponError, setCouponError] = useState('');
  const [coupons, setCoupons] = useState([]);
  const shipping = selectedShippingOption ? selectedShippingOption.cost : 0;
  const total = Math.max(0, subtotal - couponDiscount + shipping);

  const fetchShippingRates = (addressId, gateway) => {
    if (!addressId || cart.length === 0) return;
    setLoadingShipping(true);
    
    const orderItems = cart.map(item => ({
      product_id: item.product.id,
      variant_id: item.variant.id,
      quantity: item.quantity
    }));

    fetch('/api/orders/calculate-shipping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        address_id: addressId,
        items: orderItems,
        payment_method: gateway
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to calculate shipping');
        return data;
      })
      .then(data => {
        setShippingOptions(data.options || []);
        if (data.options && data.options.length > 0) {
          // If we had a previously selected option, try to keep it, otherwise choose the first one
          const prev = data.options.find(o => o.id === selectedShippingOption?.id && o.type === selectedShippingOption?.type);
          setSelectedShippingOption(prev || data.options[0]);
        } else {
          setSelectedShippingOption(null);
        }
        setLoadingShipping(false);
      })
      .catch(err => {
        console.error('Error fetching shipping rates:', err);
        setLoadingShipping(false);
      });
  };

  useEffect(() => {
    fetchAddresses();
    fetchGateways();
    fetchCoupons();
  }, []);

  // Fetch shipping rates whenever the address or payment gateway changes
  useEffect(() => {
    if (selectedAddressId) {
      fetchShippingRates(selectedAddressId, selectedGateway);
    } else {
      setShippingOptions([]);
      setSelectedShippingOption(null);
    }
  }, [selectedAddressId, selectedGateway]);

  // Auto-apply globalCouponCode when it changes or when the checkout subtotal changes
  useEffect(() => {
    if (globalCouponCode && appliedCoupon !== globalCouponCode && subtotal > 0) {
      setCouponError('');
      fetch('/api/orders/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ coupon_code: globalCouponCode, cart_amount: subtotal })
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to validate coupon');
          return data;
        })
        .then(data => {
          setAppliedCoupon(data.code);
          setCouponDiscount(data.discount_amount);
        })
        .catch(err => {
          setCouponError(err.message);
          setAppliedCoupon('');
          setCouponDiscount(0);
        });
    } else if (!globalCouponCode && appliedCoupon) {
      setAppliedCoupon('');
      setCouponDiscount(0);
    }
  }, [globalCouponCode, subtotal]);

  const fetchCoupons = () => {
    fetch('/api/products/public/coupons')
      .then(res => res.json())
      .then(data => {
        setCoupons(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Error fetching checkout coupons:', err));
  };

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
      body: JSON.stringify({ coupon_code: code, cart_amount: subtotal })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to validate coupon');
        return data;
      })
      .then(data => {
        setAppliedCoupon(data.code);
        setCouponDiscount(data.discount_amount);
        setCouponCode('');
        setGlobalCouponCode(data.code); // Sync globally
      })
      .catch(err => {
        setCouponError(err.message);
      });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setCouponDiscount(0);
    setCouponError('');
    setGlobalCouponCode(''); // Sync globally
  };

  const fetchAddresses = () => {
    fetch('/api/auth/addresses', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setAddresses(data);
        const defaultAddr = data.find(a => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
      });
  };

  const fetchGateways = () => {
    setLoadingGateways(true);
    fetch('/api/payments/gateways')
      .then(res => res.json())
      .then(data => {
        setGateways(data);
        // Set first active gateway as default
        const active = Object.keys(data).find(k => data[k]);
        if (active) {
          setSelectedGateway(active);
        }
        setLoadingGateways(false);
      })
      .catch(() => setLoadingGateways(false));
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    setAddressError('');
    if (!fullAddress || !city || !state || !pincode) {
      setAddressError('Please fill in all address fields');
      return;
    }

    fetch('/api/auth/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ label, full_address: fullAddress, city, state, pincode, is_default: addresses.length === 0 ? 1 : 0 })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setShowAddressForm(false);
        setFullAddress('');
        setCity('');
        setState('');
        setPincode('');
        fetchAddresses();
      })
      .catch(err => setAddressError(err.message));
  };

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      showToast('Please select a shipping address');
      return;
    }
    if (!selectedGateway) {
      showToast('Please select a payment method');
      return;
    }

    const orderItems = cart.map(item => ({
      product_id: item.product.id,
      variant_id: item.variant.id,
      quantity: item.quantity
    }));

    const initRazorpayCheckout = async (orderId, amount, orderNumber) => {
      try {
        const loaded = await loadRazorpayScript();
        if (!loaded) return showToast('Razorpay SDK failed to load. Are you online?');

        // Create Order on Backend
        const res = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ order_id: orderId })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Init Razorpay Options
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "M & R Co.",
          description: `Order ${orderNumber}`,
          order_id: data.id, // backend created razorpay_order_id
          handler: async function (response) {
            // Verify Signature
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                order_id: orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              showToast('Payment Successful!');
              onOrderSuccess();
            } else {
              showToast('Payment verification failed.');
            }
          },
          theme: {
            color: "#D35400"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          showToast('Payment Failed: ' + response.error.description);
        });
        rzp.open();
      } catch (err) {
        showToast('Payment initialization failed: ' + err.message);
      }
    };

    const initCashfreeCheckout = async (orderId) => {
      try {
        const loaded = await loadCashfreeScript();
        if (!loaded) return showToast('Cashfree SDK failed to load.');

        const res = await fetch('/api/payments/cashfree/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ order_id: orderId })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const cashfree = window.Cashfree({ mode: "sandbox" });
        cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          returnUrl: `http://localhost:5173/checkout?order_id=${data.order_id}`
        });
      } catch (err) {
        showToast('Payment initialization failed: ' + err.message);
      }
    };

    const initPayUCheckout = async (orderId) => {
      try {
        const loaded = await loadPayUScript();
        if (!loaded) return showToast('PayU SDK failed to load.');

        const res = await fetch('/api/payments/payu/hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ order_id: orderId })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        window.bolt.launch(data, {
          responseHandler: function(BOLT) {
            if(BOLT.response.txnStatus !== 'CANCEL') {
              showToast('Payment Processed! Checking status...');
              onOrderSuccess();
            }
          },
          catchException: function(BOLT){
            showToast(BOLT.message);
          }
        });
      } catch(err) {
        showToast('Payment initialization failed: ' + err.message);
      }
    };

    const initPhonePeCheckout = async (orderId) => {
      try {
        const res = await fetch('/api/payments/phonepe/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ order_id: orderId })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        window.location.href = data.redirectUrl;
      } catch(err) {
        showToast('Payment initialization failed: ' + err.message);
      }
    };

    const proceedWithOrder = (coords = null) => {
      fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items: orderItems,
          address_id: selectedAddressId,
          payment_method: selectedGateway,
          latitude: coords?.latitude || null,
          longitude: coords?.longitude || null,
          coupon_code: appliedCoupon || null,
          delivery_partner_id: selectedShippingOption ? selectedShippingOption.id : null,
          shipping_charges: selectedShippingOption ? selectedShippingOption.cost : 0
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            showToast(data.error);
            return;
          }

          const { orderId, orderNumber, totalAmount } = data;

          if (selectedGateway === 'COD') {
            // COD directly completes order
            showToast('Order Placed Successfully via Cash on Delivery!');
            onOrderSuccess();
          } else if (selectedGateway === 'Razorpay') {
            initRazorpayCheckout(orderId, totalAmount, orderNumber);
          } else if (selectedGateway === 'Cashfree') {
            initCashfreeCheckout(orderId);
          } else if (selectedGateway === 'PayU') {
            initPayUCheckout(orderId);
          } else if (selectedGateway === 'PhonePe') {
            initPhonePeCheckout(orderId);
          } else {
            // Open Online payment simulator modal for other gateways
            setActivePaymentSimulator({
              gateway: selectedGateway,
              orderId,
              orderNumber,
              amount: totalAmount
            });
          }
        })
        .catch(err => showToast('Failed to place order: ' + err.message));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          proceedWithOrder({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation capture failed:', error);
          proceedWithOrder(null);
        },
        { timeout: 4000 }
      );
    } else {
      proceedWithOrder(null);
    }
  };

  const handlePaymentSuccess = (transactionId) => {
    const orderId = activePaymentSimulator.orderId;
    const gateway = activePaymentSimulator.gateway;

    fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        // SEC-04: Simulator secret required by server — must match SIMULATOR_SECRET env var
        'x-simulator-secret': 'dev-simulator-secret-change-me'
      },
      body: JSON.stringify({
        order_id: orderId,
        status: 'Success',
        gateway,
        transaction_id: transactionId
      })
    })
      .then(res => res.json())
      .then(data => {
        setActivePaymentSimulator(null);
        showToast('Payment Verified! Order has been Confirmed.');
        onOrderSuccess();
      })
      .catch(err => showToast('Payment verification failed: ' + err.message));
  };

  const handlePaymentFailure = (transactionId) => {
    const orderId = activePaymentSimulator.orderId;
    const gateway = activePaymentSimulator.gateway;

    fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        // SEC-04: Simulator secret required by server — must match SIMULATOR_SECRET env var
        'x-simulator-secret': 'dev-simulator-secret-change-me'
      },
      body: JSON.stringify({
        order_id: orderId,
        status: 'Failed',
        gateway,
        transaction_id: transactionId
      })
    })
      .then(res => res.json())
      .then(data => {
        setActivePaymentSimulator(null);
        showToast('Transaction Failed. Order status updated to payment failed. You can check this order in My Orders.');
        onOrderSuccess(); // Redirect to My Orders to verify/retry later
      })
      .catch(err => showToast('Payment failure reporting failed: ' + err.message));
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <button 
        onClick={onBackToCart} 
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Shopping Cart
      </button>

      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Secure Checkout</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
        {/* Left Side: Address & Payments */}
        <div>
          {/* 1. Delivery Address */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)' }}>
                <MapPin size={20} color="var(--secondary)" /> Shipping Address
              </h3>
              <button 
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Plus size={14} /> Add New Address
              </button>
            </div>

            {showAddressForm && (
              <form onSubmit={handleAddAddress} style={{ backgroundColor: '#FFFDF9', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--secondary)', marginBottom: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-body)', marginBottom: '1rem' }}>New Address Form</h4>
                {addressError && <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem' }}>{addressError}</div>}
                
                <div className="form-group">
                  <label>Address Label (e.g. Home, Office)</label>
                  <input type="text" className="form-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Home" />
                </div>
                
                <div className="form-group">
                  <label>Full Street Address</label>
                  <textarea className="form-input" rows="2" value={fullAddress} onChange={e => setFullAddress(e.target.value)} placeholder="H.No, Building, Locality, Area"></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" className="form-input" value={city} onChange={e => setCity(e.target.value)} placeholder="Noida" />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input type="text" className="form-input" value={state} onChange={e => setState(e.target.value)} placeholder="Uttar Pradesh" />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input type="text" className="form-input" value={pincode} onChange={e => setPincode(e.target.value)} placeholder="201301" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Save Address</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowAddressForm(false)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Cancel</button>
                </div>
              </form>
            )}

            {addresses.length === 0 ? (
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                No addresses saved. Please click "Add New Address" above to write your delivery address.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {addresses.map((addr) => (
                  <div 
                    key={addr.id} 
                    onClick={() => setSelectedAddressId(addr.id)}
                    style={{ 
                      border: '1px solid',
                      borderColor: selectedAddressId === addr.id ? 'var(--secondary)' : 'var(--border)',
                      backgroundColor: selectedAddressId === addr.id ? '#FFFBF6' : 'white',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      position: 'relative'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="address" 
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      style={{ marginTop: '0.25rem', accentColor: 'var(--secondary)' }} 
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {addr.label} {addr.is_default === 1 && <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--border)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--text-light)' }}>Default</span>}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                        {addr.full_address}, {addr.city}, {addr.state} - <b>{addr.pincode}</b>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Partner Selection */}
          {selectedAddressId && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)' }}>
                <Truck size={20} color="var(--secondary)" /> Select Delivery Partner
              </h3>

              {loadingShipping ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
                  <div className="payment-loader" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Calculating location-based delivery rates...</span>
                </div>
              ) : shippingOptions.length === 0 ? (
                <div style={{ color: 'var(--error)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                  <AlertCircle size={16} /> No delivery partners available for this location.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {shippingOptions.map((opt) => {
                    const isSelected = selectedShippingOption?.id === opt.id && selectedShippingOption?.type === opt.type;
                    return (
                      <div
                        key={`${opt.type}-${opt.id}`}
                        onClick={() => setSelectedShippingOption(opt)}
                        style={{
                          border: '1.5px solid',
                          borderColor: isSelected ? 'var(--secondary)' : 'var(--border)',
                          backgroundColor: isSelected ? '#FFFBF6' : 'white',
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(211, 84, 0, 0.08)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="radio"
                            name="shipping_option"
                            checked={isSelected}
                            onChange={() => setSelectedShippingOption(opt)}
                            style={{ accentColor: 'var(--secondary)' }}
                          />
                          <div>
                            <span style={{ fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {opt.type === 'local' ? '🚴 ' : '🚚 '} {opt.name}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'block', marginTop: '0.15rem' }}>
                              {opt.description}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 'bold', display: 'block', marginTop: '0.25rem' }}>
                              Est. Delivery: {opt.etd}
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '1.15rem', color: 'var(--primary-dark)' }}>
                            {opt.cost === 0 ? 'FREE' : `₹${opt.cost}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. Payment Method selection */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)' }}>
              <Landmark size={20} color="var(--secondary)" /> Select Payment Gateway
            </h3>

            {loadingGateways ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="payment-loader" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                <span style={{ fontSize: '0.9rem' }}>Loading active gateways...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.keys(gateways).map((gw) => {
                  const isActive = gateways[gw];
                  if (!isActive) return null;

                  return (
                    <div 
                      key={gw} 
                      onClick={() => setSelectedGateway(gw)}
                      style={{ 
                        border: '1px solid',
                        borderColor: selectedGateway === gw ? 'var(--secondary)' : 'var(--border)',
                        backgroundColor: selectedGateway === gw ? '#FFFBF6' : 'white',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input 
                          type="radio" 
                          name="gateway" 
                          checked={selectedGateway === gw}
                          onChange={() => setSelectedGateway(gw)}
                          style={{ accentColor: 'var(--secondary)' }} 
                        />
                        <span style={{ fontWeight: '600', fontSize: '1rem' }}>
                          {gw === 'COD' ? 'Cash on Delivery (COD)' : `${gw} Payments`}
                        </span>
                      </div>
                      
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {gw === 'COD' ? 'No Extra Charge' : 'Secure Online Transaction'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Order summary & Place order CTA */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontFamily: 'var(--font-body)' }}>Order Review</h3>

            {/* Cart Items list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {cart.map(item => (
                <div key={`${item.product.id}-${item.variant.id}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ fontWeight: '500' }}>{item.product.name}</span>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>
                      {item.variant.weight_variant} &times; {item.quantity}
                    </div>
                  </div>
                  <span style={{ fontWeight: '600' }}>₹{(item.variant.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Promo Coupon box */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-light)' }}>Have a Coupon Code?</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter code" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value)}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} 
                  />
                  <button type="submit" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Apply</button>
                </div>
                {couponError && <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>{couponError}</span>}
                {appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E8F5E9', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--success)' }}>
                    <span>Applied: <b>{appliedCoupon}</b></span>
                    <button type="button" onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Remove</button>
                  </div>
                )}
              </form>

              {/* Quick Select Coupons */}
              {coupons && coupons.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Available Offers & Coupons:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {coupons.map(cp => {
                      const isCurrentlyApplied = appliedCoupon === cp.code;
                      return (
                        <div
                          key={cp.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: isCurrentlyApplied ? '1.5px solid #2E7D32' : '1px dashed var(--border)',
                            backgroundColor: isCurrentlyApplied ? '#E8F5E9' : '#FFFDF9',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'bold', color: isCurrentlyApplied ? '#2E7D32' : 'var(--secondary)', fontSize: '0.85rem' }}>
                              {cp.code}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: isCurrentlyApplied ? '#1B5E20' : 'var(--success)', fontWeight: '500' }}>
                              {cp.discount_type === 'percentage' ? `${cp.discount_value}% OFF` : `₹${cp.discount_value} OFF`} (Min: ₹{cp.min_cart_amount})
                            </span>
                          </div>
                          
                          {isCurrentlyApplied ? (
                            <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              className="btn"
                              style={{
                                padding: '0.25rem 0.6rem',
                                fontSize: '0.7rem',
                                backgroundColor: '#C62828',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setCouponError('');
                                fetch('/api/orders/validate-coupon', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                  },
                                  body: JSON.stringify({ coupon_code: cp.code, cart_amount: subtotal })
                                })
                                  .then(async res => {
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error);
                                    return data;
                                  })
                                  .then(data => {
                                    setAppliedCoupon(data.code);
                                    setCouponDiscount(data.discount_amount);
                                    setGlobalCouponCode(data.code);
                                  })
                                  .catch(err => setCouponError(err.message));
                              }}
                              className="btn btn-outline"
                              style={{
                                padding: '0.25rem 0.6rem',
                                fontSize: '0.7rem',
                                border: '1px solid var(--secondary)',
                                color: 'var(--secondary)',
                                backgroundColor: 'transparent',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="flex-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex-between" style={{ color: 'var(--success)', fontWeight: '500' }}>
                  <span>Promo Discount:</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex-between">
                <span>Delivery:</span>
                <span>{shipping === 0 ? <span style={{ color: 'var(--success)' }}>FREE</span> : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--secondary)' }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={handlePlaceOrder}
              style={{ width: '100%', padding: '0.9rem' }}
            >
              Place Order & Pay ₹{total.toFixed(2)}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
              <ShieldCheck size={14} color="var(--success)" /> Safe payment processed via Hosted Gateway.
            </div>
          </div>
        </div>
      </div>

      {/* Render Online Payment Simulator Modal */}
      {activePaymentSimulator && (
        <PaymentSimulators
          gateway={activePaymentSimulator.gateway}
          orderId={activePaymentSimulator.orderId}
          orderNumber={activePaymentSimulator.orderNumber}
          amount={activePaymentSimulator.amount}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}
    </div>
  );
}
