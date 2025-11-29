const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

router.get('/', accountController.getAllAccounts.bind(accountController));
router.get('/:accountId', accountController.getAccount.bind(accountController));
router.post('/', accountController.createAccount.bind(accountController));
router.delete('/:accountId', accountController.deleteAccount.bind(accountController));

module.exports = router;