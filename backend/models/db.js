const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.sqlite');
// Ensure folder exists
try { fs.mkdirSync(path.dirname(DB_PATH), { recursive: true }); } catch {}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL, -- Human-readable name (unique per user)
  username TEXT NOT NULL,
  method TEXT NOT NULL,
  status TEXT DEFAULT 'ready',
  auth_cache_dir TEXT,
  profile_json TEXT,
  allowed_users TEXT DEFAULT '[]', -- Reserved; not used for UI input
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bots (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  account_id INTEGER,
  username TEXT NOT NULL,
  server_host TEXT,
  server_port INTEGER,
  version TEXT,
  status TEXT DEFAULT 'offline',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS macros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  script TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity log for dashboard
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  bot_id TEXT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  success INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE SET NULL
);

-- Per-user metrics for totals and success rate
CREATE TABLE IF NOT EXISTS user_metrics (
  user_id INTEGER PRIMARY KEY,
  total_actions INTEGER DEFAULT 0,
  success_actions INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Monitored servers for pentester feature
CREATE TABLE IF NOT EXISTS monitored_servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  version TEXT,
  status TEXT DEFAULT 'unknown',
  player_count INTEGER,
  max_players INTEGER,
  motd TEXT,
  metadata TEXT,
  added_at TEXT DEFAULT (datetime('now')),
  last_checked TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// Lightweight migrations for missing columns in existing installations
try {
  const pragma = db.prepare("PRAGMA table_info(accounts)").all();
  const cols = new Set(pragma.map(c => c.name));
  if (!cols.has('auth_cache_dir')) {
    db.exec("ALTER TABLE accounts ADD COLUMN auth_cache_dir TEXT");
  }
  if (!cols.has('profile_json')) {
    db.exec("ALTER TABLE accounts ADD COLUMN profile_json TEXT");
  }
  if (!cols.has('name')) {
    db.exec("ALTER TABLE accounts ADD COLUMN name TEXT");
  }
  if (!cols.has('allowed_users')) {
    db.exec("ALTER TABLE accounts ADD COLUMN allowed_users TEXT DEFAULT '[]'");
  }
  // Ensure unique constraint on (user_id, name)
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS accounts_user_name_unique ON accounts(user_id, name)");
} catch (e) {
  console.warn('DB migration warning (accounts columns):', e.message);
}

module.exports = db;
