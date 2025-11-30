const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');

// User routes (protected)
router.get('/', authMiddleware, (req, res) => res.status(403).json({ error: 'Forbidden' }));
router.get('/:userId', authMiddleware, userController.getUser.bind(userController));
router.post('/', authMiddleware, userController.createUser.bind(userController));
router.put('/:userId', authMiddleware, userController.updateUser.bind(userController));
router.delete('/:userId', authMiddleware, userController.deleteUser.bind(userController));

// User's bots
router.get('/:userId/bots', authMiddleware, userController.getUserBots.bind(userController));
router.get('/:userId/stats', authMiddleware, userController.getUserStats.bind(userController));

module.exports = router;
