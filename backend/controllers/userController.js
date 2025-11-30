const dataStore = require('../models/dataStore');

class UserController {
  // Get user by ID
  getUser(req, res) {
    const userId = parseInt(req.params.userId);
    const user = dataStore.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  }

  // Get all users
  getAllUsers(req, res) {
    const users = dataStore.getAllUsers();
    res.json({
      users,
      count: users.length
    });
  }

  // Create new user
  createUser(req, res) {
    const { username, email, displayName } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    const user = dataStore.createUser({
      username,
      email,
      displayName: displayName || username
    });

    res.status(201).json(user);
  }

  // Update user
  updateUser(req, res) {
    const userId = parseInt(req.params.userId);
    const updates = req.body;
    
    const user = dataStore.updateUser(userId, updates);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  }

  // Delete user
  deleteUser(req, res) {
    const userId = parseInt(req.params.userId);
    const deleted = dataStore.deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted' });
  }

  // Get user's bots
  getUserBots(req, res) {
    const userId = parseInt(req.params.userId);
    const user = dataStore.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const bots = dataStore.getBotsByUser(userId);
    res.json({
      userId,
      bots,
      count: bots.length
    });
  }

  // Get dashboard stats and recent activity for a user
  getUserStats(req, res) {
    const userId = parseInt(req.params.userId);
    const user = dataStore.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const bots = dataStore.getBotsByUser(userId);
    // Determine connected via live state to avoid stale DB status
    let connectedBots = 0;
    try {
      const botManager = require('../bot');
      connectedBots = bots.reduce((acc, b) => acc + (botManager.getBotState(b.id)?.connected ? 1 : 0), 0);
    } catch (_) {
      connectedBots = bots.filter(b => b.status === 'online').length;
    }

    const metrics = dataStore.getMetrics(userId);
    const totalActions = metrics.total_actions || 0;
    const successActions = metrics.success_actions || 0;
    const successRate = totalActions > 0 ? Math.round((successActions / totalActions) * 1000) / 10 : 0;

    // Recent activity
    const recent = dataStore.listRecentActivities(userId, 20).map(a => ({
      id: a.id,
      type: a.type,
      message: a.message,
      time: a.created_at,
      botId: a.bot_id,
      success: !!a.success
    }));

    // Tasks running (derive: count bots with a running task from live state if available)
    let tasksRunning = 0;
    try {
      const botManager = require('../bot');
      tasksRunning = bots.reduce((acc, b) => {
        const state = botManager.getBotState(b.id);
        return acc + (state && state.currentTask ? 1 : 0);
      }, 0);
    } catch (_) { tasksRunning = 0; }

    res.json({
      userId,
      totals: {
        activeBots: connectedBots,
        tasksRunning,
        totalActions,
        successRate
      },
      recentActivity: recent
    });
  }
}

module.exports = new UserController();
