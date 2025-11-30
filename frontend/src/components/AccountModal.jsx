import React, { useState } from 'react';
import { useBots } from '../context/BotsContext';
import { startMicrosoftAuth, finishMicrosoftAuth } from '../utils/api';
import '../styles/accountmodal.css';

export default function AccountModal({ onClose, onCreated }) {
  const { addAccount } = useBots();
  const [method, setMethod] = useState('cracked');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msDevice, setMsDevice] = useState(null);
  const [msName, setMsName] = useState('');
  const [allowedUsersInput] = useState(''); // This line is removed

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

  const startMicrosoft = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!msName || !/^[a-zA-Z0-9_-]{3,32}$/.test(msName)) {
        setError('Please enter a valid account name (3-32 chars, letters, numbers, _ or -).');
        setLoading(false);
        return;
      }
      const result = await startMicrosoftAuth(msName);
      console.log('Microsoft auth result:', result);
      if (result && result.device) {
        setMsDevice(result.device);
      } else {
        setError('No device code received from server');
      }
    } catch (err) {
      console.error('Microsoft auth error:', err);
      setError(err.message || 'Failed to start Microsoft authentication');
    } finally {
      setLoading(false);
    }
  };

  const completeMicrosoft = async () => {
    setLoading(true);
    setError(null);
    try {
      // Retry up to 5 times with incremental delay to allow backend to finish device auth
      const maxTries = 5;
      for (let attempt = 1; attempt <= maxTries; attempt++) {
        try {
          await finishMicrosoftAuth({ name: msName }); // Adjusted to remove allowedUsers
          if (onCreated) onCreated();
          onClose();
          return;
        } catch (innerErr) {
          const isNetworkReset = String(innerErr?.message || '').includes('Failed to fetch') || String(innerErr?.message || '').includes('NetworkError');
          // If backend still processing or connection hiccup, wait and retry
          if (attempt < maxTries && isNetworkReset) {
            const waitMs = 1000 * attempt; // 1s, 2s, 3s, ...
            await new Promise(r => setTimeout(r, waitMs));
            continue;
          }
          throw innerErr;
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to complete Microsoft authentication. Make sure you authorized the app.');
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { key: 'cracked', label: 'Cracked', enabled: true },
    { key: 'email', label: 'Email/Password', enabled: false },
    { key: 'microsoft', label: 'Microsoft OAuth', enabled: true },
    { key: 'tokens', label: 'Tokens', enabled: false },
    { key: 'cookies', label: 'Cookies', enabled: false }
  ];

  return (
    <div className="modal-backdrop">
      <form onSubmit={submit} className="modal-panel">
        <button type="button" className="close-x" onClick={onClose} aria-label="Close"><i className="fas fa-times"></i></button>
        <h2><i className="fas fa-user-plus"></i> Add Minecraft Account</h2>
        <p className="modal-subtitle">Select an authentication method. Cracked and Microsoft are available.</p>
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
            <label><i className="fas fa-user"></i> Username</label>
            <input
              type="text"
              placeholder="Minecraft username"
              value={username}
              onChange={e=>setUsername(e.target.value)}
            />
          </div>
        )}
        {method === 'microsoft' && !msDevice && (
          <div className="field-group" style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div className="field-group" style={{ textAlign: 'left' }}>
              <label><i className="fas fa-tag"></i> Account Name</label>
              <input
                type="text"
                placeholder="Unique name (e.g., MainAccount)"
                value={msName}
                onChange={e=>setMsName(e.target.value)}
              />
            </div>
            <div className="field-group" style={{ textAlign: 'left' }}>
              {/* No allowed users input; access is owner-only */} // Added comment to indicate removal
            </div>
            <p style={{ marginBottom: '1rem', color: 'var(--muted)' }}>Click below to start the Microsoft authentication process</p>
            <button type="button" className="btn primary" onClick={startMicrosoft} disabled={loading}>
              <i className="fab fa-microsoft"></i> {loading ? 'Starting...' : 'Start Microsoft Login'}
            </button>
          </div>
        )}
        {method === 'microsoft' && msDevice && (
          <div className="field-group" style={{ padding: '1rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--star-white)' }}><i className="fas fa-shield-alt"></i> Complete Authorization</h3>
            <p style={{ marginBottom: '0.75rem', color: 'var(--muted)', fontSize: '14px' }}>Visit the link below and enter this code. After authorizing, wait a couple seconds, then click Complete:</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <code style={{ flex: 1, padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '20px', fontWeight: 700, letterSpacing: '2px', textAlign: 'center', color: 'var(--star-white)' }}>{msDevice.user_code}</code>
              <button type="button" className="btn ghost" onClick={() => navigator.clipboard.writeText(msDevice.user_code)} title="Copy code">
                <i className="fas fa-copy"></i>
              </button>
            </div>
            <a href={msDevice.verification_uri} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginBottom: '1rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              <i className="fas fa-external-link-alt"></i> {msDevice.verification_uri}
            </a>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '0.5rem' }}>If you get a network error, wait 1-3 seconds and try again.</p>
          </div>
        )}
        {error && <div className="error-banner">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn ghost-dark" onClick={onClose}><i className="fas fa-chevron-left"></i> Cancel</button>
          {method === 'cracked' && (
            <button type="submit" className="btn primary" disabled={loading || !username}>{loading ? 'Saving...' : 'Save Account'}</button>
          )}
          {method === 'microsoft' && msDevice && (
            <button type="button" className="btn primary" onClick={completeMicrosoft} disabled={loading}>
              <i className="fas fa-check"></i> {loading ? 'Completing...' : 'Complete Login'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}