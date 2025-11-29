import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const starsRef = useRef(null);
  const shapesRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    // Create animated starfield
    if (starsRef.current) {
      for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.animationDuration = `${2 + Math.random() * 3}s`;
        starsRef.current.appendChild(star);
      }
    }

    // Create floating shapes
    if (shapesRef.current) {
      const shapeTypes = ['circle', 'square'];
      for (let i = 0; i < 10; i++) {
        const shape = document.createElement('div');
        const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        shape.className = `shape ${type}`;
        const size = 50 + Math.random() * 100;
        shape.style.width = `${size}px`;
        shape.style.height = `${size}px`;
        shape.style.left = `${Math.random() * 100}%`;
        shape.style.top = `${Math.random() * 100}%`;
        shape.style.animationDelay = `${Math.random() * 5}s`;
        shape.style.animationDuration = `${15 + Math.random() * 10}s`;
        shapesRef.current.appendChild(shape);
      }
    }

    // Create particle effects
    if (particlesRef.current) {
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.bottom = '0';
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particle.style.animationDuration = `${10 + Math.random() * 10}s`;
        particlesRef.current.appendChild(particle);
      }
    }

    return () => {
      // Cleanup
      if (starsRef.current) starsRef.current.innerHTML = '';
      if (shapesRef.current) shapesRef.current.innerHTML = '';
      if (particlesRef.current) particlesRef.current.innerHTML = '';
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Background Elements */}
      <div className="starfield" ref={starsRef}></div>
      <div className="nebula nebula-1"></div>
      <div className="nebula nebula-2"></div>
      <div className="floating-shapes" ref={shapesRef}></div>
      <div className="particles" ref={particlesRef}></div>

      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo">
                <i className="fas fa-cube"></i>
              </div>
              <h1 className="login-title">Welcome Back</h1>
              <p className="login-subtitle">Sign in to access your bot control center</p>
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <form onSubmit={submit} className="login-form">
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-envelope"></i> Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-lock"></i> Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" className="forgot-link">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn primary login-button"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i> Sign In
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <span>Or continue with</span>
            </div>

            <div className="social-login">
              <button className="social-button" onClick={() => alert('Google login coming soon!')}>
                <i className="fab fa-google"></i>
                <span>Google</span>
              </button>
              <button className="social-button" onClick={() => alert('Discord login coming soon!')}>
                <i className="fab fa-discord"></i>
                <span>Discord</span>
              </button>
            </div>

            <div className="login-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="signup-link">
                  Create one now
                </Link>
              </p>
              <p className="back-home">
                <Link to="/">
                  <i className="fas fa-arrow-left"></i> Back to home
                </Link>
              </p>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="login-features">
            <div className="feature-pill">
              <i className="fas fa-shield-alt"></i>
              <span>Secure Authentication</span>
            </div>
            <div className="feature-pill">
              <i className="fas fa-bolt"></i>
              <span>Instant Access</span>
            </div>
            <div className="feature-pill">
              <i className="fas fa-robot"></i>
              <span>Manage 100+ Bots</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
