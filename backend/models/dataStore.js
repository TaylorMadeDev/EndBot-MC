// In-memory data store (replace with database later)
class DataStore {
  constructor() {
    this.users = new Map();
    this.bots = new Map();
    this.botsByUser = new Map();
    this.accounts = new Map();
    this.accountsByUser = new Map();
    
    // Initialize default user
    this.users.set(1, {
      id: 1,
      username: 'admin',
      email: 'admin@xminebot.com',
      displayName: 'Admin User',
      createdAt: new Date().toISOString(),
      botCount: 0
    });
    
    this.botsByUser.set(1, []);
    this.accountsByUser.set(1, []);

    // Add a default dummy bot for testing
    const dummyBotId = 'dummy-1';
    const dummyBot = {
      id: dummyBotId,
      username: 'DummyBot',
      status: 'online',
      lastOnline: 'now',
      serverHost: 'ryasandigzz.aternos.me',
      serverPort: 25565,
      version: '1.21.8'
    };
    this.createBot(1, dummyBot);

    // Add a test cracked account
    this.createAccount(1, {
      id: 'acc-test-1',
      username: 'TestPlayer',
      method: 'cracked',
      status: 'ready'
    });
  }

  // User methods
  getUser(userId) {
    return this.users.get(userId);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  createUser(userData) {
    const userId = this.users.size + 1;
    const user = {
      id: userId,
      ...userData,
      createdAt: new Date().toISOString(),
      botCount: 0
    };
    this.users.set(userId, user);
    this.botsByUser.set(userId, []);
    this.accountsByUser.set(userId, []);
    return user;
  }

  updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) return null;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  deleteUser(userId) {
    const deleted = this.users.delete(userId);
    if (deleted) {
      this.botsByUser.delete(userId);
      this.accountsByUser.delete(userId);
    }
    return deleted;
  }

  // Bot methods
  getBot(botId) {
    return this.bots.get(botId);
  }

  getBotsByUser(userId) {
    const botIds = this.botsByUser.get(userId) || [];
    return botIds.map(id => this.bots.get(id)).filter(Boolean);
  }

  createBot(userId, botData) {
    const bot = {
      ...botData,
      userId,
      createdAt: new Date().toISOString()
    };
    
    this.bots.set(botData.id, bot);
    
    const userBots = this.botsByUser.get(userId) || [];
    userBots.push(botData.id);
    this.botsByUser.set(userId, userBots);
    
    // Update user bot count
    const user = this.users.get(userId);
    if (user) {
      user.botCount = userBots.length;
    }
    
    return bot;
  }

  updateBot(botId, updates) {
    const bot = this.bots.get(botId);
    if (!bot) return null;
    
    const updatedBot = { ...bot, ...updates };
    this.bots.set(botId, updatedBot);
    return updatedBot;
  }

  deleteBot(botId) {
    const bot = this.bots.get(botId);
    if (!bot) return false;
    
    const userId = bot.userId;
    const userBots = this.botsByUser.get(userId) || [];
    const newUserBots = userBots.filter(id => id !== botId);
    this.botsByUser.set(userId, newUserBots);
    
    // Update user bot count
    const user = this.users.get(userId);
    if (user) {
      user.botCount = newUserBots.length;
    }
    
    return this.bots.delete(botId);
  }

  getAllBots() {
    return Array.from(this.bots.values());
  }

  // Account methods
  getAccount(accountId) {
    return this.accounts.get(accountId);
  }

  getAccountsByUser(userId) {
    const accountIds = this.accountsByUser.get(userId) || [];
    return accountIds.map(id => this.accounts.get(id)).filter(Boolean);
  }

  createAccount(userId, accountData) {
    const account = {
      ...accountData,
      userId,
      createdAt: new Date().toISOString()
    };
    this.accounts.set(account.id, account);
    const userAccounts = this.accountsByUser.get(userId) || [];
    userAccounts.push(account.id);
    this.accountsByUser.set(userId, userAccounts);
    return account;
  }

  deleteAccount(accountId) {
    const account = this.accounts.get(accountId);
    if (!account) return false;
    const userId = account.userId;
    const userAccounts = this.accountsByUser.get(userId) || [];
    const newUserAccounts = userAccounts.filter(id => id !== accountId);
    this.accountsByUser.set(userId, newUserAccounts);
    return this.accounts.delete(accountId);
  }

  getAllAccounts() {
    return Array.from(this.accounts.values());
  }
}

module.exports = new DataStore();
