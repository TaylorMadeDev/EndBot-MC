require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const botRoutes = require('./routes/botRoutes');
const accountRoutes = require('./routes/accountRoutes');
const authRoutes = require('./routes/authRoutes');
const shodanRoutes = require('./routes/shodanRoutes');
const serverRoutes = require('./routes/serverRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/shodan', shodanRoutes);
app.use('/api/servers', serverRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'XMineBot API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      bots: '/api/bots',
      accounts: '/api/accounts',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 XMineBot API Server running on http://localhost:${PORT}`);
  console.log(`📊 API Documentation:`);
  console.log(`   Users:  http://localhost:${PORT}/api/users`);
  console.log(`   Bots:   http://localhost:${PORT}/api/bots`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`\n💡 Default user ID: 1`);
});
