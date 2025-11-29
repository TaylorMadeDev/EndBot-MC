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

  // Get user stats
  getUserStats(req, res) {
    const userId = parseInt(req.params.userId);
    const user = dataStore.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const bots = dataStore.getBotsByUser(userId);
    const connectedBots = bots.filter(bot => bot.connected).length;
    
    res.json({
      userId,
      totalBots: bots.length,
      connectedBots,
      disconnectedBots: bots.length - connectedBots,
      user: {
        username: user.username,
        email: user.email,
        displayName: user.displayName
      }
    });
  }
}

module.exports = new UserController();
