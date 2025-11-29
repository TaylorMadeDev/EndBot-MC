import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound(){
  return (
    <div style={{minHeight:'70vh', display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="card center">
        <h2 style={{fontSize:32,fontWeight:800,marginBottom:8}}>404</h2>
        <p style={{color:'var(--muted)',marginBottom:12}}>Page not found</p>
        <Link to="/app/dashboard" className="btn primary">Go to Dashboard</Link>
      </div>
    </div>
  );
}
