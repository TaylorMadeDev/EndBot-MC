const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');
const authMiddleware = require('../middleware/auth');

// Bot routes
router.get('/', authMiddleware, botController.getAllBots.bind(botController));
router.get('/:botId', authMiddleware, botController.getBot.bind(botController));
router.post('/', authMiddleware, botController.createBot.bind(botController));
router.put('/:botId', authMiddleware, botController.updateBot.bind(botController));
router.delete('/:botId', authMiddleware, botController.deleteBot.bind(botController));

// Bot-specific actions
router.get('/:botId/health', authMiddleware, botController.getBotHealth.bind(botController));
router.get('/:botId/position', authMiddleware, botController.getBotPosition.bind(botController));
router.get('/:botId/inventory', authMiddleware, botController.getBotInventory.bind(botController));
// Equip (armor-only)
router.post('/:botId/inventory/equip', authMiddleware, botController.equipItem.bind(botController));
// Unequip armor
router.post('/:botId/inventory/unequip', authMiddleware, botController.unequipItem.bind(botController));
// Consume food
router.post('/:botId/inventory/consume', authMiddleware, botController.consumeFood.bind(botController));
router.get('/:botId/players', authMiddleware, botController.getBotPlayers.bind(botController));
router.get('/:botId/entities', authMiddleware, botController.getBotEntities.bind(botController));
router.post('/:botId/chat', authMiddleware, botController.sendChat.bind(botController));
// Unified status endpoint
router.get('/:botId/status', authMiddleware, botController.getBotStatus.bind(botController));
// Live events stream (SSE)
router.get('/:botId/events', authMiddleware, botController.streamBotEvents.bind(botController));
// Connection controls
router.post('/:botId/disconnect', authMiddleware, botController.disconnectBotAction.bind(botController));
router.post('/:botId/reconnect', authMiddleware, botController.reconnectBotAction.bind(botController));
// Explicit start endpoint (alias of reconnect with logging)
router.post('/:botId/start', authMiddleware, botController.startBotAction.bind(botController));
// Force kill endpoint (for stuck/glitched bots)
router.post('/:botId/kill', authMiddleware, botController.forceKillBot.bind(botController));
// Tasks
router.post('/:botId/task', authMiddleware, botController.startTask.bind(botController));
router.post('/:botId/task/stop', authMiddleware, botController.stopTask.bind(botController));
router.post('/:botId/task/pause', authMiddleware, botController.pauseTask.bind(botController));
router.post('/:botId/task/resume', authMiddleware, botController.resumeTask.bind(botController));

module.exports = router;
