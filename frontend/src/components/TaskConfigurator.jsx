import React, { useState } from 'react';
import { useBots } from '../context/BotsContext';

const TASKS = ['AFK', 'Follow Nearest Player', 'Farm', 'Walk', 'Ping Server', 'Mine', 'Chat'];

export default function TaskConfigurator() {
  const { bots, assignTask } = useBots();
  const [selectedBot, setSelectedBot] = useState('');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleTask = (task) => {
    setSelectedTasks((s) => (s.includes(task) ? s.filter(t => t !== task) : [...s, task]));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedBot || selectedTasks.length === 0) return;
    setLoading(true);
    for (const t of selectedTasks) {
      // eslint-disable-next-line no-await-in-loop
      await assignTask(selectedBot, t);
    }
    setLoading(false);
    setSelectedTasks([]);
  };

  return (
    <div className="card" style={{maxWidth:880}}>
      <h3 style={{fontWeight:700, marginBottom:10}}>Configure Tasks</h3>

      <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:12}}>
        <select value={selectedBot} onChange={(e) => setSelectedBot(e.target.value)}>
          <option value="">Select a bot...</option>
          {bots.map(b => (
            <option key={b.id} value={b.id}>{b.username}</option>
          ))}
        </select>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
          {TASKS.map(t => (
            <label key={t} style={{display:'flex',alignItems:'center',gap:8,padding:8,borderRadius:8,background:'transparent',cursor:'pointer',border:'1px solid rgba(148,163,184,0.03)'}}>
              <input type="checkbox" checked={selectedTasks.includes(t)} onChange={() => toggleTask(t)} />
              <span style={{fontSize:14}}>{t}</span>
            </label>
          ))}
        </div>

        <div style={{textAlign:'right'}}>
          <button className="btn primary" disabled={loading}>{loading ? 'Assigning...' : 'Assign Tasks'}</button>
        </div>
      </form>
    </div>
  );
}
