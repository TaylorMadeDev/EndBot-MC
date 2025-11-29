const dataStore = require('../models/dataStore');
const botManager = require('../bot');

class BotController {

  // Get all bots (optionally filtered by user)
  getAllBots(req, res) {
    const userId = req.query.userId ? parseInt(req.query.userId) : null;
    
    let bots;
    if (userId) {
      bots = dataStore.getBotsByUser(userId);
    } else {
      bots = dataStore.getAllBots();
    }
    
    res.json({
      bots,
      count: bots.length
    });
  }

  // Get specific bot
  getBot(req, res) {
    const botId = req.params.botId;
    // Get persisted record
    const record = dataStore.getBot(botId);
    if (!record) {
      return res.status(404).json({ error: 'Bot not found' });
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

  // Create new bot
  createBot(req, res) {
    const { userId, username, serverHost, serverPort, version } = req.body;
    
    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }

    // Check if user exists
    const user = dataStore.getUser(parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create Mineflayer bot instance
    const { botId, botState } = botManager.createBot({
      username,
      host: serverHost || 'ryasandigzz.aternos.me',
      port: serverPort || 25565,
      version: version || '1.21.8',
      auth: 'offline'
    });

    // Store in dataStore
    const bot = dataStore.createBot(parseInt(userId), { id: botId, ...botState });

    res.status(201).json({
      success: true,
      botId,
      bot
    });
  }

  // Update bot
  updateBot(req, res) {
    const botId = req.params.botId;
    const updates = req.body;
    
    const bot = dataStore.updateBot(botId, updates);
    
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    res.json(bot);
  }

  // Delete bot
  deleteBot(req, res) {
    const botId = req.params.botId;
    
    // Disconnect bot instance via botManager
    botManager.disconnectBot(botId);
    
    const deleted = dataStore.deleteBot(botId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    res.json({ success: true, message: 'Bot deleted' });
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
  reconnectBotAction(req, res) {
    const botId = req.params.botId;
    const botRecord = dataStore.getBot(botId);
    if (!botRecord) return res.status(404).json({ error: 'Bot not found' });
    const state = botManager.getBotState(botId) || {};
    const username = botRecord.username || state.username;
    const host = botRecord.serverHost || botRecord.host || state.host || 'localhost';
    const version = botRecord.version || '1.21.8';
    const port = botRecord.serverPort || botRecord.port || 25565;

    const { botState } = botManager.reconnectBot(botId, { username, host, port, version, auth: 'offline' });
    dataStore.updateBot(botId, { status: 'online', username, serverHost: host, serverPort: port, version });
    res.json({ success: true, botId, bot: dataStore.getBot(botId), state: botState });
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
      return res.json({ success: true, started: taskName, premade: isPremade, state: botManager.getBotState(botId) });
    } catch (err) {
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
      return res.json({ success: true, stopped: true });
    } catch (err) {
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
      return res.json({ success: true, paused: true });
    } catch (err) {
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
      return res.json({ success: true, resumed: true });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Failed to resume task' });
    }
  }
}

module.exports = new BotController();
