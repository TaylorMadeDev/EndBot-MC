import React, { useState } from 'react';
import { useBots } from '../context/BotsContext';

export default function AccountForm({ onAdded }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { addBot } = useBots();

  const submit = async (e) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    await addBot({
      username,
      serverHost: 'ryasandigzz.aternos.me',
      serverPort: 25565,
      version: '1.21.8',
    });
    setUsername('');
    setLoading(false);
    if (onAdded) onAdded();
  };

  return (
    <form onSubmit={submit} className="card" style={{maxWidth:480}}>
      <h3 style={{fontWeight:700, marginBottom:8}}>Add Minecraft Account</h3>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Minecraft username"
      />
      <div style={{marginTop:12, textAlign:'right'}}>
        <button type="submit" disabled={loading} className="btn primary">
          {loading ? 'Adding...' : 'Add Account'}
        </button>
      </div>
    </form>
  );
}
