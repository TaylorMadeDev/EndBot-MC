import React, { useState } from 'react';
import { useBots } from '../context/BotsContext';
import { Link } from 'react-router-dom';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { bots, loading } = useBots();

  // Mock data for demonstration
  const stats = [
    { 
      label: 'Active Bots', 
      value: bots.length, 
      change: '+12%', 
      trend: 'up',
      icon: 'fa-robot',
      color: 'cyan'
    },
    { 
      label: 'Tasks Running', 
      value: '24', 
      change: '+5%', 
      trend: 'up',
      icon: 'fa-tasks',
      color: 'purple'
    },
    { 
      label: 'Success Rate', 
      value: '98.5%', 
      change: '+2.1%', 
      trend: 'up',
      icon: 'fa-chart-line',
      color: 'green'
    },
    { 
      label: 'Total Actions', 
      value: '1.2M', 
      change: '+18%', 
      trend: 'up',
      icon: 'fa-bolt',
      color: 'pink'
    },
  ];

  const recentActivity = [
    { type: 'success', message: 'Bot "FarmMaster" completed mining task', time: '2 min ago', icon: 'fa-check-circle' },
    { type: 'warning', message: 'Low resource warning on "MiningBot"', time: '5 min ago', icon: 'fa-exclamation-triangle' },
    { type: 'info', message: 'New bot "BuilderX" deployed successfully', time: '12 min ago', icon: 'fa-robot' },
    { type: 'success', message: 'Task "Auto-Farm" executed 50 times', time: '20 min ago', icon: 'fa-sync' },
  ];

  const quickActions = [
    { label: 'Deploy Bot', icon: 'fa-plus-circle', link: '/app/bots', color: 'purple' },
    { label: 'Create Task', icon: 'fa-tasks', link: '/app/tasks', color: 'cyan' },
    { label: 'Build Macro', icon: 'fa-project-diagram', link: '/app/macros', color: 'pink' },
    { label: 'Run Test', icon: 'fa-shield-alt', link: '/app/pentest', color: 'orange' },
  ];

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-th-large"></i> Dashboard
          </h1>
          <p className="page-subtitle">Welcome back! Here's what's happening with your bots today.</p>
        </div>
        <div className="page-actions">
          <button className="btn ghost">
            <i className="fas fa-download"></i>
            Export Report
          </button>
          <Link to="/app/bots" className="btn primary">
            <i className="fas fa-plus"></i>
            Deploy New Bot
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card stat-${stat.color}`}>
            <div className="stat-header">
              <div className={`stat-icon stat-icon-${stat.color}`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <div className={`stat-trend ${stat.trend}`}>
                <i className={`fas fa-arrow-${stat.trend === 'up' ? 'up' : 'down'}`}></i>
                {stat.change}
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
            <div className="stat-progress">
              <div className="progress-bar">
                <div className={`progress-fill progress-${stat.color}`} style={{width: '70%'}}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2 style={{fontSize: '1.25rem', fontWeight: 700, color: 'var(--star-white)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
          <i className="fas fa-bolt"></i> Quick Actions
        </h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link} className={`quick-action-card action-${action.color}`}>
              <div className={`action-icon action-icon-${action.color}`}>
                <i className={`fas ${action.icon}`}></i>
              </div>
              <span className="action-label">{action.label}</span>
              <i className="fas fa-arrow-right action-arrow"></i>
            </Link>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Active Bots */}
        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h2 style={{fontSize: '1.25rem', fontWeight: 700, color: 'var(--star-white)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem'}}>
                <i className="fas fa-robot"></i> Active Bots
              </h2>
              <p className="section-subtitle">{loading ? 'Loading…' : `${bots.length} bots currently running`}</p>
            </div>
            <Link to="/app/bots" className="text-link">
              View All <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="bots-list">
            {bots.slice(0, 5).map((bot) => (
              <div key={bot.id} className="bot-item">
                <img alt="skin" src={`https://minotar.net/armor/body/${encodeURIComponent(bot.username)}/64.png`} className="bot-avatar" />
                <div className="bot-info">
                  <div className="bot-name">{bot.username}</div>
                  <div className="bot-status">
                    <span className={`status-dot ${bot.status}`}></span>
                    {bot.status === 'online' ? 'Active' : 'Offline'} · {bot.lastOnline}
                  </div>
                </div>
                <div className="bot-actions">
                  <Link className="icon-button" title="Manage" to={`/app/bots/${bot.id}`}>
                    <i className="fas fa-sliders-h"></i>
                  </Link>
                </div>
              </div>
            ))}
            {bots.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-robot empty-icon"></i>
                <h3 className="empty-title">No Bots Yet</h3>
                <p className="empty-description">Deploy your first bot to get started</p>
                <Link to="/app/bots" className="btn primary">
                  <i className="fas fa-plus"></i> Deploy Bot
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h2 style={{fontSize: '1.25rem', fontWeight: 700, color: 'var(--star-white)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem'}}>
                <i className="fas fa-history"></i> Recent Activity
              </h2>
              <p className="section-subtitle">Latest events from your bots</p>
            </div>
          </div>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className={`activity-item activity-${activity.type}`}>
                <div className={`activity-icon activity-icon-${activity.type}`}>
                  <i className={`fas ${activity.icon}`}></i>
                </div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">
                    <i className="fas fa-clock"></i> {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="dashboard-section chart-section">
        <div className="section-header">
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 700, color: 'var(--star-white)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem'}}>
              <i className="fas fa-chart-area"></i> Performance Overview
            </h2>
            <p className="section-subtitle">Bot activity over the last 7 days</p>
          </div>
          <div className="chart-controls">
            <button className="chart-btn active">7D</button>
            <button className="chart-btn">30D</button>
            <button className="chart-btn">90D</button>
          </div>
        </div>
        <div className="chart-placeholder">
          <i className="fas fa-chart-line"></i>
          <p>Chart visualization coming soon</p>
        </div>
      </div>
    </div>
  );
}
