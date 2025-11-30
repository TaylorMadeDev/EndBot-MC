import React from 'react';
import AccountModal from '../components/AccountModal';
import { useBots } from '../context/BotsContext';
import { deleteAccount } from '../utils/api';
import '../styles/dashboard.css';

export default function Accounts() {
  const { accounts, loading, error, refresh } = useBots();
  const [showModal, setShowModal] = React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;
    try {
      await deleteAccount(deletingAccount.id);
      await refresh();
      setShowDeleteConfirm(false);
      setDeletingAccount(null);
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Failed to delete account: ' + err.message);
    }
  };

  const confirmDelete = (account) => {
    setDeletingAccount(account);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title"><i className="fas fa-user"></i> Accounts</h1>
            <p className="page-subtitle">Add and manage Minecraft accounts (Cracked or Microsoft) used by your bots</p>
          </div>
          <button className="btn primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-user-plus"></i> Add Account
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading accounts...</p>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#f87171' }}>
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      )}

      {!loading && accounts.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <i className="fas fa-user-slash empty-icon" style={{ fontSize: '3rem' }}></i>
          <h3 className="empty-title">No Accounts Yet</h3>
          <p className="empty-description">Add your Minecraft accounts to start deploying bots</p>
          <button className="btn primary" onClick={() => setShowModal(true)} style={{ marginTop: '1rem' }}>
            <i className="fas fa-user-plus"></i> Add Account
          </button>
        </div>
      ) : (
        <div className="dashboard-section">
          <div className="section-header">
            <h2><i className="fas fa-id-card"></i> Your Accounts</h2>
            <span className="item-count">{accounts.length} accounts</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {accounts.map(acc => (
              <div key={acc.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    alt="skin"
                    src={`https://minotar.net/avatar/${encodeURIComponent(acc.username)}/60.png`}
                    style={{ width: 48, height: 48, borderRadius: 10 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--star-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {acc.name || acc.username}
                      {acc.method === 'microsoft' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#818cf8' }}>
                          <i className="fab fa-microsoft"></i> MS
                        </span>
                      )}
                      {acc.accessType === 'shared' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#facc15' }}>
                          <i className="fas fa-user-friends"></i> Shared
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      <span style={{ textTransform: 'uppercase', letterSpacing: '.4px' }}>{acc.method}</span>
                      <span style={{ margin: '0 .5rem' }}>•</span>
                      <span>MC Username: {acc.username}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Status: {acc.status || 'ready'}</div>
                  <button 
                    className="btn ghost" 
                    style={{ padding: '.4rem .8rem', color: '#ef4444' }}
                    onClick={() => confirmDelete(acc)}
                  >
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && <AccountModal onClose={() => setShowModal(false)} onCreated={refresh} />}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444' }}></i> Delete Account
              </h2>
            </div>
            <div className="modal-body">
              <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>
                Are you sure you want to delete the account <strong>{deletingAccount?.name || deletingAccount?.username}</strong>?
              </p>
              <p style={{ margin: '1rem 0', fontSize: '0.875rem', color: '#ef4444' }}>
                This action cannot be undone. All bots using this account will be affected.
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn ghost" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingAccount(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleDeleteAccount}
              >
                <i className="fas fa-trash"></i> Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
