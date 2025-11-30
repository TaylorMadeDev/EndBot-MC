const { verifyToken, findUserById } = require('../models/auth');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  const user = findUserById(payload.sub);
  if (!user) return res.status(401).json({ error: 'User not found' });
  req.user = { id: user.id, email: user.email, username: user.username };
  next();
}

module.exports = authMiddleware;
