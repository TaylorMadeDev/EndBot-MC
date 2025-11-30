import React, { useState, useEffect } from 'react';
import '../styles/accountmodal.css';

export default function BotModal({ bot, onClose, onSave, onDelete }) {
  const [username, setUsername] = useState('');
  const [serverHost, setServerHost] = useState('');
  const [serverPort, setServerPort] = useState('');
  const [version, setVersion] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (bot) {
      setUsername(bot.username || '');
      setServerHost(bot.serverHost || bot.server_host || '');
      setServerPort(String(bot.serverPort || bot.server_port || '25565'));
      setVersion(bot.version || '1.21.8');
    }
  }, [bot]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username || !serverHost || !serverPort) return;
    setSaving(true);
    try {
      await onSave({
        username,
        serverHost,
        serverPort: parseInt(serverPort),
        version
      });
      onClose();
    } catch (err) {
      console.error('Failed to save bot:', err);
      alert('Failed to save bot: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${bot.username}"? This action cannot be undone.`)) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      console.error('Failed to delete bot:', err);
      alert('Failed to delete bot: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!bot) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-x" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <h2><i className="fas fa-robot"></i> Edit Bot</h2>
        <div className="modal-subtitle">Update connection details and version</div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>
              <i className="fas fa-user"></i> Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Bot username"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-server"></i> Server Host
            </label>
            <input
              type="text"
              value={serverHost}
              onChange={(e) => setServerHost(e.target.value)}
              placeholder="localhost"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-network-wired"></i> Server Port
            </label>
            <input
              type="number"
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              placeholder="25565"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-code-branch"></i> Minecraft Version
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.21.8"
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn danger"
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              <i className="fas fa-trash"></i>
              {deleting ? 'Deleting...' : 'Delete Bot'}
            </button>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button type="button" className="btn ghost-dark" onClick={onClose} disabled={saving || deleting}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={saving || deleting || !username || !serverHost || !serverPort}>
                <i className="fas fa-save"></i>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
