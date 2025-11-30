const { findUserByEmail, createUser, verifyPassword, signToken, findUserById } = require('../models/auth');

class AuthController {
  register(req, res) {
    const { email, username, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const existing = findUserByEmail(email);
    if (existing) return res.status(400).json({ error: 'email already used' });
    const user = createUser({ email, username, password });
    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  }
  login(req, res) {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = findUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) return res.status(400).json({ error: 'invalid credentials' });
    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  }
  me(req, res) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = findUserById(req.user.id);
    res.json({ user: { id: user.id, email: user.email, username: user.username } });
  }
}

module.exports = new AuthController();
