import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingNavbar() {
  return (
    <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',background:'linear-gradient(180deg, rgba(2,6,23,0.2), transparent)'}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{fontSize:20,fontWeight:800,color:'var(--accent)'}}>MineBot</div>
        <div style={{color:'var(--muted)'}}>Slick Minecraft bot hosting</div>
      </div>

      <div style={{display:'flex',gap:10}}>
        <Link to="/login" className="btn ghost">Login</Link>
        <a href="#get-started" className="btn primary">Get Started</a>
      </div>
    </nav>
  );
}
