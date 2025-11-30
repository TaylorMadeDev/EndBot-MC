const dataStore = require('../models/dataStore');
const botManager = require('../bot');

class BotController {

  // Get all bots for authenticated user
  getAllBots(req, res) {
    const authUserId = req.user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const bots = dataStore.getBotsByUser(Number(authUserId));
    // Overlay live state for status and minimal fields using botManager
    const enriched = bots.map(b => {
      const state = botManager.getBotState(b.id) || null;
      const connected = !!(state && state.connected);
      return {
        id: b.id,
        user_id: b.user_id,
        account_id: b.account_id,
        username: b.username || (state ? state.username : b.username),
        server_host: b.server_host ?? (state ? state.host : null),
        server_port: b.server_port ?? (state ? state.port : null),
        version: b.version ?? (state ? state.version : null),
        status: connected ? 'online' : (b.status || 'offline'),
        connected,
        currentTask: state ? (state.currentTask || null) : null,
        created_at: b.created_at,
        lastOnline: connected ? 'now' : (b.lastOnline || b.created_at)
      };
    });
    return res.json({ bots: enriched, count: enriched.length });
  }

  // Get specific bot
  getBot(req, res) {
    const botId = req.params.botId;
    // Get persisted record
    const record = dataStore.getBot(botId);
    if (!record) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    // Ownership check
    if (req.user?.id && Number(record.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get live state from botManager (if exists)
    const live = botManager.getBotState(botId) || {};

    // Build a unified, user-friendly response similar to /status
    const connected = !!live.connected;
    const position = live.position || record.position || { x: 0, y: 0, z: 0 };
    const healthVal = typeof live.health === 'number' ? live.health : (live.health?.value ?? null);
    const hearts = healthVal != null ? Math.ceil(Math.max(0, Math.min(20, healthVal)) / 2) : 0;
    const armor = live.health?.armor ?? 0;
    const food = live.food != null ? live.food : (live.health?.food ?? 0);
    const inventoryItems = Array.isArray(live.inventory) ? live.inventory : (live.inventory?.items || []);

    // Derive equipped armor map from inventory slots 5-8
    const equipped = {
      head: inventoryItems.find(i => i.slot === 5) || null,
      torso: inventoryItems.find(i => i.slot === 6) || null,
      legs: inventoryItems.find(i => i.slot === 7) || null,
      feet: inventoryItems.find(i => i.slot === 8) || null
    };

    const response = {
      id: botId,
      username: record.username || live.username,
      connected,
      status: connected ? 'online' : (record.status || 'offline'),
      health: {
        value: healthVal != null ? healthVal : 0,
        hearts,
        armor,
        food: food != null ? food : 0
      },
      position: {
        x: position.x ?? 0,
        y: position.y ?? 0,
        z: position.z ?? 0,
        dimension: live.dimension || record.dimension || 'unknown'
      },
      inventory: {
        items: inventoryItems,
        count: inventoryItems.length
      },
      equipped,
      currentTask: live.currentTask ?? null,
      players: live.players || [],
      entities: live.entities || [],
      chatMessages: live.chatMessages || [],
      time: live.time || record.time || { age: 0, time: 0 },
      weather: live.weather || record.weather || 'clear',
      lastUpdate: live.lastUpdate || record.lastUpdate || new Date().toISOString()
    };

    res.json(response);
  }

  // Create new bot owned by authenticated user
  async createBot(req, res) {
    const authUserId = req.user?.id;
    const { username, serverHost, serverPort, version, accountId, accountName } = req.body;
    if (!authUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!username && !accountId && !accountName) {
      return res.status(400).json({ error: 'username or accountName/accountId is required' });
    }
    // Check if user exists
    const user = dataStore.getUser(Number(authUserId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If accountId provided, lookup account details for username and auth method
    let finalUsername = username;
    let authMethod = 'offline';
    let authOptions = {};
    let resolvedAccountId = accountId || null;
    
    if (accountName) {
      const account = dataStore.getAccountByNameForUser(Number(authUserId), String(accountName));
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      // If Microsoft, optionally initiate device-code flow when cache missing
      if (account.method === 'microsoft') {
        try {
          const fs = require('fs');
          const exists = fs.existsSync(account.auth_cache_dir);
          const files = exists ? fs.readdirSync(account.auth_cache_dir) : [];
          const hasAnyCache = files.some(f => f.includes('_live-cache.json') || f.includes('_msal-cache.json'));
          const hasMatchingPrefix = files.some(f => account.name && f.startsWith(account.name + '_'));
          if (!hasAnyCache || !hasMatchingPrefix) {
            const { Titles, Authflow } = require('prismarine-auth');
            let devicePayload = null;
            try {
              const flow = new Authflow(account.name, account.auth_cache_dir, { authTitle: Titles.MinecraftNintendoSwitch, flow: 'live' }, (code) => {
                devicePayload = code;
                console.log(`[Microsoft Auth] Device code for ${account.name}: ${code.user_code} @ ${code.verification_uri || 'https://www.microsoft.com/link'}`);
              });
              flow.getMsaToken().catch(() => {});
              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (e) {
              console.warn('[Microsoft Auth] createBot device-code init failed', e.message);
            }
            if (devicePayload) {
              req.msDevice = devicePayload;
            }
          }
        } catch (_) {}
      }
      resolvedAccountId = account.id;
      finalUsername = account.username;
      authMethod = account.method;
      if (authMethod === 'microsoft' && account.auth_cache_dir) {
        const { Titles } = require('prismarine-auth');
        authOptions = {
          auth: 'microsoft',
          authTitle: Titles.MinecraftNintendoSwitch,
          profilesFolder: account.auth_cache_dir,
          flow: 'live',
          userIdentifier: account.name
        };
        console.log(`[createBot] Using Microsoft auth for account ${account.name} (${account.username}) via name`);
      }
    } else if (accountId) {
      const account = dataStore.getAccount(Number(accountId));
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      if (account.method === 'microsoft') {
        try {
          const fs = require('fs');
          const hasCache = fs.existsSync(account.auth_cache_dir) && fs.readdirSync(account.auth_cache_dir).some(f => f.includes('_live-cache.json') || f.includes('_msal-cache.json'));
          if (!hasCache) {
            return res.status(400).json({ error: 'Microsoft tokens not found for this account. Please complete Microsoft login for this account.' });
          }
        } catch (_) {}
      }
      // Permission: owner or listed in allowed_users (legacy path still enforced)
      const allowed = (() => { try { return JSON.parse(account.allowed_users || '[]'); } catch { return []; } })();
      if (account.user_id !== Number(authUserId) && !allowed.includes(Number(authUserId))) {
        return res.status(403).json({ error: 'You do not have access to this account' });
      }
      finalUsername = account.username;
      authMethod = account.method;
      if (authMethod === 'microsoft' && account.auth_cache_dir) {
        const { Titles } = require('prismarine-auth');
        authOptions = {
          auth: 'microsoft',
          authTitle: Titles.MinecraftNintendoSwitch,
          profilesFolder: account.auth_cache_dir,
          flow: 'live',
          userIdentifier: account.name
        };
        console.log(`[createBot] Using Microsoft auth for account ${account.id} (${account.username})`);
      }
    }

    // Normalize connection params
    const hostToUse = serverHost || 'ryasandigzz.aternos.me';
    const portToUse = serverPort || 25565;
    const versionToUse = version || '1.21.8';

    // Create Mineflayer bot instance
    const { botId, botState } = botManager.createBot({
      username: finalUsername,
      host: hostToUse,
      port: portToUse,
      version: versionToUse,
      auth: authMethod === 'microsoft' ? 'microsoft' : 'offline',
      ...authOptions
    });

    // Store in dataStore
    const bot = dataStore.createBot(Number(authUserId), { 
      id: botId,
      accountId: resolvedAccountId || null,
      username: finalUsername,
      serverHost: hostToUse,
      serverPort: portToUse,
      version: versionToUse,
      status: botState.connected ? 'online' : 'offline'
    });

    const response = { success: true, botId, bot };
    if (req.msDevice && authMethod === 'microsoft') {
      response.requiresMicrosoftLogin = true;
      response.accountName = accountName || dataStore.getAccount(resolvedAccountId)?.name || '';
      response.device = req.msDevice;
    }
    res.status(201).json(response);
  }

  // Update bot
  updateBot(req, res) {
    const botId = req.params.botId;
    const record = dataStore.getBot(botId);
    if (!record) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    // Ownership check
    if (req.user?.id && Number(record.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const updates = req.body;
    const allowedFields = ['username', 'serverHost', 'serverPort', 'version'];
    const filtered = {};
    if (updates.username) filtered.username = updates.username;
    if (updates.serverHost) filtered.server_host = updates.serverHost;
    if (updates.serverPort) filtered.server_port = updates.serverPort;
    if (updates.version) filtered.version = updates.version;
    
    const bot = dataStore.updateBot(botId, filtered);
    console.log(`✏️  [API] Updated bot ${botId}:`, filtered);
    res.json(bot);
  }

  // Delete bot
  deleteBot(req, res) {
    const botId = req.params.botId;
    const record = dataStore.getBot(botId);
    if (!record) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    // Ownership check
    if (req.user?.id && Number(record.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Disconnect bot instance via botManager
    botManager.disconnectBot(botId);
    
    const deleted = dataStore.deleteBot(botId);
    console.log(`🗑️  [API] Deleted bot ${botId}`);
    res.json({ success: true, message: 'Bot deleted' });
  }

  // Force kill bot (for stuck/glitched bots)
  forceKillBot(req, res) {
    const botId = req.params.botId;
    const record = dataStore.getBot(botId);
    if (!record) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    // Ownership check
    if (req.user?.id && Number(record.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const success = botManager.forceKill(botId);
    if (success) {
      // Update DB status
      dataStore.updateBot(botId, { status: 'offline' });
      console.log(`💀 [API] Force killed bot ${botId}`);
      return res.json({ success: true, message: 'Bot force killed' });
    }
    return res.status(400).json({ error: 'Failed to force kill bot' });
  }

  // Disconnect bot (but keep record in datastore)
  disconnectBotAction(req, res) {
    const botId = req.params.botId;
    const bot = dataStore.getBot(botId);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });
    const ok = botManager.disconnectBot(botId);
    if (!ok) return res.status(400).json({ error: 'Bot not connected' });
    // Mark status offline in datastore
    dataStore.updateBot(botId, { status: 'offline' });
    res.json({ success: true, message: 'Bot disconnected' });
  }

  // Reconnect bot using last known config
  async reconnectBotAction(req, res) {
    const botId = req.params.botId;
    const botRecord = dataStore.getBot(botId);
    if (!botRecord) return res.status(404).json({ error: 'Bot not found' });
    // Ownership check
    if (req.user?.id && Number(botRecord.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const state = botManager.getBotState(botId) || {};
    const username = botRecord.username || state.username;
    // Prefer server_host/server_port from DB (snake_case columns)
    const host = botRecord.server_host || botRecord.serverHost || state.host || 'ryasandigzz.aternos.me';
    const version = botRecord.version || '1.21.8';
    const port = botRecord.server_port || botRecord.serverPort || state.port || 25565;

    // Check if bot has associated account with Microsoft auth
    let authMethod = 'offline';
    let authOptions = {};
      if (botRecord.account_id) {
      const account = dataStore.getAccount(botRecord.account_id);
      if (account && account.method === 'microsoft' && account.auth_cache_dir) {
        const { Titles } = require('prismarine-auth');
        try {
          const fs = require('fs');
          const exists = fs.existsSync(account.auth_cache_dir);
          const files = exists ? fs.readdirSync(account.auth_cache_dir) : [];
          const hasAnyCache = files.some(f => f.includes('_live-cache.json') || f.includes('_msal-cache.json'));
          const hasMatchingPrefix = files.some(f => account.name && f.startsWith(account.name + '_'));
          if (!hasAnyCache || !hasMatchingPrefix) {
            // Initiate device-code flow and log payload, then continue to start bot
            try {
              const { Authflow } = require('prismarine-auth');
              let devicePayload = null;
              const flow = new Authflow(account.name, account.auth_cache_dir, { authTitle: Titles.MinecraftNintendoSwitch, flow: 'live' }, (code) => {
                devicePayload = code;
                console.log(`[Microsoft Auth] Device code for ${account.name}: ${code.user_code} @ ${code.verification_uri || 'https://www.microsoft.com/link'}`);
              });
              flow.getMsaToken().catch(() => {});
              await new Promise((resolve) => setTimeout(resolve, 500));
              if (devicePayload) {
                // Also hint to client if they want to show a modal, but do not stop start
                req.msDevice = devicePayload;
              }
            } catch (e) {
              console.warn('[Microsoft Auth] Failed to initiate device-code flow', e.message);
            }
          }
        } catch (_) {}
        authMethod = 'microsoft';
        authOptions = {
          authTitle: Titles.MinecraftNintendoSwitch,
          profilesFolder: account.auth_cache_dir,
          flow: 'live',
          userIdentifier: account.name
        };
        console.log(`[reconnectBot] Using Microsoft auth for account ${account.id} (${account.username})`);
      }
    }

    console.log(`🔄 [API] Reconnecting bot ${botId} as ${username} @ ${host}:${port} v${version} (auth: ${authMethod})`);
    const { botState } = botManager.reconnectBot(botId, { 
      username, 
      host, 
      port, 
      version, 
      auth: authMethod,
      ...authOptions
    });
    dataStore.updateBot(botId, { status: 'online', username, serverHost: host, serverPort: port, version });
    res.json({ success: true, botId, bot: dataStore.getBot(botId), state: botState });
  }

  // Start bot (explicit alias with logging)
  async startBotAction(req, res) {
    const botId = req.params.botId;
    const botRecord = dataStore.getBot(botId);
    if (!botRecord) return res.status(404).json({ error: 'Bot not found' });
    if (req.user?.id && Number(botRecord.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const state = botManager.getBotState(botId) || {};
    const username = botRecord.username || state.username;
    // Prefer server_host/server_port from DB (snake_case columns)
    const host = botRecord.server_host || botRecord.serverHost || state.host || 'ryasandigzz.aternos.me';
    const version = botRecord.version || '1.21.8';
    const port = botRecord.server_port || botRecord.serverPort || state.port || 25565;
    
    // Check if bot has associated account with Microsoft auth
    let authMethod = 'offline';
    let authOptions = {};
    if (botRecord.account_id) {
      const account = dataStore.getAccount(botRecord.account_id);
      if (account && account.method === 'microsoft' && account.auth_cache_dir) {
        const { Titles } = require('prismarine-auth');
        try {
          const fs = require('fs');
          const exists = fs.existsSync(account.auth_cache_dir);
          const files = exists ? fs.readdirSync(account.auth_cache_dir) : [];
          const hasAnyCache = files.some(f => f.includes('_live-cache.json') || f.includes('_msal-cache.json'));
          const hasMatchingPrefix = files.some(f => account.name && f.startsWith(account.name + '_'));
          if (!hasAnyCache || !hasMatchingPrefix) {
            try {
              const { Authflow } = require('prismarine-auth');
              let devicePayload = null;
              const flow = new Authflow(account.name, account.auth_cache_dir, { authTitle: Titles.MinecraftNintendoSwitch, flow: 'live' }, (code) => {
                devicePayload = code;
                console.log(`[Microsoft Auth] Device code for ${account.name}: ${code.user_code} @ ${code.verification_uri || 'https://www.microsoft.com/link'}`);
              });
              flow.getMsaToken().catch(() => {});
              await new Promise((resolve) => setTimeout(resolve, 500));
              if (devicePayload) {
                req.msDevice = devicePayload;
              }
            } catch (e) {
              console.warn('[Microsoft Auth] Failed to initiate device-code flow', e.message);
            }
            // Mark that frontend should show modal even if device not captured yet
            req.requiresMicrosoftLogin = true;
          }
        } catch (_) {}
        authMethod = 'microsoft';
        authOptions = {
          authTitle: Titles.MinecraftNintendoSwitch,
          profilesFolder: account.auth_cache_dir,
          flow: 'live',
          userIdentifier: account.name
        };
        console.log(`[startBot] Using Microsoft auth for account ${account.id} (${account.username})`);
      }
    }
    
    console.log(`▶️  [API] Starting bot ${botId} as ${username} @ ${host}:${port} v${version} (auth: ${authMethod})`);
    const { botState } = botManager.reconnectBot(botId, { 
      username, 
      host, 
      port, 
      version, 
      auth: authMethod,
      ...authOptions
    });
    dataStore.updateBot(botId, { status: 'online', username, serverHost: host, serverPort: port, version });
    // Wait briefly to capture any msAuth prompt from console interceptor
    if (authMethod === 'microsoft') {
      try { await new Promise(r => setTimeout(r, 600)); } catch(_) {}
    }
    const latestState = botManager.getBotState(botId) || botState;
    // If device code was generated, include it for the client UI
    const response = { success: true, botId, bot: dataStore.getBot(botId), state: latestState };
    const msDevice = req.msDevice || latestState.msDevice || null;
    if ((req.requiresMicrosoftLogin || msDevice) && authMethod === 'microsoft') {
      response.requiresMicrosoftLogin = true;
      response.accountName = dataStore.getAccount(botRecord.account_id)?.name || '';
      response.device = msDevice || null;
    }
    return res.json(response);
  }

  // Get bot health
  getBotHealth(req, res) {
    const botId = req.params.botId;
    const botState = botManager.getBotState(botId);
    
    if (!botState) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    res.json({
      health: botState.health,
      food: botState.food,
      connected: botState.connected,
      hearts: Math.ceil(botState.health / 2),
      armor: 0
    });
  }

  // Get bot position
  getBotPosition(req, res) {
    const botId = req.params.botId;
    const botState = botManager.getBotState(botId);
    
    if (!botState) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    res.json({
      x: Math.floor(botState.position.x),
      y: Math.floor(botState.position.y),
      z: Math.floor(botState.position.z),
      dimension: botState.dimension
    });
  }

  // Get bot inventory
  getBotInventory(req, res) {
    const botId = req.params.botId;
    const botState = botManager.getBotState(botId);
    
    if (!botState) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    res.json({
      items: botState.inventory,
      count: botState.inventory.length
    });
  }

  // Get unified bot status (health, position, inventory, players, entities, etc.)
  getBotStatus(req, res) {
    const botId = req.params.botId;
    const botState = botManager.getBotState(botId);
    const record = dataStore.getBot(botId);
    // Ownership check against persisted record
    if (req.user?.id && record && Number(record.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // If live state exists but no record (e.g., legacy or transient bot), still return the live status
    if (botState && !record) {
      const equipped = {
        head: botState.inventory.find(i => i.slot === 5) || null,
        torso: botState.inventory.find(i => i.slot === 6) || null,
        legs: botState.inventory.find(i => i.slot === 7) || null,
        feet: botState.inventory.find(i => i.slot === 8) || null
      };
      return res.json({
        id: botState.id,
        username: botState.username,
        connected: botState.connected,
        status: botState.connected ? 'online' : 'offline',
        serverHost: botState.host || null,
        serverPort: botState.port || null,
        version: botState.version || null,
        health: {
          value: botState.health,
          hearts: Math.ceil(botState.health / 2),
          armor: 0,
          food: botState.food
        },
        position: {
          x: Math.floor(botState.position.x),
          y: Math.floor(botState.position.y),
          z: Math.floor(botState.position.z),
          dimension: botState.dimension || 'overworld'
        },
        inventory: { items: botState.inventory, count: botState.inventory.length },
        equipped,
        currentTask: botState.currentTask || null,
        players: botState.players,
        entities: botState.entities,
        chatMessages: botState.chatMessages || [],
        time: botState.time,
        weather: botState.weather,
        lastUpdate: botState.lastUpdate
      });
    }
    // If no live state but record exists, return an offline status payload instead of 404
    if (!botState && record) {
      return res.json({
        id: record.id,
        username: record.username,
        connected: false,
        status: record.status || 'offline',
        serverHost: record.server_host || record.serverHost || null,
        serverPort: record.server_port || record.serverPort || null,
        version: record.version || null,
        health: { value: 0, hearts: 0, armor: 0, food: 0 },
        position: { x: 0, y: 0, z: 0, dimension: record.dimension || 'unknown' },
        inventory: { items: [], count: 0 },
        equipped: { head: null, torso: null, legs: null, feet: null },
        currentTask: null,
        players: [],
        entities: [],
        chatMessages: [],
        time: { age: 0, time: 0 },
        weather: 'clear',
        lastUpdate: record.created_at
      });
    }
    if (!botState) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const equipped = {
      head: botState.inventory.find(i => i.slot === 5) || null,
      torso: botState.inventory.find(i => i.slot === 6) || null,
      legs: botState.inventory.find(i => i.slot === 7) || null,
      feet: botState.inventory.find(i => i.slot === 8) || null
    };
    
    // Compose a single payload so frontend can fetch once
    res.json({
      id: botState.id,
      username: botState.username,
      connected: botState.connected,
      status: botState.connected ? 'online' : 'offline',
      serverHost: botState.host || null,
      serverPort: botState.port || null,
      version: botState.version || null,
      msDevice: botState.msDevice || null,
      health: {
        value: botState.health,            // raw health from Mineflayer
        hearts: Math.ceil(botState.health / 2),
        armor: 0,
        food: botState.food
      },
      position: {
        x: Math.floor(botState.position.x),
        y: Math.floor(botState.position.y),
        z: Math.floor(botState.position.z),
        dimension: botState.dimension || 'overworld'
      },
      inventory: {
        items: botState.inventory,
        count: botState.inventory.length
      },
      equipped,
      currentTask: botState.currentTask || null,
      players: botState.players,
      entities: botState.entities,
      chatMessages: botState.chatMessages || [],
      time: botState.time,
      weather: botState.weather,
      lastUpdate: botState.lastUpdate
    });
  }

  // Send chat message
  sendChat(req, res) {
    const botId = req.params.botId;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const success = botManager.chatAs(botId, message);
    if (!success) {
      return res.status(400).json({ error: 'Bot not connected' });
    }
    
    res.json({ success: true, message: `Sent: ${message}` });
  }

  // Equip an inventory item (armor-only)
  async equipItem(req, res) {
    const botId = req.params.botId;
    const { slot, name } = req.body || {};
    if (slot == null && !name) {
      return res.status(400).json({ error: 'slot or name is required' });
    }

    const botState = botManager.getBotState(botId);
    if (!botState || !botState.connected) {
      return res.status(400).json({ error: 'Bot not connected' });
    }

    try {
      const result = name
        ? await botManager.equipArmorByName(botId, String(name))
        : await botManager.equipArmor(botId, Number(slot));
      return res.json({ success: true, ...result, state: botManager.getBotState(botId) });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Failed to equip' });
    }
  }

  // Unequip an armor piece by destination or slot
  async unequipItem(req, res) {
    const botId = req.params.botId;
    const { slot, dest } = req.body || {};
    if (slot == null && !dest) {
      return res.status(400).json({ error: 'slot or dest is required' });
    }
    const botState = botManager.getBotState(botId);
    if (!botState || !botState.connected) {
      return res.status(400).json({ error: 'Bot not connected' });
    }
    try {
      const identifier = dest ? String(dest) : Number(slot);
      const result = await botManager.unequipArmorPiece(botId, identifier);
      return res.json({ success: true, ...result, state: botManager.getBotState(botId) });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Failed to unequip' });
    }
  }

  // Consume food item
  async consumeFood(req, res) {
    const botId = req.params.botId;
    const { slot, name } = req.body || {};
    if (slot == null && !name) {
      return res.status(400).json({ error: 'slot or name is required' });
    }
    const botState = botManager.getBotState(botId);
    if (!botState || !botState.connected) {
      return res.status(400).json({ error: 'Bot not connected' });
    }
    try {
      const identifier = name ? String(name) : Number(slot);
      const result = await botManager.consumeFood(botId, identifier);
      return res.json({ success: true, ...result, state: botManager.getBotState(botId) });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Failed to consume food' });
    }
  }

  // Get bot players
  getBotPlayers(req, res) {
    const botId = req.params.botId;
    const botState = botManager.getBotState(botId);
    
    if (!botState) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    res.json({
      players: botState.players,
      count: botState.players.length
    });
  }

  // Get bot entities
  getBotEntities(req, res) {
    const botId = req.params.botId;
    const botState = botManager.getBotState(botId);
    
    if (!botState) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    res.json({
      entities: botState.entities,
      count: botState.entities.length
    });
  }

  // Server-Sent Events: live bot status updates (damage, task, etc.)
  streamBotEvents(req, res) {
    const botId = req.params.botId;
    const botState = botManager.getBotState(botId);
    if (!botState) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    // Send initial snapshot
    res.write(`data: ${JSON.stringify({ type: 'snapshot', state: botState })}\n\n`);

    const listener = (payload) => {
      if (!payload || payload.botId !== botId) return;
      const evt = { type: 'state', state: payload.state };
      if (payload.event) {
        evt.event = payload.event;
      }
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
    };

    botManager.onState(listener);

    req.on('close', () => {
      botManager.offState(listener);
      try { res.end(); } catch (_) {}
    });
  }

  // Start a task for a bot
  startTask(req, res) {
    const botId = req.params.botId;
    const { name, type, payload } = req.body || {};
    const taskName = name || type; // allow either field

    if (!taskName) {
      return res.status(400).json({ error: 'Task name is required' });
    }

    const botState = botManager.getBotState(botId);
    if (!botState || !botState.connected) {
      return res.status(400).json({ error: 'Bot not connected' });
    }

    try {
      // Premade tasks are hardcoded; recognize 'AFK'
      const isPremade = ['AFK'].includes(taskName);
      const result = botManager.startTask(botId, taskName, { ...payload, premade: isPremade });
      // Log activity + increment metrics
      if (req.user?.id) {
        try {
          dataStore.addActivity(req.user.id, { botId, type: 'task', message: `Started task ${taskName}`, success: 1 });
          dataStore.incrementAction(req.user.id, { success: true });
        } catch (_) {}
      }
      return res.json({ success: true, started: taskName, premade: isPremade, state: botManager.getBotState(botId) });
    } catch (err) {
      if (req.user?.id) {
        try {
          dataStore.addActivity(req.user.id, { botId, type: 'task-error', message: `Failed to start task ${taskName}: ${err.message}`, success: 0 });
          dataStore.incrementAction(req.user.id, { success: false });
        } catch (_) {}
      }
      return res.status(400).json({ error: err.message || 'Failed to start task' });
    }
  }

  // Stop current task for a bot
  stopTask(req, res) {
    const botId = req.params.botId;
    const botState = botManager.getBotState(botId);
    if (!botState) return res.status(404).json({ error: 'Bot not found' });
    try {
      botManager.stopTask(botId);
      if (req.user?.id) {
        try {
          dataStore.addActivity(req.user.id, { botId, type: 'task', message: 'Stopped task', success: 1 });
        } catch (_) {}
      }
      return res.json({ success: true, stopped: true });
    } catch (err) {
      if (req.user?.id) {
        try {
          dataStore.addActivity(req.user.id, { botId, type: 'task-error', message: `Failed to stop task: ${err.message}`, success: 0 });
        } catch (_) {}
      }
      return res.status(400).json({ error: err.message || 'Failed to stop task' });
    }
  }

  // Pause current task for a bot
  pauseTask(req, res) {
    const botId = req.params.botId;
    const botState = botManager.getBotState(botId);
    if (!botState) return res.status(404).json({ error: 'Bot not found' });
    if (!botState.currentTask) return res.status(400).json({ error: 'No active task to pause' });
    try {
      botManager.pauseTask(botId);
      if (req.user?.id) {
        try {
          dataStore.addActivity(req.user.id, { botId, type: 'task', message: 'Paused task', success: 1 });
        } catch (_) {}
      }
      return res.json({ success: true, paused: true });
    } catch (err) {
      if (req.user?.id) {
        try {
          dataStore.addActivity(req.user.id, { botId, type: 'task-error', message: `Failed to pause task: ${err.message}`, success: 0 });
        } catch (_) {}
      }
      return res.status(400).json({ error: err.message || 'Failed to pause task' });
    }
  }

  // Resume paused task for a bot
  resumeTask(req, res) {
    const botId = req.params.botId;
    const botState = botManager.getBotState(botId);
    if (!botState) return res.status(404).json({ error: 'Bot not found' });
    if (!botState.currentTask) return res.status(400).json({ error: 'No task to resume' });
    if (!botState.currentTask.paused) return res.status(400).json({ error: 'Task is not paused' });
    try {
      botManager.resumeTask(botId);
      if (req.user?.id) {
        try {
          dataStore.addActivity(req.user.id, { botId, type: 'task', message: 'Resumed task', success: 1 });
        } catch (_) {}
      }
      return res.json({ success: true, resumed: true });
    } catch (err) {
      if (req.user?.id) {
        try {
          dataStore.addActivity(req.user.id, { botId, type: 'task-error', message: `Failed to resume task: ${err.message}`, success: 0 });
        } catch (_) {}
      }
      return res.status(400).json({ error: err.message || 'Failed to resume task' });
    }
  }
}

module.exports = new BotController();
