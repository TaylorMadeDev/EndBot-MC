const dataStore = require('../models/dataStore');

class AccountController {
  // List accounts (optionally filtered by userId)
  getAllAccounts(req, res) {
    const userId = req.query.userId ? parseInt(req.query.userId) : null;
    let accounts;
    if (userId) {
      const user = dataStore.getUser(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      accounts = dataStore.getAccountsByUser(userId);
    } else {
      accounts = dataStore.getAllAccounts();
    }
    res.json({ accounts, count: accounts.length });
  }

  // Get a specific account
  getAccount(req, res) {
    const accountId = req.params.accountId;
    const account = dataStore.getAccount(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  }

  // Create account (cracked only for now)
  createAccount(req, res) {
    const { userId, username, method } = req.body;
    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }
    const user = dataStore.getUser(parseInt(userId));
    if (!user) return res.status(404).json({ error: 'User not found' });

    const authMethod = method || 'cracked';
    if (authMethod !== 'cracked') {
      return res.status(400).json({ error: 'Only cracked method supported currently' });
    }

    const accountId = 'acc-' + Date.now();
    const account = dataStore.createAccount(parseInt(userId), {
      id: accountId,
      username,
      method: authMethod,
      status: 'ready'
    });
    res.status(201).json({ success: true, account });
  }

  // Delete account
  deleteAccount(req, res) {
    const accountId = req.params.accountId;
    const deleted = dataStore.deleteAccount(accountId);
    if (!deleted) return res.status(404).json({ error: 'Account not found' });
    res.json({ success: true, message: 'Account deleted' });
  }
}

module.exports = new AccountController();