const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}
function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}
function createUser({ email, username, password }) {
  const password_hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)');
  const info = stmt.run(email, username || null, password_hash);
  return findUserById(info.lastInsertRowid);
}
function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}
function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}
function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

module.exports = { findUserByEmail, findUserById, createUser, verifyPassword, signToken, verifyToken };
