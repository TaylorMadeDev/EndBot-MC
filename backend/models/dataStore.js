const db = require('./db');

// Hybrid data store: SQLite for persistence, Maps for quick relations
class DataStore {
  constructor() {
    // No in-memory bootstrap; rely on SQLite persistence
  }

  // User methods
  getUser(userId) {
    return db.prepare('SELECT id, email, username, created_at as createdAt FROM users WHERE id = ?').get(userId);
  }

  getAllUsers() {
    return db.prepare('SELECT id, email, username, created_at as createdAt FROM users ORDER BY id').all();
  }

  createUser(userData) {
    const stmt = db.prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)');
    const info = stmt.run(userData.email, userData.username || null, userData.password_hash || '');
    return this.getUser(info.lastInsertRowid);
  }

  updateUser(userId, updates) {
    const fields = [];
    const values = [];
    if (updates.email) { fields.push('email = ?'); values.push(updates.email); }
    if (updates.username) { fields.push('username = ?'); values.push(updates.username); }
    if (updates.password_hash) { fields.push('password_hash = ?'); values.push(updates.password_hash); }
    if (!fields.length) return this.getUser(userId);
    values.push(userId);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(values);
    return this.getUser(userId);
  }

  deleteUser(userId) {
    const info = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return info.changes > 0;
  }

  // Bot methods
  getBot(botId) {
    return db.prepare('SELECT * FROM bots WHERE id = ?').get(botId);
  }

  getBotsByUser(userId) {
    return db.prepare('SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }

  createBot(userId, botData) {
    const stmt = db.prepare(`INSERT INTO bots (id, user_id, account_id, username, server_host, server_port, version, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(botData.id, userId, botData.accountId || null, botData.username, botData.serverHost || null, botData.serverPort || null, botData.version || null, botData.status || 'offline');
    return this.getBot(botData.id);
  }

  updateBot(botId, updates) {
    const fields = [];
    const values = [];
    if (updates.username) { fields.push('username = ?'); values.push(updates.username); }
    if (updates.serverHost) { fields.push('server_host = ?'); values.push(updates.serverHost); }
    if (updates.serverPort) { fields.push('server_port = ?'); values.push(updates.serverPort); }
    if (updates.version) { fields.push('version = ?'); values.push(updates.version); }
    if (updates.status) { fields.push('status = ?'); values.push(updates.status); }
    if (!fields.length) return this.getBot(botId);
    values.push(botId);
    db.prepare(`UPDATE bots SET ${fields.join(', ')} WHERE id = ?`).run(values);
    return this.getBot(botId);
  }

  deleteBot(botId) {
    const info = db.prepare('DELETE FROM bots WHERE id = ?').run(botId);
    return info.changes > 0;
  }

  getAllBots() {
    return db.prepare('SELECT * FROM bots ORDER BY created_at DESC').all();
  }

  // Account methods

  // Get account by numeric id
  getAccount(accountId) {
    return db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
  }

  // Get account by unique name for a specific user
  getAccountByNameForUser(userId, name) {
    return db.prepare('SELECT * FROM accounts WHERE user_id = ? AND name = ?').get(userId, name);
  }


  // Accounts owned by user
  getAccountsByUser(userId) {
    return db.prepare('SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }

  // Accounts user owns (access is owner-only)
  getAccountsForUserAccess(userId) {
    return this.getAccountsByUser(userId);
  }

  createAccount(userId, accountData) {
    const stmt = db.prepare('INSERT INTO accounts (user_id, name, username, method, status, auth_cache_dir, profile_json, allowed_users) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(
      userId,
      accountData.name,
      accountData.username,
      accountData.method,
      accountData.status || 'ready',
      accountData.auth_cache_dir || null,
      accountData.profile_json || null,
      JSON.stringify(accountData.allowed_users || [])
    );
    return this.getAccount(info.lastInsertRowid);
  }

  deleteAccount(accountId) {
    const info = db.prepare('DELETE FROM accounts WHERE id = ?').run(accountId);
    return info.changes > 0;
  }

  getAllAccounts() {
    return db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all();
  }

  // Activity & Metrics
  addActivity(userId, { botId = null, type, message, success = 1 }) {
    if (!type || !message) return null;
    const stmt = db.prepare('INSERT INTO activities (user_id, bot_id, type, message, success) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(userId, botId || null, type, message, success ? 1 : 0);
    return db.prepare('SELECT * FROM activities WHERE id = ?').get(info.lastInsertRowid);
  }

  listRecentActivities(userId, limit = 20) {
    return db.prepare('SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
  }

  ensureMetrics(userId) {
    const existing = db.prepare('SELECT * FROM user_metrics WHERE user_id = ?').get(userId);
    if (!existing) {
      db.prepare('INSERT INTO user_metrics (user_id, total_actions, success_actions) VALUES (?, 0, 0)').run(userId);
      return db.prepare('SELECT * FROM user_metrics WHERE user_id = ?').get(userId);
    }
    return existing;
  }

  incrementAction(userId, { success = true } = {}) {
    this.ensureMetrics(userId);
    db.prepare('UPDATE user_metrics SET total_actions = total_actions + 1, success_actions = success_actions + ? , updated_at = datetime(\'now\') WHERE user_id = ?')
      .run(success ? 1 : 0, userId);
    return db.prepare('SELECT * FROM user_metrics WHERE user_id = ?').get(userId);
  }

  getMetrics(userId) {
    return this.ensureMetrics(userId);
  }
}

module.exports = new DataStore();
