const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User routes
router.get('/', userController.getAllUsers.bind(userController));
router.get('/:userId', userController.getUser.bind(userController));
router.post('/', userController.createUser.bind(userController));
router.put('/:userId', userController.updateUser.bind(userController));
router.delete('/:userId', userController.deleteUser.bind(userController));

// User's bots
router.get('/:userId/bots', userController.getUserBots.bind(userController));
router.get('/:userId/stats', userController.getUserStats.bind(userController));

module.exports = router;
