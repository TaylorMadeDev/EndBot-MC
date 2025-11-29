import React from 'react';
import AccountModal from '../components/AccountModal';
import { useBots } from '../context/BotsContext';
import '../styles/dashboard.css';
import { Link } from 'react-router-dom';

export default function Accounts() {
  const { bots, accounts, loading, error, refresh } = useBots();
  const [showModal, setShowModal] = React.useState(false);

  return (
    <div>
      <div className="page-header" style={{marginBottom:16}}>
        <div>
          <h1 className="page-title"><i className="fas fa-robot"></i> My Bots</h1>
          <p className="page-subtitle">Manage your bots and deploy new ones</p>
        </div>
      </div>
      <div className="card" style={{maxWidth:480, marginBottom:24}}>
        <h3 style={{fontWeight:700, marginBottom:8}}>Accounts</h3>
        <p style={{color:'var(--muted)', fontSize:13, marginBottom:12}}>Add Minecraft accounts you want to use to run bots.</p>
        <button className="btn primary" onClick={()=>setShowModal(true)}>
          <i className="fas fa-user-plus"></i> Add Account
        </button>
      </div>

      {loading && <div className="card" style={{marginTop:12}}>Loading bots…</div>}
      {error && <div className="card" style={{marginTop:12, color:'var(--danger)'}}>Error: {error}</div>}

      {accounts && accounts.length > 0 && (
        <div style={{marginTop:10}}>
          <h2 style={{fontSize:18, fontWeight:700, margin:'8px 0'}}>Accounts</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12}}>
            {accounts.map(acc => (
              <div key={acc.id} className="card" style={{padding:'12px 14px', display:'flex', flexDirection:'column', gap:6}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <img alt="skin" src={`https://minotar.net/avatar/${encodeURIComponent(acc.username)}/40.png`} style={{width:40, height:40, borderRadius:8}} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600, color:'var(--star-white)'}}>{acc.username}</div>
                    <div style={{fontSize:11, color:'var(--muted)', textTransform:'uppercase'}}>{acc.method}</div>
                  </div>
                </div>
                <div style={{fontSize:12, color:'var(--muted)'}}>Status: {acc.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bots-list" style={{marginTop:30, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16}}>
        {bots.map(b => (
          <Link key={b.id} to={`/app/bots/${b.id}`} className="quick-action-card action-cyan" style={{display:'flex', alignItems:'center', gap:12}}>
            <img alt="skin" src={`https://minotar.net/armor/body/${encodeURIComponent(b.username)}/100.png`} style={{width:48, height:48, borderRadius:8}} />
            <div style={{flex:1}}>
              <div style={{fontWeight:700, color:'var(--star-white)'}}>{b.username}</div>
              <div style={{color:'var(--muted)', fontSize:13}}>
                <span className={`status-dot ${b.status}`}></span> {b.status === 'online' ? 'Active' : 'Offline'} · {b.lastOnline}
              </div>
            </div>
            <i className="fas fa-arrow-right action-arrow"></i>
          </Link>
        ))}
        {bots.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-robot empty-icon"></i>
            <h3 className="empty-title">No Bots Yet</h3>
            <p className="empty-description">Deploy your first bot to get started</p>
          </div>
        )}
      </div>
      {showModal && <AccountModal onClose={()=>setShowModal(false)} onCreated={refresh} />}
    </div>
  );
}
