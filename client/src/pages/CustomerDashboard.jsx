import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, User, ArrowLeft, Activity, LogOut, Heart } from 'lucide-react';
import MyAccount from './MyAccount';
import MyOrders from './MyOrders';
import UserAnalytics from './UserAnalytics';

export default function CustomerDashboard({ user, onProfileUpdate, onReorder, setCurrentTab, initialTab, onLogout }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'analytics');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="admin-layout">
      {/* Customer Dashboard Sidebar */}
      <div className="admin-sidebar">
        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            🌿 Customer Panel
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600' }}>
            Account: {user?.name || 'Customer'}
          </span>
        </div>

        <ul className="admin-sidebar-menu">
          <li className={activeTab === 'analytics' ? 'active' : ''}>
            <button onClick={() => setActiveTab('analytics')} style={{ cursor: 'pointer' }}>
              <LayoutDashboard size={18} /> My Analytics
            </button>
          </li>
          <li className={activeTab === 'orders' ? 'active' : ''}>
            <button onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer' }}>
              <ShoppingBag size={18} /> My Orders
            </button>
          </li>
          <li className={activeTab === 'profile' ? 'active' : ''}>
            <button onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }}>
              <User size={18} /> Profile Settings
            </button>
          </li>
          <li>
            <button onClick={() => setCurrentTab('wishlist')} style={{ cursor: 'pointer' }}>
              <Heart size={18} /> My Wishlist
            </button>
          </li>
          <li style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button onClick={() => setCurrentTab('products')} style={{ cursor: 'pointer' }}>
              <ArrowLeft size={16} /> Back to Catalog
            </button>
          </li>
          <li style={{ marginTop: '0.5rem' }}>
            <button onClick={onLogout} style={{ cursor: 'pointer', color: 'var(--error)' }}>
              <LogOut size={16} /> Secure Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Customer Dashboard Content */}
      <div className="admin-main">
        {activeTab === 'analytics' && (
          <UserAnalytics setCurrentTab={setCurrentTab} />
        )}
        {activeTab === 'orders' && (
          <MyOrders onReorder={onReorder} setCurrentTab={setCurrentTab} />
        )}
        {activeTab === 'profile' && (
          <MyAccount user={user} onProfileUpdate={onProfileUpdate} setCurrentTab={setCurrentTab} />
        )}
      </div>
    </div>
  );
}
