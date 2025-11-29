import React from 'react';
import { useBots } from '../context/BotsContext';

export default function BotCard({ bot }) {
  const { removeBot } = useBots();

  return (
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:10,height:10,borderRadius:99,background: bot.status === 'online' ? '#34d399' : '#94a3b8'}} />
            <div style={{fontWeight:600}}>{bot.username}</div>
          </div>
          <div style={{fontSize:12,color:'var(--muted)'}}>Last online: {bot.lastOnline}</div>
        </div>

        <div>
          <button onClick={() => removeBot(bot.id)} className="btn danger">Remove</button>
        </div>
      </div>

      <div style={{marginTop:12}}>
        <div style={{fontSize:13,color:'#cfeffd'}}>Tasks:</div>
        <ul style={{marginTop:8, marginLeft:18, color:'var(--muted)', fontSize:13}}>
          {bot.tasks && bot.tasks.length ? (
            bot.tasks.map((t, i) => <li key={i}>{t}</li>)
          ) : (
            <li style={{color:'#8b98a8'}}>No tasks assigned</li>
          )}
        </ul>
      </div>
    </div>
  );
}
