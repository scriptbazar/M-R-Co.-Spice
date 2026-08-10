import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Plus, Trash2, Check, Edit3, AlertCircle, ShieldCheck, Star, X } from 'lucide-react';
import { showToast } from '../components/Toast';

export default function MyAccount({ user, onProfileUpdate, setCurrentTab }) {
  // Profile state
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', role: '', created_at: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Change Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [label, setLabel] = useState('Home');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressError, setAddressError] = useState('');
  const [addressMsg, setAddressMsg] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
  }, []);

  const fetchProfile = () => {
    fetch('/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setEditName(data.name || '');
        setEditEmail(data.email || '');
        setEditPhone(data.phone || '');
      });
  };

  const fetchAddresses = () => {
    fetch('/api/auth/addresses', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setAddresses(Array.isArray(data) ? data : []));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileMsg('');

    if (!editName.trim()) {
      setProfileError('Name is required');
      return;
    }

    fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name: editName, email: editEmail, phone: editPhone })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setProfileError(data.error);
          return;
        }
        setProfileMsg('Profile updated successfully! ✅');
        setEditingProfile(false);
        fetchProfile();
        // Notify parent to refresh user state
        if (onProfileUpdate) onProfileUpdate();
      })
      .catch(err => setProfileError('Failed to update profile'));
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setUpdatingPassword(true);
    fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to change password');
        return data;
      })
      .then(data => {
        setPasswordSuccess('Password changed successfully! ✅');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordForm(false), 2000);
      })
      .catch(err => {
        setPasswordError(err.message);
      })
      .finally(() => {
        setUpdatingPassword(false);
      });
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    setAddressError('');
    setAddressMsg('');

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
      body: JSON.stringify({
        label,
        full_address: fullAddress,
        city,
        state,
        pincode,
        is_default: addresses.length === 0 ? 1 : 0
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setAddressError(data.error);
          return;
        }
        setAddressMsg('Address added successfully! ✅');
        setShowAddressForm(false);
        setFullAddress('');
        setCity('');
        setState('');
        setPincode('');
        setLabel('Home');
        fetchAddresses();
      })
      .catch(err => setAddressError('Failed to add address'));
  };

  const handleSetDefault = (addrId) => {
    fetch(`/api/auth/addresses/${addrId}/default`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(() => {
        setAddressMsg('Default address updated!');
        fetchAddresses();
      });
  };

  const handleDeleteAddress = (addrId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    fetch(`/api/auth/addresses/${addrId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(() => {
        setAddressMsg('Address deleted successfully.');
        fetchAddresses();
      });
  };

  // Check which profile fields are missing/auto-generated
  const isAutoEmail = profile.email && profile.email.includes('@mrco.com');
  const isAutoName = profile.name && profile.name.startsWith('Customer #');
  const isGooglePhone = profile.phone && profile.phone.startsWith('GGL_');
  const hasValidPhone = profile.phone && !isGooglePhone;
  const missingFields = [];
  if (isAutoName) missingFields.push('Full Name');
  if (isAutoEmail) missingFields.push('Email Address');
  if (!hasValidPhone) missingFields.push('Phone Number');

  return (
    <div className="container" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My Account</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>Manage your profile details, delivery addresses, and account preferences.</p>

      {/* Incomplete Profile Warning */}
      {(missingFields.length > 0 || addresses.length === 0) && (
        <div style={{
          backgroundColor: '#FFF8E1',
          border: '1px solid #FFD54F',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <AlertCircle size={22} color="#F57F17" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: '#F57F17', fontFamily: 'var(--font-body)', fontWeight: '600', marginBottom: '0.5rem' }}>
              Complete Your Profile
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#795548', marginBottom: '0.5rem' }}>
              Please update the following to ensure smooth order deliveries:
            </p>
            <ul style={{ fontSize: '0.85rem', color: '#795548', paddingLeft: '1.25rem', margin: 0 }}>
              {isAutoName && <li>Add your <b>full name</b> (currently auto-generated)</li>}
              {isAutoEmail && <li>Add your <b>real email address</b> for order updates</li>}
              {!hasValidPhone && <li>Verify your <b>phone number</b></li>}
              {addresses.length === 0 && <li>Add at least one <b>delivery address</b> for checkout</li>}
            </ul>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {(isAutoName || isAutoEmail) && (
                <button
                  className="btn btn-primary"
                  onClick={() => setEditingProfile(true)}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
              {addresses.length === 0 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddressForm(true)}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  <Plus size={14} /> Add Address
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2.5rem' }}>
        {/* Left: Profile Details */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)' }}>
                <User size={20} color="var(--secondary)" /> Profile Details
              </h3>
              {!editingProfile && (
                <button
                  className="btn btn-outline"
                  onClick={() => setEditingProfile(true)}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Edit3 size={14} /> Edit
                </button>
              )}
            </div>

            {profileMsg && (
              <div style={{ backgroundColor: '#E8F5E9', color: 'var(--success)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
                <ShieldCheck size={14} />
                <span>{profileMsg}</span>
              </div>
            )}

            {profileError && (
              <div style={{ backgroundColor: '#FFEBEE', color: 'var(--error)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
                <AlertCircle size={14} />
                <span>{profileError}</span>
              </div>
            )}

            {editingProfile ? (
              <form onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    style={isAutoName ? { borderColor: '#FFB300' } : {}}
                  />
                  {isAutoName && <span style={{ fontSize: '0.7rem', color: '#F57F17' }}>⚠️ Auto-generated name — please update</span>}
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="Enter your email"
                    style={isAutoEmail ? { borderColor: '#FFB300' } : {}}
                  />
                  {isAutoEmail && <span style={{ fontSize: '0.7rem', color: '#F57F17' }}>⚠️ Placeholder email — please add your real email</span>}
                </div>

                <div className="form-group">
                  <label>Mobile Number</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ border: '1px solid var(--border)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: '#EEE', fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 'bold' }}>+91</span>
                    <input
                      type="text"
                      className="form-input"
                      value={isGooglePhone ? '' : editPhone}
                      onChange={e => setEditPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      maxLength="10"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="submit" className="btn btn-secondary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>
                    <Check size={16} /> Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => { setEditingProfile(false); setProfileError(''); setProfileMsg(''); }}
                    style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FFE8D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={18} color="var(--secondary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</div>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: isAutoName ? '#F57F17' : 'var(--text)' }}>
                      {profile.name || '—'}
                      {isAutoName && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: '#F57F17' }}>(auto-generated)</span>}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E2F0D9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={18} color="var(--success)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mobile Number</div>
                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                      {hasValidPhone
                        ? `+91 ${profile.phone}`
                        : <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontWeight: '400' }}>Not provided — <button type="button" onClick={() => setEditingProfile(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)', textDecoration: 'underline', fontSize: 'inherit', padding: 0 }}>Add now</button></span>
                      }
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EAF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={18} color="#3498DB" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</div>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: isAutoEmail ? '#F57F17' : 'var(--text)' }}>
                      {profile.email || '—'}
                      {isAutoEmail && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: '#F57F17' }}>(placeholder)</span>}
                    </div>
                  </div>
                </div>

                {/* Role & Member Since */}
                <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Type</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {profile.role === 'admin' ? <Star size={14} color="var(--primary)" /> : null}
                      {profile.role || 'customer'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Member Since</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Change Password Card - Only for non-Google users */}
          {!isGooglePhone && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)', margin: 0 }}>
                  <ShieldCheck size={20} color="var(--secondary)" /> Change Password
                </h3>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setShowPasswordForm(!showPasswordForm);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                >
                  {showPasswordForm ? 'Hide' : 'Change'}
                </button>
              </div>

              {showPasswordForm ? (
                <form onSubmit={handleChangePassword}>
                  {passwordError && (
                    <div style={{ backgroundColor: '#FFEBEE', color: 'var(--error)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
                      <AlertCircle size={14} />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div style={{ backgroundColor: '#E8F5E9', color: 'var(--success)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
                      <ShieldCheck size={14} />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }} disabled={updatingPassword}>
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>
                  Update your account password regularly to keep your profile secure.
                </p>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="card" style={{ backgroundColor: '#FDFCF7' }}>
            <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: '600', marginBottom: '1rem', fontSize: '1rem' }}>Quick Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => setCurrentTab('analytics')}
                style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                📊 View My Analytics
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setCurrentTab('orders')}
                style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                📦 View My Orders
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setCurrentTab('products')}
                style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                🌿 Browse Spices Catalog
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setCurrentTab('cart')}
                style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                🛒 Go to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Right: Delivery Addresses */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)' }}>
                <MapPin size={20} color="var(--secondary)" /> Delivery Addresses
              </h3>
              <button
                className="btn btn-outline"
                onClick={() => setShowAddressForm(!showAddressForm)}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Plus size={14} /> Add New
              </button>
            </div>

            {addressMsg && (
              <div style={{ backgroundColor: '#E8F5E9', color: 'var(--success)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
                <ShieldCheck size={14} />
                <span>{addressMsg}</span>
              </div>
            )}

            {/* Add Address Form */}
            {showAddressForm && (
              <form onSubmit={handleAddAddress} style={{ backgroundColor: '#FFFDF9', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--secondary)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-body)' }}>New Delivery Address</h4>
                  <button type="button" onClick={() => setShowAddressForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                    <X size={18} />
                  </button>
                </div>

                {addressError && <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem' }}>{addressError}</div>}

                <div className="form-group">
                  <label>Address Label</label>
                  <select className="form-input" value={label} onChange={e => setLabel(e.target.value)}>
                    <option value="Home">🏠 Home</option>
                    <option value="Office">🏢 Office</option>
                    <option value="Other">📍 Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Full Street Address</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={fullAddress}
                    onChange={e => setFullAddress(e.target.value)}
                    placeholder="House No., Building, Street, Locality, Landmark"
                    required
                  ></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" className="form-input" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Noida" required />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input type="text" className="form-input" value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Uttar Pradesh" required />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input type="text" className="form-input" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} placeholder="201301" maxLength="6" required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>Save Address</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowAddressForm(false)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Cancel</button>
                </div>
              </form>
            )}

            {/* Addresses List */}
            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-light)' }}>
                <MapPin size={40} style={{ color: '#DDD', marginBottom: '0.75rem' }} />
                <h4 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>No Addresses Saved</h4>
                <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Add a delivery address to get started with your first order.
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddressForm(true)}
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                  <Plus size={16} /> Add Your First Address
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      border: '1px solid',
                      borderColor: addr.is_default ? 'var(--secondary)' : 'var(--border)',
                      backgroundColor: addr.is_default ? '#FFFBF6' : 'white',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          {addr.label === 'Home' ? '🏠' : addr.label === 'Office' ? '🏢' : '📍'} {addr.label}
                          {addr.is_default === 1 && (
                            <span style={{
                              fontSize: '0.65rem',
                              backgroundColor: 'var(--secondary)',
                              color: 'white',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: 'bold'
                            }}>DEFAULT</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: '1.5' }}>
                          {addr.full_address}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: '500', marginTop: '0.25rem' }}>
                          {addr.city}, {addr.state} — <b>{addr.pincode}</b>
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        {!addr.is_default && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                            title="Set as Default"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0.25rem' }}
                          title="Delete Address"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
