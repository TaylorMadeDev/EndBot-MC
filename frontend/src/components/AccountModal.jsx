import React, { useState } from 'react';
import { useBots } from '../context/BotsContext';
import '../styles/accountmodal.css';

export default function AccountModal({ onClose, onCreated }) {
  const { addAccount } = useBots();
  const [method, setMethod] = useState('cracked');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      await addAccount({ username, method });
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { key: 'cracked', label: 'Cracked', enabled: true },
    { key: 'email', label: 'Email/Password', enabled: false },
    { key: 'microsoft', label: 'Microsoft OAuth', enabled: false },
    { key: 'tokens', label: 'Tokens', enabled: false },
    { key: 'cookies', label: 'Cookies', enabled: false }
  ];

  return (
    <div className="modal-backdrop">
      <form onSubmit={submit} className="modal-panel">
        <button type="button" className="close-x" onClick={onClose} aria-label="Close"><i className="fas fa-times"></i></button>
        <h2><i className="fas fa-user-plus"></i> Add Minecraft Account</h2>
        <p className="modal-subtitle">Select an authentication method. Only Cracked is available right now.</p>
        <div className="method-options">
          {methods.map(m => {
            const selected = method === m.key;
            return (
              <button
                type="button"
                key={m.key}
                disabled={!m.enabled}
                onClick={() => m.enabled && setMethod(m.key)}
                className={`method-option ${selected ? 'selected' : ''} ${!m.enabled ? 'disabled' : ''}`}
              >
                {m.label}{!m.enabled && ' Soon'}
              </button>
            );
          })}
        </div>
        {method === 'cracked' && (
          <div className="field-group">
            <label>Username</label>
            <input placeholder="Minecraft username" value={username} onChange={e=>setUsername(e.target.value)} />
          </div>
        )}
        {error && <div className="error-banner">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn ghost-dark" onClick={onClose}><i className="fas fa-chevron-left"></i> Cancel</button>
          <button type="submit" className="btn primary" disabled={loading || (method==='cracked' && !username)}>{loading ? 'Saving...' : 'Save Account'}</button>
        </div>
      </form>
    </div>
  );
}