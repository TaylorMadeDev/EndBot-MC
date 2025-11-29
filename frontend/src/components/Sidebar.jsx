import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const LinkItem = ({ to, icon, children, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `sidebar-link ${isActive ? 'active' : ''}`
    }
  >
    <div className="link-icon">
      <i className={`fas ${icon}`}></i>
    </div>
    <span className="link-text">{children}</span>
    {badge && <span className="link-badge">{badge}</span>}
  </NavLink>
);

export default function Sidebar({ mobileOpen = false, onClose }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <i className="fas fa-cube"></i>
        </div>
        {!collapsed && !mobileOpen && (
          <div className="brand-text">
            <div className="brand-name">XMineBot</div>
            <div className="brand-subtitle">Control Center</div>
          </div>
        )}
        {/* Unified toggle button (hidden in mobile drawer) */}
        {!mobileOpen && (
          <button
            className="sidebar-toggle-btn"
            onClick={() => setCollapsed(prev => !prev)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`fas fa-angle-${collapsed ? 'right' : 'left'}`}></i>
          </button>
        )}
        {mobileOpen && (
          <button
            className="mobile-close-btn"
            onClick={onClose}
            title="Close menu"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          <LinkItem to="/app/dashboard" icon="fa-th-large">
            Dashboard
          </LinkItem>
          <LinkItem to="/app/bots" icon="fa-robot" badge="5">
            My Bots
          </LinkItem>
          <LinkItem to="/app/accounts" icon="fa-user-circle">
            Accounts
          </LinkItem>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Automation</div>
          <LinkItem to="/app/tasks" icon="fa-tasks">
            Tasks
          </LinkItem>
          <LinkItem to="/app/macros" icon="fa-project-diagram">
            Macros
          </LinkItem>
          <LinkItem to="/app/scheduler" icon="fa-clock">
            Scheduler
          </LinkItem>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Tools</div>
          <LinkItem to="/app/analytics" icon="fa-chart-line">
            Analytics
          </LinkItem>
          <LinkItem to="/app/pentest" icon="fa-shield-alt">
            Pen Testing
          </LinkItem>
          <LinkItem to="/app/marketplace" icon="fa-store">
            Marketplace
          </LinkItem>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Settings</div>
          <LinkItem to="/app/settings" icon="fa-cog">
            Settings
          </LinkItem>
          <LinkItem to="/app/help" icon="fa-question-circle">
            Help & Support
          </LinkItem>
        </div>
      </nav>

      {/* Upgrade Card */}
      {!collapsed && (
        <div className="sidebar-upgrade">
          <div className="upgrade-icon">
            <i className="fas fa-rocket"></i>
          </div>
          <div className="upgrade-title">Upgrade to Pro</div>
          <div className="upgrade-text">Unlock unlimited bots and advanced features</div>
          <button className="btn primary" style={{width: '100%', fontSize: '0.9rem', padding: '0.75rem'}}>
            Upgrade Now
          </button>
        </div>
      )}

    </aside>
  );
}
