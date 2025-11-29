import React, { useState } from 'react';
import '../styles/settings.css';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    username: 'xMiner_Pro',
    email: 'user@example.com',
    avatar: null,
  });

  // Customization settings
  const [customization, setCustomization] = useState({
    theme: 'dark',
    accentColor: '#6366f1',
    sidebarCollapsed: false,
    animations: true,
    compactMode: false,
  });

  // Payment info
  const [paymentData, setPaymentData] = useState({
    cardNumber: '•••• •••• •••• 4242',
    cardHolder: 'John Doe',
    expiryDate: '12/25',
    billingEmail: 'billing@example.com',
  });

  // Security settings
  const [securityData, setSecurityData] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
    apiKeyVisible: false,
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    botAlerts: true,
    marketplaceUpdates: false,
    weeklyReports: true,
  });

  const showSuccess = (message) => {
    setShowSuccessNotification(message);
    setTimeout(() => setShowSuccessNotification(false), 3000);
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    showSuccess('Profile updated successfully!');
  };

  const handleCustomizationChange = (key, value) => {
    setCustomization(prev => ({ ...prev, [key]: value }));
    
    // Apply changes immediately
    if (key === 'accentColor') {
      document.documentElement.style.setProperty('--accent-color', value);
    }
    
    showSuccess('Customization applied!');
  };

  const handlePaymentUpdate = (e) => {
    e.preventDefault();
    showSuccess('Payment information updated!');
  };

  const handleSecurityUpdate = (key, value) => {
    setSecurityData(prev => ({ ...prev, [key]: value }));
    showSuccess('Security settings updated!');
  };

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    showSuccess('Notification preferences saved!');
  };

  const tabs = [
    { id: 'profile', icon: 'fa-user', label: 'Profile' },
    { id: 'customize', icon: 'fa-palette', label: 'Customize' },
    { id: 'payment', icon: 'fa-credit-card', label: 'Payment' },
    { id: 'security', icon: 'fa-shield-alt', label: 'Security' },
    { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
  ];

  const accentColors = [
    { color: '#6366f1', name: 'Indigo' },
    { color: '#8b5cf6', name: 'Purple' },
    { color: '#ec4899', name: 'Pink' },
    { color: '#f59e0b', name: 'Amber' },
    { color: '#10b981', name: 'Green' },
    { color: '#3b82f6', name: 'Blue' },
    { color: '#ef4444', name: 'Red' },
    { color: '#06b6d4', name: 'Cyan' },
  ];

  return (
    <div className="settings-page">
      {showSuccessNotification && (
        <div className="success-notification">
          <i className="fas fa-check-circle"></i>
          {showSuccessNotification}
        </div>
      )}

      <div className="settings-header">
        <div className="header-content">
          <h2 className="page-title">
            <i className="fas fa-cog"></i>
            Settings
          </h2>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h3>Profile Settings</h3>
                <p>Manage your personal information</p>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className="avatar-section">
                  <div className="avatar-preview">
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="avatar-actions">
                    <button type="button" className="btn secondary">
                      <i className="fas fa-upload"></i>
                      Upload Photo
                    </button>
                    <button type="button" className="btn ghost">
                      <i className="fas fa-trash"></i>
                      Remove
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Username</label>
                    <div className="input-with-icon">
                      <i className="fas fa-user"></i>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-with-icon">
                      <i className="fas fa-envelope"></i>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Bio</label>
                    <textarea
                      placeholder="Tell us about yourself..."
                      rows="4"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn primary">
                    <i className="fas fa-save"></i>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Customize Tab */}
          {activeTab === 'customize' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h3>Customization</h3>
                <p>Personalize your experience</p>
              </div>

              <div className="customize-section">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Accent Color</h4>
                    <p>Choose your preferred accent color</p>
                  </div>
                  <div className="color-picker">
                    {accentColors.map((c) => (
                      <button
                        key={c.color}
                        className={`color-option ${customization.accentColor === c.color ? 'active' : ''}`}
                        style={{ backgroundColor: c.color }}
                        onClick={() => handleCustomizationChange('accentColor', c.color)}
                        title={c.name}
                      >
                        {customization.accentColor === c.color && (
                          <i className="fas fa-check"></i>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>
                      <i className="fas fa-moon"></i>
                      Theme
                    </h4>
                    <p>Select your preferred theme</p>
                  </div>
                  <div className="theme-options">
                    <button
                      className={`theme-card ${customization.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => handleCustomizationChange('theme', 'dark')}
                    >
                      <div className="theme-preview dark-preview">
                        <div className="preview-header"></div>
                        <div className="preview-content">
                          <div className="preview-bar"></div>
                          <div className="preview-bar"></div>
                        </div>
                      </div>
                      <span>Dark</span>
                    </button>
                    <button
                      className={`theme-card ${customization.theme === 'light' ? 'active' : ''}`}
                      onClick={() => handleCustomizationChange('theme', 'light')}
                    >
                      <div className="theme-preview light-preview">
                        <div className="preview-header"></div>
                        <div className="preview-content">
                          <div className="preview-bar"></div>
                          <div className="preview-bar"></div>
                        </div>
                      </div>
                      <span>Light</span>
                    </button>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>
                      <i className="fas fa-magic"></i>
                      Animations
                    </h4>
                    <p>Enable smooth transitions and effects</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={customization.animations}
                      onChange={(e) => handleCustomizationChange('animations', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>
                      <i className="fas fa-compress-alt"></i>
                      Compact Mode
                    </h4>
                    <p>Reduce spacing for a denser layout</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={customization.compactMode}
                      onChange={(e) => handleCustomizationChange('compactMode', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>
                      <i className="fas fa-bars"></i>
                      Sidebar Collapsed
                    </h4>
                    <p>Start with sidebar collapsed by default</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={customization.sidebarCollapsed}
                      onChange={(e) => handleCustomizationChange('sidebarCollapsed', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h3>Payment Information</h3>
                <p>Manage your billing details</p>
              </div>

              <div className="payment-cards">
                <div className="payment-card">
                  <div className="card-chip"></div>
                  <div className="card-number">{paymentData.cardNumber}</div>
                  <div className="card-details">
                    <div className="card-holder">{paymentData.cardHolder}</div>
                    <div className="card-expiry">{paymentData.expiryDate}</div>
                  </div>
                  <div className="card-brand">
                    <i className="fab fa-cc-visa"></i>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePaymentUpdate}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Card Number</label>
                    <div className="input-with-icon">
                      <i className="fas fa-credit-card"></i>
                      <input
                        type="text"
                        value={paymentData.cardNumber}
                        onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                        placeholder="•••• •••• •••• ••••"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <div className="input-with-icon">
                      <i className="fas fa-user"></i>
                      <input
                        type="text"
                        value={paymentData.cardHolder}
                        onChange={(e) => setPaymentData({ ...paymentData, cardHolder: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Expiry Date</label>
                    <div className="input-with-icon">
                      <i className="fas fa-calendar"></i>
                      <input
                        type="text"
                        value={paymentData.expiryDate}
                        onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                        placeholder="MM/YY"
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Billing Email</label>
                    <div className="input-with-icon">
                      <i className="fas fa-envelope"></i>
                      <input
                        type="email"
                        value={paymentData.billingEmail}
                        onChange={(e) => setPaymentData({ ...paymentData, billingEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="subscription-info">
                  <div className="info-card">
                    <div className="info-icon">
                      <i className="fas fa-crown"></i>
                    </div>
                    <div className="info-content">
                      <h4>Premium Plan</h4>
                      <p>$29.99/month • Next billing: Dec 1, 2025</p>
                    </div>
                    <button type="button" className="btn ghost">Manage</button>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn primary">
                    <i className="fas fa-save"></i>
                    Update Payment Info
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h3>Security Settings</h3>
                <p>Keep your account secure</p>
              </div>

              <div className="customize-section">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>
                      <i className="fas fa-mobile-alt"></i>
                      Two-Factor Authentication
                    </h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={securityData.twoFactorEnabled}
                      onChange={(e) => handleSecurityUpdate('twoFactorEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>
                      <i className="fas fa-clock"></i>
                      Session Timeout
                    </h4>
                    <p>Automatically log out after inactivity</p>
                  </div>
                  <select
                    className="select-input"
                    value={securityData.sessionTimeout}
                    onChange={(e) => handleSecurityUpdate('sessionTimeout', e.target.value)}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                <div className="setting-item vertical">
                  <div className="setting-info">
                    <h4>
                      <i className="fas fa-key"></i>
                      API Key
                    </h4>
                    <p>Your personal API key for integrations</p>
                  </div>
                  <div className="api-key-section">
                    <div className="api-key-display">
                      <code>
                        {securityData.apiKeyVisible 
                          ? 'xm_1234567890abcdef1234567890abcdef'
                          : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <button
                        className="btn ghost icon-btn"
                        onClick={() => handleSecurityUpdate('apiKeyVisible', !securityData.apiKeyVisible)}
                      >
                        <i className={`fas fa-eye${securityData.apiKeyVisible ? '-slash' : ''}`}></i>
                      </button>
                    </div>
                    <div className="api-key-actions">
                      <button className="btn secondary">
                        <i className="fas fa-copy"></i>
                        Copy
                      </button>
                      <button className="btn ghost">
                        <i className="fas fa-sync"></i>
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="danger-zone">
                  <h4>
                    <i className="fas fa-exclamation-triangle"></i>
                    Danger Zone
                  </h4>
                  <div className="danger-actions">
                    <button className="btn ghost danger">
                      <i className="fas fa-sign-out-alt"></i>
                      Log Out All Sessions
                    </button>
                    <button className="btn ghost danger">
                      <i className="fas fa-user-slash"></i>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h3>Notification Preferences</h3>
                <p>Choose what updates you want to receive</p>
              </div>

              <div className="customize-section">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>
                      <i className="fas fa-envelope"></i>
                      Email Notifications
                    </h4>
                    <p>Receive updates via email</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>
                      <i className="fas fa-robot"></i>
                      Bot Alerts
                    </h4>
                    <p>Get notified when your bots need attention</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.botAlerts}
                      onChange={(e) => handleNotificationChange('botAlerts', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>
                      <i className="fas fa-store"></i>
                      Marketplace Updates
                    </h4>
                    <p>New items and special offers</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.marketplaceUpdates}
                      onChange={(e) => handleNotificationChange('marketplaceUpdates', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>
                      <i className="fas fa-chart-line"></i>
                      Weekly Reports
                    </h4>
                    <p>Summary of your bot activities</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReports}
                      onChange={(e) => handleNotificationChange('weeklyReports', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
