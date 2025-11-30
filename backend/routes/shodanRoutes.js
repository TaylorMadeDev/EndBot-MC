const express = require('express');
const router = express.Router();
const shodanController = require('../controllers/shodanController');
const authMiddleware = require('../middleware/auth');

// All Shodan routes require authentication
router.use(authMiddleware);

// Search Shodan for Minecraft servers
router.get('/search', shodanController.search.bind(shodanController));

// Get API info (credits, plan, etc)
router.get('/info', shodanController.info.bind(shodanController));

module.exports = router;
