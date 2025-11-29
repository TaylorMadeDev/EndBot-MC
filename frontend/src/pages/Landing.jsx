import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';
import '../styles/landing.css';

export default function Landing() {
  const starsRef = useRef(null);
  const shapesRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    // Create animated starfield
    if (starsRef.current) {
      for (let i = 0; i < 200; i++) {
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
      for (let i = 0; i < 15; i++) {
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
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.bottom = '0';
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particle.style.animationDuration = `${10 + Math.random() * 10}s`;
        particlesRef.current.appendChild(particle);
      }
    }
  }, []);

  return (
    <div className="landing-wrapper">
      {/* Animated Starfield Background */}
      <div className="starfield" ref={starsRef}></div>
      
      {/* Floating Shapes */}
      <div className="floating-shapes" ref={shapesRef}></div>
      
      {/* Particle Effects */}
      <div className="particles" ref={particlesRef}></div>
      
      {/* Nebula gradient overlays */}
      <div className="nebula nebula-1"></div>
      <div className="nebula nebula-2"></div>

      <LandingNavbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-text"><i className="fas fa-bolt"></i> The Future of Minecraft Automation</span>
          </div>
          <h1 className="hero-title">
            <span className="gradient-text">XMineBot</span>
            <br />
            Command Your Digital Fleet
          </h1>
          <p className="hero-subtitle">
            Deploy, manage, and orchestrate hundreds of Minecraft bots across the cosmos.
            The most advanced automation platform powered by cutting-edge technology.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn primary btn-large">
              <span>Launch Dashboard</span>
              <i className="fas fa-arrow-right btn-icon"></i>
            </Link>
            <a href="#features" className="btn ghost btn-large">
              <i className="fas fa-compass"></i>
              <span>Explore Features</span>
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">100K+</div>
              <div className="stat-label">Active Bots</div>
            </div>
            <div className="stat">
              <div className="stat-value">50K+</div>
              <div className="stat-label">Users</div>
            </div>
            <div className="stat">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">CAPABILITIES</span>
            <h2 className="section-title">Engineered for <span className="gradient-text">Excellence</span></h2>
            <p className="section-description">
              Every feature designed to give you complete control over your bot fleet
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-robot"></i></div>
              <h3 className="feature-title">Neural Automation</h3>
              <p className="feature-description">
                Advanced AI-powered task automation with machine learning pathfinding.
                Your bots learn and adapt to any challenge.
              </p>
              <div className="feature-tags">
                <span className="tag"><i className="fas fa-route"></i> Smart Routing</span>
                <span className="tag"><i className="fas fa-hammer"></i> Auto-Mining</span>
                <span className="tag"><i className="fas fa-seedling"></i> AFK Farming</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-shield-alt"></i></div>
              <h3 className="feature-title">Secure Accounts</h3>
              <p className="feature-description">
                Military-grade encryption for all your Minecraft accounts.
                Manage unlimited accounts with complete peace of mind.
              </p>
              <div className="feature-tags">
                <span className="tag"><i className="fas fa-lock"></i> Encrypted Storage</span>
                <span className="tag"><i className="fas fa-user-shield"></i> 2FA Support</span>
                <span className="tag"><i className="fas fa-sign-in-alt"></i> Auto-Login</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-satellite-dish"></i></div>
              <h3 className="feature-title">Mission Control</h3>
              <p className="feature-description">
                Real-time analytics dashboard with live bot telemetry.
                Monitor performance, track resources, and optimize operations.
              </p>
              <div className="feature-tags">
                <span className="tag"><i className="fas fa-chart-line"></i> Live Metrics</span>
                <span className="tag"><i className="fas fa-bell"></i> Alerts</span>
                <span className="tag"><i className="fas fa-file-alt"></i> Logs</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-bolt"></i></div>
              <h3 className="feature-title">Lightning Fast</h3>
              <p className="feature-description">
                Optimized performance engine ensures your bots respond instantly.
                Handle thousands of actions per second without breaking a sweat.
              </p>
              <div className="feature-tags">
                <span className="tag"><i className="fas fa-tachometer-alt"></i> Low Latency</span>
                <span className="tag"><i className="fas fa-rocket"></i> High Throughput</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-server"></i></div>
              <h3 className="feature-title">Multi-Server</h3>
              <p className="feature-description">
                Deploy bots across multiple servers simultaneously.
                Built-in proxy support and automatic reconnection handling.
              </p>
              <div className="feature-tags">
                <span className="tag"><i className="fas fa-network-wired"></i> Proxy Support</span>
                <span className="tag"><i className="fas fa-sync"></i> Auto-Reconnect</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-tasks"></i></div>
              <h3 className="feature-title">Task Orchestrator</h3>
              <p className="feature-description">
                Design complex multi-step workflows with our visual task builder.
                Schedule, sequence, and synchronize bot actions effortlessly.
              </p>
              <div className="feature-tags">
                <span className="tag"><i className="fas fa-project-diagram"></i> Visual Builder</span>
                <span className="tag"><i className="fas fa-clock"></i> Scheduling</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Penetration Testing Section */}
      <section className="pentest-section">
        <div className="pentest-container">
          <div className="pentest-layout">
            <div className="pentest-content">
              <span className="section-badge"><i className="fas fa-bug"></i> SECURITY TESTING</span>
              <h2><span className="gradient-text">Server Penetration</span> Testing Suite</h2>
              <p>
                Built-in security testing tools help you identify vulnerabilities in Minecraft servers.
                Test authentication, exploit detection, and server hardening with enterprise-grade tools.
              </p>
              <div className="pentest-tools">
                <div className="tool-item">
                  <div className="tool-icon"><i className="fas fa-user-secret"></i></div>
                  <div className="tool-info">
                    <h4>Auth Bypass Scanner</h4>
                    <p>Automatically detect weak authentication mechanisms</p>
                  </div>
                </div>
                <div className="tool-item">
                  <div className="tool-icon"><i className="fas fa-search"></i></div>
                  <div className="tool-info">
                    <h4>Plugin Vulnerability Detector</h4>
                    <p>Scan for known exploits in server plugins</p>
                  </div>
                </div>
                <div className="tool-item">
                  <div className="tool-icon"><i className="fas fa-network-wired"></i></div>
                  <div className="tool-info">
                    <h4>Network Protocol Fuzzer</h4>
                    <p>Test server stability with malformed packets</p>
                  </div>
                </div>
                <div className="tool-item">
                  <div className="tool-icon"><i className="fas fa-shield-virus"></i></div>
                  <div className="tool-info">
                    <h4>DDoS Protection Tester</h4>
                    <p>Evaluate server resilience under load</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pentest-visual">
              <div className="code-terminal">
                <div className="terminal-header">
                  <div className="terminal-dot red"></div>
                  <div className="terminal-dot yellow"></div>
                  <div className="terminal-dot green"></div>
                </div>
                <div className="terminal-line">
                  <span className="terminal-prompt">xminebot@security:~$</span>
                  <span className="terminal-command">scan --target mc.server.com --mode auth</span>
                </div>
                <div className="terminal-output">
                  <div className="terminal-success"><i className="fas fa-check-circle"></i> Connecting to target...</div>
                  <div className="terminal-success"><i className="fas fa-check-circle"></i> Protocol handshake complete</div>
                  <div>Scanning authentication methods...</div>
                  <div className="terminal-warning"><i className="fas fa-exclamation-triangle"></i> VULNERABILITY FOUND: Weak password policy</div>
                  <div className="terminal-warning"><i className="fas fa-exclamation-triangle"></i> VULNERABILITY FOUND: No rate limiting on login</div>
                  <div>Testing plugin security...</div>
                  <div className="terminal-success"><i className="fas fa-check-circle"></i> Scan complete: 2 vulnerabilities detected</div>
                </div>
                <div className="terminal-line">
                  <span className="terminal-prompt">xminebot@security:~$</span>
                  <span className="terminal-command">exploit --id CVE-2024-XXXX</span>
                </div>
                <div className="terminal-output terminal-success">
                  <div><i className="fas fa-rocket"></i> Exploit successful - Access granted</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Macro Builder Section */}
      <section className="macro-section" id="macro-builder">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge"><i className="fas fa-project-diagram"></i> VISUAL AUTOMATION</span>
            <h2 className="section-title">Drag & Drop <span className="gradient-text">Macro Builder</span></h2>
            <p className="section-description">
              Create complex bot workflows with our intuitive visual programming interface - no coding required
            </p>
          </div>
          
          <div className="macro-layout">
            {/* Toolbox */}
            <div className="macro-toolbox">
              <div className="toolbox-header">
                <i className="fas fa-cube"></i>
                <span>Blocks</span>
              </div>
              <div className="toolbox-category">
                <div className="category-title"><i className="fas fa-play"></i> Actions</div>
                <div className="block-item action">
                  <i className="fas fa-walking"></i>
                  <span>Move To</span>
                </div>
                <div className="block-item action">
                  <i className="fas fa-mouse-pointer"></i>
                  <span>Right Click</span>
                </div>
                <div className="block-item action">
                  <i className="fas fa-comments"></i>
                  <span>Send Chat</span>
                </div>
              </div>
              <div className="toolbox-category">
                <div className="category-title"><i className="fas fa-code-branch"></i> Logic</div>
                <div className="block-item logic">
                  <i className="fas fa-question"></i>
                  <span>If/Else</span>
                </div>
                <div className="block-item logic">
                  <i className="fas fa-redo"></i>
                  <span>Repeat</span>
                </div>
                <div className="block-item logic">
                  <i className="fas fa-clock"></i>
                  <span>Wait</span>
                </div>
              </div>
              <div className="toolbox-category">
                <div className="category-title"><i className="fas fa-database"></i> Data</div>
                <div className="block-item data">
                  <i className="fas fa-box"></i>
                  <span>Get Item</span>
                </div>
                <div className="block-item data">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Get Position</span>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="macro-canvas">
              <div className="canvas-header">
                <span><i className="fas fa-file-code"></i> Mining Workflow</span>
                <div className="canvas-controls">
                  <button className="control-btn"><i className="fas fa-play"></i></button>
                  <button className="control-btn"><i className="fas fa-stop"></i></button>
                  <button className="control-btn"><i className="fas fa-save"></i></button>
                </div>
              </div>
              <div className="canvas-grid">
                {/* Example workflow */}
                <div className="workflow-block start-block">
                  <div className="block-icon"><i className="fas fa-flag"></i></div>
                  <div className="block-content">
                    <div className="block-title">Start</div>
                  </div>
                  <div className="block-connector"></div>
                </div>

                <div className="workflow-block action-block" style={{top: '120px'}}>
                  <div className="block-icon"><i className="fas fa-walking"></i></div>
                  <div className="block-content">
                    <div className="block-title">Move To</div>
                    <div className="block-params">X: 100, Y: 64, Z: -50</div>
                  </div>
                  <div className="block-connector"></div>
                </div>

                <div className="workflow-block logic-block" style={{top: '240px'}}>
                  <div className="block-icon"><i className="fas fa-redo"></i></div>
                  <div className="block-content">
                    <div className="block-title">Repeat Loop</div>
                    <div className="block-params">Count: 10 times</div>
                  </div>
                  <div className="block-connector"></div>
                </div>

                <div className="workflow-block action-block" style={{top: '360px', left: '60px'}}>
                  <div className="block-icon"><i className="fas fa-hammer"></i></div>
                  <div className="block-content">
                    <div className="block-title">Mine Block</div>
                    <div className="block-params">Break & Collect</div>
                  </div>
                  <div className="block-connector"></div>
                </div>

                <div className="workflow-block data-block" style={{top: '480px', left: '60px'}}>
                  <div className="block-icon"><i className="fas fa-box"></i></div>
                  <div className="block-content">
                    <div className="block-title">Check Inventory</div>
                    <div className="block-params">If full → deposit</div>
                  </div>
                  <div className="block-connector"></div>
                </div>

                <div className="workflow-block end-block" style={{top: '600px'}}>
                  <div className="block-icon"><i className="fas fa-flag-checkered"></i></div>
                  <div className="block-content">
                    <div className="block-title">End</div>
                  </div>
                </div>

                {/* Connection lines */}
                <svg className="connection-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 50 15 L 50 25" className="connection-line" />
                  <path d="M 50 35 L 50 45" className="connection-line" />
                  <path d="M 50 55 L 50 65" className="connection-line" />
                  <path d="M 50 75 L 55 80" className="connection-line" />
                  <path d="M 55 88 L 55 93" className="connection-line" />
                </svg>
              </div>
            </div>

            {/* Properties Panel */}
            <div className="macro-properties">
              <div className="properties-header">
                <i className="fas fa-cog"></i>
                <span>Properties</span>
              </div>
              <div className="property-group">
                <div className="property-label">Block Type</div>
                <div className="property-value">Repeat Loop</div>
              </div>
              <div className="property-group">
                <div className="property-label">Iterations</div>
                <input type="number" className="property-input" defaultValue="10" />
              </div>
              <div className="property-group">
                <div className="property-label">Break Condition</div>
                <select className="property-input">
                  <option>None</option>
                  <option>Inventory Full</option>
                  <option>Low Health</option>
                </select>
              </div>
              <div className="property-group">
                <div className="property-label">Priority</div>
                <div className="priority-buttons">
                  <button className="priority-btn">Low</button>
                  <button className="priority-btn active">Normal</button>
                  <button className="priority-btn">High</button>
                </div>
              </div>
              <div className="property-actions">
                <button className="btn primary" style={{width: '100%', fontSize: '0.9rem', padding: '0.75rem'}}>
                  <i className="fas fa-check"></i> Apply Changes
                </button>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="macro-features">
            <div className="macro-feature">
              <i className="fas fa-magic"></i>
              <h4>Visual Programming</h4>
              <p>Build workflows like Scratch - intuitive drag-and-drop interface</p>
            </div>
            <div className="macro-feature">
              <i className="fas fa-bolt"></i>
              <h4>Real-time Testing</h4>
              <p>Test your macros instantly with live bot simulation</p>
            </div>
            <div className="macro-feature">
              <i className="fas fa-share-alt"></i>
              <h4>Share & Export</h4>
              <p>Save templates and share workflows with your community</p>
            </div>
            <div className="macro-feature">
              <i className="fas fa-code"></i>
              <h4>Advanced Logic</h4>
              <p>Conditionals, loops, variables - all without writing code</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge"><i className="fas fa-tag"></i> PRICING</span>
            <h2 className="section-title">Choose Your <span className="gradient-text">Plan</span></h2>
            <p className="section-description">
              Scale from hobby projects to enterprise automation with flexible pricing
            </p>
          </div>
          <div className="pricing-grid">
            {/* Starter Plan */}
            <div className="pricing-card">
              <div className="pricing-header">
                <div className="pricing-icon"><i className="fas fa-rocket"></i></div>
                <h3 className="pricing-plan">Starter</h3>
                <div className="pricing-price">$0</div>
                <div className="pricing-period">forever free</div>
              </div>
              <p className="pricing-description">
                Perfect for testing and small projects
              </p>
              <ul className="pricing-features">
                <li><i className="fas fa-check"></i> Up to 5 bots</li>
                <li><i className="fas fa-check"></i> Basic automation tools</li>
                <li><i className="fas fa-check"></i> Community support</li>
                <li><i className="fas fa-check"></i> 24h bot runtime</li>
                <li><i className="fas fa-check"></i> 1 server connection</li>
              </ul>
              <Link to="/login" className="btn primary pricing-button">
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan - Featured */}
            <div className="pricing-card featured">
              <div className="pricing-header">
                <div className="pricing-icon"><i className="fas fa-star"></i></div>
                <h3 className="pricing-plan">Professional</h3>
                <div className="pricing-price">$29</div>
                <div className="pricing-period">per month</div>
              </div>
              <p className="pricing-description">
                For serious bot operators and server networks
              </p>
              <ul className="pricing-features">
                <li><i className="fas fa-check"></i> Unlimited bots</li>
                <li><i className="fas fa-check"></i> Advanced automation suite</li>
                <li><i className="fas fa-check"></i> Priority support (24/7)</li>
                <li><i className="fas fa-check"></i> Unlimited runtime</li>
                <li><i className="fas fa-check"></i> 10 server connections</li>
                <li><i className="fas fa-check"></i> Security pen-testing tools</li>
                <li><i className="fas fa-check"></i> Custom scripts & plugins</li>
                <li><i className="fas fa-check"></i> Advanced analytics</li>
              </ul>
              <Link to="/login" className="btn primary pricing-button">
                Start Pro Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="pricing-card">
              <div className="pricing-header">
                <div className="pricing-icon"><i className="fas fa-crown"></i></div>
                <h3 className="pricing-plan">Enterprise</h3>
                <div className="pricing-price">$99</div>
                <div className="pricing-period">per month</div>
              </div>
              <p className="pricing-description">
                Maximum power for large-scale operations
              </p>
              <ul className="pricing-features">
                <li><i className="fas fa-check"></i> Everything in Pro</li>
                <li><i className="fas fa-check"></i> Unlimited servers</li>
                <li><i className="fas fa-check"></i> Dedicated support team</li>
                <li><i className="fas fa-check"></i> Custom integrations</li>
                <li><i className="fas fa-check"></i> SLA guarantee (99.9%)</li>
                <li><i className="fas fa-check"></i> White-label option</li>
                <li><i className="fas fa-check"></i> API access</li>
                <li><i className="fas fa-check"></i> Team collaboration tools</li>
              </ul>
              <Link to="/login" className="btn primary pricing-button">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase/Stats Section */}
      <section className="showcase-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge"><i className="fas fa-chart-bar"></i> METRICS</span>
            <h2 className="section-title">Trusted by <span className="gradient-text">Thousands</span></h2>
          </div>
          <div className="showcase-grid">
            <div className="showcase-card">
              <div className="showcase-number">50M+</div>
              <div className="showcase-label">Bot Actions Executed</div>
              <p className="showcase-description">Millions of automated tasks completed daily across our platform</p>
            </div>
            <div className="showcase-card">
              <div className="showcase-number">1,200+</div>
              <div className="showcase-label">Servers Tested</div>
              <p className="showcase-description">Security assessments performed with our pen-testing suite</p>
            </div>
            <div className="showcase-card">
              <div className="showcase-number">24/7</div>
              <div className="showcase-label">Active Monitoring</div>
              <p className="showcase-description">Round-the-clock bot supervision and automatic failover</p>
            </div>
            <div className="showcase-card">
              <div className="showcase-number">99.9%</div>
              <div className="showcase-label">Success Rate</div>
              <p className="showcase-description">Industry-leading bot execution reliability and uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <div className="cta-glow"></div>
          <h2 className="cta-title">Ready to Deploy Your Fleet?</h2>
          <p className="cta-subtitle">
            Join the next generation of Minecraft automation. Start managing your bots like never before.
          </p>
          <Link to="/login" className="btn primary btn-large btn-cta">
            <span>Get Started Free</span>
            <i className="fas fa-arrow-right btn-icon"></i>
          </Link>
          <p className="cta-note"><i className="fas fa-check-circle"></i> No credit card required  Free tier available forever</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3><i className="fas fa-cube"></i> XMineBot</h3>
            <p>Next-generation Minecraft automation</p>
          </div>
          <div className="footer-links">
            <a href="#features"><i className="fas fa-star"></i> Features</a>
            <a href="#pricing"><i className="fas fa-tag"></i> Pricing</a>
            <Link to="/login"><i className="fas fa-sign-in-alt"></i> Login</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 XMineBot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
