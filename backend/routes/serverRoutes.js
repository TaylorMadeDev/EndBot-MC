const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const authMiddleware = require('../middleware/auth');

// All server routes require authentication
router.use(authMiddleware);

// List all monitored servers for current user
router.get('/', serverController.listServers.bind(serverController));

// Add a server to monitoring
router.post('/', serverController.addServer.bind(serverController));

// Get specific server
router.get('/:id', serverController.getServer.bind(serverController));

// Update monitored server
router.put('/:id', serverController.updateServer.bind(serverController));

// Delete monitored server
router.delete('/:id', serverController.deleteServer.bind(serverController));

module.exports = router;
