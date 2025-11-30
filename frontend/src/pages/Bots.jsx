import React, { useState } from 'react';
import { useBots } from '../context/BotsContext';
import { Link } from 'react-router-dom';
import '../styles/dashboard.css';
import CustomSelect from '../components/CustomSelect';
import BotModal from '../components/BotModal';

export default function Bots() {
  const { bots, accounts, loading, error, refresh, addBot, editBot, removeBot, killBot } = useBots();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [serverHost, setServerHost] = useState('ryasandigzz.aternos.me');
  const [serverPort, setServerPort] = useState('25565');
  const [version, setVersion] = useState('1.21.8');
  const [creating, setCreating] = useState(false);
  const [editingBot, setEditingBot] = useState(null);
  const [showMsLogin, setShowMsLogin] = useState(false);
  const [msDevice, setMsDevice] = useState(null);
  const [msAccountName, setMsAccountName] = useState('');
  const [msBotId, setMsBotId] = useState(null);

  const pollMsDevice = async (botId) => {
    if (!botId) return;
    try {
      // Try up to ~6 seconds to capture delayed device code
      for (let i = 0; i < 6; i++) {
        const token = JSON.parse(localStorage.getItem('minebot_auth'))?.token;
        const res = await fetch(`http://localhost:3001/api/bots/${botId}/status`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data && data.msDevice) {
            setMsDevice(data.msDevice);
            break;
          }
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (_) {}
  };

  const handleCreateBot = async (e) => {
    console.log('Creating bot with account identifier:', selectedAccount);
    e.preventDefault();
    if (!selectedAccount) return;

    // Try to find by name first, then by id (for cracked accounts)
    const account = accounts.find(a => 
      (a.name && String(a.name) === String(selectedAccount)) || 
      String(a.id) === String(selectedAccount)
    );
    if (!account) return;

    setCreating(true);
    try {
      // Use accountName for Microsoft accounts (which have a name), accountId for cracked accounts
      const payload = {
        serverHost,
        serverPort: parseInt(serverPort),
        version
      };
      
      if (account.name) {
        payload.accountName = account.name;
      } else {
        payload.accountId = account.id;
      }
      
      const result = await addBot(payload);
      if (result && result.requiresMicrosoftLogin) {
        setMsAccountName(result.accountName || '');
        setMsDevice(result.device || null);
        setMsBotId(result.botId || (result.bot && result.bot.id) || null);
        setShowMsLogin(true);
        // If device not present yet, poll status to fetch it when available
        if (!result.device) {
          const bId = result.botId || (result.bot && result.bot.id) || null;
          if (bId) pollMsDevice(bId);
        }
        setCreating(false);
        return;
      }
      setSelectedAccount('');
      await refresh();
    } catch (err) {
      console.error('Failed to create bot:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleEditBot = async (updates) => {
    if (!editingBot) return;
    await editBot(editingBot.id, updates);
    setEditingBot(null);
    await refresh();
  };

  const handleDeleteBot = async () => {
    if (!editingBot) return;
    await removeBot(editingBot.id);
    setEditingBot(null);
    await refresh();
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
                <CustomSelect
                  value={selectedAccount}
                  onChange={(val) => setSelectedAccount(val)}
                  placeholder="Choose an account..."
                  options={accounts.map(acc => ({ 
                    value: acc.name || String(acc.id), 
                    label: `${acc.name || acc.username} • ${acc.username} (${acc.method})` 
                  }))}
                />
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

        {/* All Bots Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2><i className="fas fa-robot"></i> All Bots</h2>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {bots.map(bot => (
                <div key={bot.id} className="bot-item" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', padding: '1.25rem' }}>
                  <Link to={`/app/bots/${bot.id}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', marginBottom: '1rem' }}>
                    <div className="bot-avatar" style={{ flexShrink: 0 }}>
                      <img
                        src={`https://minotar.net/avatar/${encodeURIComponent(bot.username)}/40.png`}
                        alt={bot.username}
                        style={{ width: '100%', height: '100%', borderRadius: '10px' }}
                      />
                    </div>
                    <div className="bot-info" style={{ flex: 1, minWidth: 0 }}>
                      <div className="bot-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bot.username}</div>
                      <div className="bot-status">
                        <span className={`status-dot ${bot.status}`}></span>
                        <span>{bot.status === 'online' ? 'Connected' : 'Offline'}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span>{bot.serverHost || bot.server_host}:{bot.serverPort || bot.server_port}</span>
                        <span style={{ margin: '0 0.5rem' }}>•</span>
                        <span>v{bot.version}</span>
                      </div>
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button
                      className="btn"
                      onClick={async () => {
                        try {
                          const token = JSON.parse(localStorage.getItem('minebot_auth'))?.token;
                          if (bot.status === 'online') {
                            await fetch(`http://localhost:3001/api/bots/${bot.id}/disconnect`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                          } else {
                            const res = await fetch(`http://localhost:3001/api/bots/${bot.id}/start`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            let data = null;
                            try { data = await res.json(); } catch (_) {}
                            if ((res.status === 409 || res.ok) && data && data.requiresMicrosoftLogin) {
                              // Show Microsoft device-code modal
                              setMsAccountName(data.accountName || '');
                              setMsDevice(data.device || null);
                              setMsBotId(bot.id);
                              setShowMsLogin(true);
                              if (!data.device) {
                                pollMsDevice(bot.id);
                              }
                              return;
                            }
                            if (!res.ok) {
                              throw new Error(data?.error || 'Failed to start bot');
                            }
                          }
                          await refresh();
                        } catch (err) {
                          console.error('Failed to toggle bot:', err);
                          alert(err.message);
                        }
                      }}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: bot.status === 'online' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: bot.status === 'online' ? '#ef4444' : '#22c55e', border: 'none', fontWeight: '500' }}
                    >
                      <i className="fas fa-power-off"></i>
                      {bot.status === 'online' ? 'Stop' : 'Start'}
                    </button>
                    {bot.status === 'online' && (
                      <button
                        className="icon-button"
                        onClick={async () => {
                          if (window.confirm(`Force kill ${bot.username}? This will forcefully terminate the bot.`)) {
                            try {
                              await killBot(bot.id);
                              await refresh();
                            } catch (err) {
                              alert('Failed to kill bot: ' + err.message);
                            }
                          }
                        }}
                        title="Force Kill"
                        style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(239,68,68,0.25)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(239,68,68,0.15)'}
                      >
                        <i className="fas fa-skull"></i>
                      </button>
                    )}
                    <button
                      className="icon-button"
                      onClick={() => setEditingBot(bot)}
                      title="Edit Bot"
                      style={{ padding: '0.5rem 0.75rem', background: 'rgba(99,102,241,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--primary)', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(99,102,241,0.2)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(99,102,241,0.1)'}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingBot && (
        <BotModal
          bot={editingBot}
          onClose={() => setEditingBot(null)}
          onSave={handleEditBot}
          onDelete={handleDeleteBot}
        />
      )}
      {showMsLogin && (
        <div className="modal-overlay" onClick={() => setShowMsLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>
                <i className="fab fa-microsoft"></i> Microsoft Authentication Required
              </h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)' }}>
                To finish linking account <strong>{msAccountName}</strong>, please authenticate with Microsoft.
              </p>
              <div style={{ padding: '0.75rem', border: '1px dashed var(--border)', borderRadius: 8, background: 'var(--bg-elevated)' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Open <a href="https://www.microsoft.com/link" target="_blank" rel="noreferrer">microsoft.com/link</a> and enter this code:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '2px' }}>
                    {msDevice?.user_code || 'Fetching code…'}
                  </div>
                  {msDevice?.user_code && (
                    <button className="btn ghost" onClick={() => navigator.clipboard.writeText(msDevice.user_code)}>Copy</button>
                  )}
                </div>
                {msDevice?.verification_uri && (
                  <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{msDevice.verification_uri}</div>
                )}
                {msDevice?.prompt && (
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>{msDevice.prompt}</div>
                )}
              </div>
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                After completing the sign-in, click Refresh to try starting the bot again.
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setShowMsLogin(false)}>Close</button>
              <button className="btn" onClick={refresh}><i className="fas fa-sync"></i> Refresh</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
