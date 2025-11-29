import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  const starsRef = useRef(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Create minimal starfield for app background
    if (starsRef.current) {
      for (let i = 0; i < 80; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.animationDuration = `${2 + Math.random() * 3}s`;
        starsRef.current.appendChild(star);
      }
    }

    return () => {
      if (starsRef.current) starsRef.current.innerHTML = '';
    };
  }, []);

  return (
    <>
      {/* Minimal background */}
      <div className="starfield" ref={starsRef}></div>
      <div className="nebula nebula-1" style={{opacity: 0.08}}></div>
      
      <div className="app-layout">
        <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        {mobileSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
        )}
        <div className="main">
          <Navbar onMobileMenuToggle={() => setMobileSidebarOpen(v => !v)} />
          <main className="container">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
