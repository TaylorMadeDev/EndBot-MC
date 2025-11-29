import React, { useState } from 'react';
import { useBots } from '../context/BotsContext';
import { Link } from 'react-router-dom';
import '../styles/dashboard.css';

export default function Bots() {
  const { bots, accounts, loading, error, refresh, addBot } = useBots();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [serverHost, setServerHost] = useState('ryasandigzz.aternos.me');
  const [serverPort, setServerPort] = useState('25565');
  const [version, setVersion] = useState('1.21.8');
  const [creating, setCreating] = useState(false);

  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    
    const account = accounts.find(a => a.id === selectedAccount);
    if (!account) return;

    setCreating(true);
    try {
      await addBot({
        username: account.username,
        serverHost,
        serverPort: parseInt(serverPort),
        version
      });
      setSelectedAccount('');
      await refresh();
    } catch (err) {
      console.error('Failed to create bot:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">
            <i className="fas fa-robot"></i> My Bots
          </h1>
          <p className="page-subtitle">Create and manage your Minecraft bots</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Create Bot Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2><i className="fas fa-plus-circle"></i> Create New Bot</h2>
          </div>

          {accounts.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <i className="fas fa-user-slash empty-icon" style={{ fontSize: '3rem' }}></i>
              <h3 className="empty-title">No Accounts Available</h3>
              <p className="empty-description">You need to add a Minecraft account first before creating a bot.</p>
              <Link to="/app/accounts" className="btn primary" style={{ marginTop: '1rem' }}>
                <i className="fas fa-user-plus"></i> Add Account
              </Link>
            </div>
          ) : (
            <form onSubmit={handleCreateBot} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                  Select Account
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  required
                  style={{ width: '100%' }}
                >
                  <option value="">Choose an account...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.username} ({acc.method})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid cols-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                    Server Host
                  </label>
                  <input
                    type="text"
                    value={serverHost}
                    onChange={(e) => setServerHost(e.target.value)}
                    placeholder="localhost"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                    Server Port
                  </label>
                  <input
                    type="number"
                    className="port-input"
                    value={serverPort}
                    onChange={(e) => setServerPort(e.target.value)}
                    placeholder="25565"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                  Minecraft Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.21.8"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={creating || !selectedAccount}
                  className="btn primary"
                >
                  <i className="fas fa-play-circle"></i>
                  {creating ? 'Creating...' : 'Create Bot'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Active Bots Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2><i className="fas fa-robot"></i> Active Bots</h2>
            <span className="item-count">{bots.length} bots</span>
          </div>

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading bots...</p>
            </div>
          )}

          {error && (
            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#f87171' }}>
              <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
          )}

          {!loading && bots.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-robot empty-icon"></i>
              <h3 className="empty-title">No Bots Yet</h3>
              <p className="empty-description">Create your first bot using an account above</p>
            </div>
          ) : (
            <div className="bots-list">
              {bots.map(bot => (
                <Link
                  key={bot.id}
                  to={`/app/bots/${bot.id}`}
                  className="bot-item"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="bot-avatar">
                    <img
                      src={`https://minotar.net/avatar/${encodeURIComponent(bot.username)}/40.png`}
                      alt={bot.username}
                      style={{ width: '100%', height: '100%', borderRadius: '10px' }}
                    />
                  </div>
                  <div className="bot-info">
                    <div className="bot-name">{bot.username}</div>
                    <div className="bot-status">
                      <span className={`status-dot ${bot.status}`}></span>
                      <span>{bot.status === 'online' ? 'Connected' : 'Offline'}</span>
                      <span style={{ margin: '0 0.5rem' }}>•</span>
                      <span>{bot.serverHost}:{bot.serverPort}</span>
                    </div>
                  </div>
                  <div className="bot-actions">
                    <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)' }}></i>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
