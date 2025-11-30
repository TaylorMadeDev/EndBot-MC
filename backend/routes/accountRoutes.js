const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, accountController.getAllAccounts.bind(accountController));
router.get('/:accountId', authMiddleware, accountController.getAccount.bind(accountController));
router.post('/', authMiddleware, accountController.createAccount.bind(accountController));

// Microsoft account auth flow
router.post('/microsoft/start', authMiddleware, accountController.startMicrosoft.bind(accountController));
router.post('/microsoft/finish', authMiddleware, accountController.finishMicrosoft.bind(accountController));

router.delete('/:accountId', authMiddleware, accountController.deleteAccount.bind(accountController));

module.exports = router;