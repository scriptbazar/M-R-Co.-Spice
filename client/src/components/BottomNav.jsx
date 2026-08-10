import React from 'react';
import { Home, Grid, Heart, ShoppingBag, User } from 'lucide-react';

export default function BottomNav({ currentTab, setCurrentTab, cartCount = 0, wishlistCount = 0, user, onOpenLogin }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'products', label: 'Spices', icon: Grid },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlistCount },
    { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: cartCount },
    { 
      id: 'account', 
      label: user ? 'Account' : 'Login', 
      icon: User,
      action: () => user ? setCurrentTab('account') : onOpenLogin()
    }
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id || (item.id === 'account' && ['orders', 'profile', 'analytics'].includes(currentTab));
        
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => item.action ? item.action() : setCurrentTab(item.id)}
          >
            <div className="bottom-nav-icon-wrap">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              {item.badge > 0 && (
                <span className="bottom-nav-badge">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
