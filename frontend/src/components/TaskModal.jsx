import React, { useMemo, useState } from 'react';
import { useBots } from '../context/BotsContext';
import { useMacros } from '../context/MacrosContext';

export default function TaskModal({ botId, isOpen, onClose }) {
  const { assignTask, bots } = useBots();
  const { macros } = useMacros();
  const bot = useMemo(() => bots.find(b => String(b.id) === String(botId)), [bots, botId]);

  const [tab, setTab] = useState('premade'); // 'premade' | 'my'
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const premade = [
    { id: 'AFK', name: 'AFK', description: 'Idle safely and prevent disconnects.' },
    { id: 'Follow Nearest Player', name: 'Follow Nearest Player', description: 'Continuously pathfind near the closest player.' }
  ];

  if (!isOpen) return null;

  const submit = async () => {
    if (!selected || !bot) return;
    setLoading(true);
    try {
      const name = typeof selected === 'string' ? selected : selected.name || selected.id;
      await assignTask(bot.id, name);
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-modal-overlay" onClick={(e) => { if (e.target.classList.contains('task-modal-overlay')) onClose?.(); }}>
      <div className="task-modal">
        <div className="task-modal-header">
          <div className="left">
            <h3><i className="fas fa-bolt"></i> Start Task</h3>
            {bot && <div className="sub">For <strong>{bot.username}</strong></div>}
          </div>
          <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>

        <div className="task-tabs">
          <button className={`task-tab ${tab === 'premade' ? 'active' : ''}`} onClick={() => { setTab('premade'); setSelected(null); }}>
            <i className="fas fa-magic"></i> Premade
          </button>
          <button className={`task-tab ${tab === 'my' ? 'active' : ''}`} onClick={() => { setTab('my'); setSelected(null); }}>
            <i className="fas fa-cogs"></i> My Tasks
          </button>
        </div>

        <div className="task-tabpanel">
          {tab === 'premade' ? (
            <div className="task-list">
              {premade.map(t => (
                <label key={t.id} className={`task-card ${selected === t.id ? 'selected' : ''}`} onClick={() => setSelected(t.id)}>
                  <div className="icon"><i className="fas fa-moon"></i></div>
                  <div className="content">
                    <div className="name">{t.name}</div>
                    <div className="desc">{t.description}</div>
                  </div>
                  <div className="marker"><i className="fas fa-check"></i></div>
                </label>
              ))}
            </div>
          ) : (
            <div className="task-list">
              {macros.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><i className="fas fa-project-diagram"></i></div>
                  <h4>No custom tasks yet</h4>
                  <p>Create macros in the Tasks section, then return here.</p>
                </div>
              ) : (
                macros.map(m => (
                  <label key={m.id} className={`task-card ${selected?.id === m.id ? 'selected' : ''}`} onClick={() => setSelected(m)}>
                    <div className="icon"><i className="fas fa-cogs"></i></div>
                    <div className="content">
                      <div className="name">{m.name}</div>
                      <div className="desc">{m.description || 'No description provided'}</div>
                    </div>
                    <div className="marker"><i className="fas fa-check"></i></div>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="task-modal-footer">
          <button className="btn ghost" onClick={onClose}><i className="fas fa-times"></i> Cancel</button>
          <button className="btn primary" disabled={!selected || loading} onClick={submit}>
            {loading ? 'Starting…' : 'Start Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
