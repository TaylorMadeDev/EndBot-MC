const dataStore = require('../models/dataStore');

class AccountController {
  // List accounts owned by the authenticated user
  getAllAccounts(req, res) {
    const authUserId = req.user?.id ? parseInt(req.user.id) : null;
    if (!authUserId) return res.status(401).json({ error: 'Unauthorized' });
    const user = dataStore.getUser(authUserId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const rows = dataStore.getAccountsByUser(authUserId);
    const accounts = rows.map(acc => ({
      id: acc.id,
      name: acc.name || null,
      username: acc.username,
      method: acc.method,
      status: acc.status,
      auth_cache_dir: acc.auth_cache_dir,
      profile_json: acc.profile_json
    }));
    res.json({ accounts, count: accounts.length });
  }

  // Get a specific account
  getAccount(req, res) {
    const accountId = req.params.accountId;
    const account = dataStore.getAccount(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  }

  // Create account (cracked)
  createAccount(req, res) {
    const authUserId = req.user?.id ? parseInt(req.user.id) : null;
    const { username, method } = req.body;
    if (!authUserId || !username) {
      return res.status(400).json({ error: 'username is required' });
    }
    const user = dataStore.getUser(authUserId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const authMethod = method || 'cracked';
    if (authMethod !== 'cracked') {
      return res.status(400).json({ error: 'Only cracked method supported via this endpoint' });
    }

    const account = dataStore.createAccount(authUserId, {
      username,
      method: authMethod,
      status: 'ready'
    });
    res.status(201).json({ success: true, account });
  }

  // Start Microsoft device-code auth flow (requires unique name)
  async startMicrosoft(req, res) {
    console.log('[startMicrosoft] Request received');
    try {
      const authUserId = req.user?.id ? parseInt(req.user.id) : null;
      const { name } = req.body;
      if (!authUserId) return res.status(401).json({ error: 'Unauthorized' });
      if (!name || typeof name !== 'string' || !/^[a-zA-Z0-9_-]{3,32}$/.test(name)) {
        return res.status(400).json({ error: 'A unique account name (3-32 chars, a-zA-Z0-9_-) is required' });
      }
      // Check for name collision for this user
      const existing = dataStore.getAccountByNameForUser(authUserId, name);
      if (existing) return res.status(409).json({ error: 'Account name already exists' });

      const path = require('path');
      const fs = require('fs');
      const { Authflow, Titles  } = require('prismarine-auth');
      const cacheDir = path.join(__dirname, '..', 'auth_cache', String(authUserId), name);
      fs.mkdirSync(cacheDir, { recursive: true });

      let devicePayload = null;
      const flow = new Authflow(name, cacheDir, { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' }, (code) => {
        devicePayload = code;
      });
      // Trigger device code
      flow.getMsaToken().catch(() => {});
      await new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const check = () => {
          if (devicePayload) return resolve();
          if (Date.now() - startedAt > 3000) return reject(new Error('Device code not received in time'));
          setTimeout(check, 50);
        };
        check();
      }).catch(() => {});
      if (devicePayload) {
        return res.json({ success: true, cacheDir, name, device: devicePayload });
      }
      res.status(500).json({ success: false, error: 'Failed to initiate Microsoft auth' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Complete Microsoft flow: fetch Minecraft Java token and create account (requires name, allowed_users)
  async finishMicrosoft(req, res) {
    try {
      const authUserId = req.user?.id ? parseInt(req.user.id) : null;
      const { name, allowed_users } = req.body;
      if (!authUserId) return res.status(401).json({ error: 'Unauthorized' });
      if (!name || typeof name !== 'string' || !/^[a-zA-Z0-9_-]{3,32}$/.test(name)) {
        return res.status(400).json({ error: 'A unique account name (3-32 chars, a-zA-Z0-9_-) is required' });
      }
      // Check for name collision for this user
      const existing = dataStore.getAccountByNameForUser(authUserId, name);
      if (existing) return res.status(409).json({ error: 'Account name already exists' });

      const path = require('path');
      const fs = require('fs');
      const { Authflow, Titles } = require('prismarine-auth');
      const cacheDir = path.join(__dirname, '..', 'auth_cache', String(authUserId), name);
      fs.mkdirSync(cacheDir, { recursive: true });

      const flow = new Authflow(name, cacheDir, { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' });
      const profile = await flow.getMinecraftJavaToken({ fetchProfile: true });
      const username = profile?.profile?.name;
      if (!username) {
        return res.status(400).json({ success: false, error: 'Failed to fetch Minecraft profile' });
      }
      const account = dataStore.createAccount(authUserId, {
        name,
        username,
        method: 'microsoft',
        status: 'ready',
        auth_cache_dir: cacheDir,
        profile_json: JSON.stringify(profile),
        allowed_users: []
      });
      res.json({ success: true, account });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
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