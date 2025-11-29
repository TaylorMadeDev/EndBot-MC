const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');

// Bot routes
router.get('/', botController.getAllBots.bind(botController));
router.get('/:botId', botController.getBot.bind(botController));
router.post('/', botController.createBot.bind(botController));
router.put('/:botId', botController.updateBot.bind(botController));
router.delete('/:botId', botController.deleteBot.bind(botController));

// Bot-specific actions
router.get('/:botId/health', botController.getBotHealth.bind(botController));
router.get('/:botId/position', botController.getBotPosition.bind(botController));
router.get('/:botId/inventory', botController.getBotInventory.bind(botController));
// Equip (armor-only)
router.post('/:botId/inventory/equip', botController.equipItem.bind(botController));
// Unequip armor
router.post('/:botId/inventory/unequip', botController.unequipItem.bind(botController));
router.get('/:botId/players', botController.getBotPlayers.bind(botController));
router.get('/:botId/entities', botController.getBotEntities.bind(botController));
router.post('/:botId/chat', botController.sendChat.bind(botController));
// Unified status endpoint
router.get('/:botId/status', botController.getBotStatus.bind(botController));
// Live events stream (SSE)
router.get('/:botId/events', botController.streamBotEvents.bind(botController));
// Connection controls
router.post('/:botId/disconnect', botController.disconnectBotAction.bind(botController));
router.post('/:botId/reconnect', botController.reconnectBotAction.bind(botController));
// Tasks
router.post('/:botId/task', botController.startTask.bind(botController));
router.post('/:botId/task/stop', botController.stopTask.bind(botController));
router.post('/:botId/task/pause', botController.pauseTask.bind(botController));
router.post('/:botId/task/resume', botController.resumeTask.bind(botController));

module.exports = router;
