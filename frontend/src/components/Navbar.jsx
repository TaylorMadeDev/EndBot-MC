import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Navbar({ onMobileMenuToggle }) {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [query, setQuery] = useState('');

  // Close overlay on escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setShowMobileSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="navbar">
      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn"
        title="Open menu"
        onClick={onMobileMenuToggle}
      >
        <i className="fas fa-bars"></i>
      </button>
      {/* Search (desktop / wide) */}
      <div className="navbar-search">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Search bots, tasks, or commands..."
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="navbar-actions">
        {/* Mobile Search Trigger (hidden on wide) */}
        <button
          className="navbar-icon-btn search-trigger"
          title="Search"
          onClick={() => setShowMobileSearch(true)}
        >
          <i className="fas fa-search"></i>
        </button>

        {/* Quick Actions */}
        <button className="navbar-btn" title="Quick Deploy">
          <i className="fas fa-plus-circle"></i>
          <span className="btn-label">Deploy Bot</span>
        </button>

        {/* Notifications */}
        <div className="navbar-dropdown">
          <button 
            className="navbar-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <i className="fas fa-bell"></i>
            <span className="notification-badge">3</span>
          </button>
          {showNotifications && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <span className="dropdown-title">Notifications</span>
                <button className="dropdown-link">Mark all read</button>
              </div>
              <div className="notification-item unread">
                <div className="notification-icon success">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="notification-content">
                  <div className="notification-title">Bot MiningMaster deployed</div>
                  <div className="notification-time">2 minutes ago</div>
                </div>
              </div>
              <div className="notification-item unread">
                <div className="notification-icon warning">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div className="notification-content">
                  <div className="notification-title">Task failed: Auto-Farm</div>
                  <div className="notification-time">15 minutes ago</div>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon info">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="notification-content">
                  <div className="notification-title">System update available</div>
                  <div className="notification-time">1 hour ago</div>
                </div>
              </div>
              <div className="dropdown-footer">
                <Link to="/app/notifications">View all notifications <i className="fas fa-arrow-right"></i></Link>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button className="navbar-icon-btn" title="Help & Support">
          <i className="fas fa-question-circle"></i>
        </button>

        {/* Settings */}
        <button className="navbar-icon-btn" title="Settings">
          <i className="fas fa-cog"></i>
        </button>

        {/* Profile */}
        <div className="navbar-dropdown">
          <button 
            className="navbar-profile"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="profile-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="profile-info">
              <div className="profile-name">
                {user?.name || user?.email || 'User'}
                <span className="profile-status"></span>
              </div>
            </div>
            <i className={`fas fa-chevron-down profile-chevron ${showProfile ? 'open' : ''}`}></i>
          </button>
          {showProfile && (
            <div className="dropdown-menu">
              <div className="profile-dropdown-header">
                <div className="profile-avatar-large">
                  <i className="fas fa-user"></i>
                </div>
                <div className="profile-details">
                  <div className="profile-dropdown-name">{user?.name || 'User'}</div>
                  <div className="profile-email">{user?.email || 'user@example.com'}</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <Link to="/app/profile" className="dropdown-item">
                <i className="fas fa-user"></i>
                <span>My Profile</span>
              </Link>
              <Link to="/app/settings" className="dropdown-item">
                <i className="fas fa-cog"></i>
                <span>Settings</span>
              </Link>
              <Link to="/app/billing" className="dropdown-item">
                <i className="fas fa-credit-card"></i>
                <span>Billing</span>
              </Link>
              <div className="dropdown-divider"></div>
              <button onClick={logout} className="dropdown-item danger">
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {showMobileSearch && (
        <div className="search-overlay">
          <div className="search-panel">
            <div className="search-header">
              <i className="fas fa-search"></i>
              <input
                autoFocus
                type="text"
                placeholder="Type to search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="close-search"
                onClick={() => setShowMobileSearch(false)}
                title="Close search"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="search-hints">
              <div className="hint"><i className="fas fa-robot"></i> bots</div>
              <div className="hint"><i className="fas fa-tasks"></i> tasks</div>
              <div className="hint"><i className="fas fa-store"></i> marketplace</div>
              <div className="hint"><i className="fas fa-cog"></i> settings</div>
            </div>
            <div className="search-footer">Press ESC to close</div>
          </div>
          <div className="search-backdrop" onClick={() => setShowMobileSearch(false)}></div>
        </div>
      )}
    </header>
  );
}
