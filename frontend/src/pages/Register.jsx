import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/login.css';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/(?=.*[@$!%*?&#])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character (@$!%*?&#)';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate password strength
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 15;
    if (/[@$!%*?&#]/.test(password)) strength += 15;

    if (strength <= 40) return { strength, label: 'Weak', color: '#ef4444' };
    if (strength <= 70) return { strength, label: 'Medium', color: '#eab308' };
    return { strength, label: 'Strong', color: '#22c55e' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <>
      {/* Background Elements */}
      <div className="starfield" ref={starsRef}></div>
      <div className="nebula nebula-1"></div>
      <div className="nebula nebula-2"></div>
      <div className="floating-shapes" ref={shapesRef}></div>
      <div className="particles" ref={particlesRef}></div>

      <div className="login-page">
        <div className="login-container register-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo">
                <i className="fas fa-user-plus"></i>
              </div>
              <h1 className="login-title">Create Account</h1>
              <p className="login-subtitle">Join thousands of bot operators worldwide</p>
            </div>

            {errors.general && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                {errors.general}
              </div>
            )}

            {success && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-user"></i> Username
                </label>
                <input
                  type="text"
                  name="username"
                  className={`form-input ${errors.username ? 'input-error' : ''}`}
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a unique username"
                />
                {errors.username && (
                  <div className="field-error">
                    <i className="fas fa-exclamation-triangle"></i> {errors.username}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-envelope"></i> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <div className="field-error">
                    <i className="fas fa-exclamation-triangle"></i> {errors.email}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-lock"></i> Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill" 
                        style={{ 
                          width: `${passwordStrength.strength}%`,
                          backgroundColor: passwordStrength.color 
                        }}
                      ></div>
                    </div>
                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
                {errors.password && (
                  <div className="field-error">
                    <i className="fas fa-exclamation-triangle"></i> {errors.password}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-lock"></i> Confirm Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="field-error">
                    <i className="fas fa-exclamation-triangle"></i> {errors.confirmPassword}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-checkbox terms-checkbox">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (errors.terms) {
                        setErrors(prev => ({ ...prev, terms: '' }));
                      }
                    }}
                  />
                  <span>
                    I agree to the{' '}
                    <a href="#terms" className="terms-link">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#privacy" className="terms-link">Privacy Policy</a>
                  </span>
                </label>
                {errors.terms && (
                  <div className="field-error">
                    <i className="fas fa-exclamation-triangle"></i> {errors.terms}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn primary login-button"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-rocket"></i> Create Account
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <span>Or sign up with</span>
            </div>

            <div className="social-login">
              <button className="social-button" onClick={() => alert('Google signup coming soon!')}>
                <i className="fab fa-google"></i>
                <span>Google</span>
              </button>
              <button className="social-button" onClick={() => alert('Discord signup coming soon!')}>
                <i className="fab fa-discord"></i>
                <span>Discord</span>
              </button>
            </div>

            <div className="login-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="signup-link">
                  Sign in here
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
              <i className="fas fa-bolt"></i>
              <span>Quick Setup</span>
            </div>
            <div className="feature-pill">
              <i className="fas fa-gift"></i>
              <span>Free Forever Plan</span>
            </div>
            <div className="feature-pill">
              <i className="fas fa-users"></i>
              <span>Join 50K+ Users</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
