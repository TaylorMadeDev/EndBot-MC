// Multi-bot manager for Mineflayer bots
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const EventEmitter = require('events');

class BotManager {
  constructor() {
    this.bots = new Map(); // botId -> bot instance
    this.botStates = new Map(); // botId -> state object
    this.eventBus = new EventEmitter(); // emits 'state' updates
    this.taskIntervals = new Map(); // botId -> interval id
  }

  createBot(config) {
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const botConfig = {
      host: config.host || 'ryasandigzz.aternos.me',
      port: config.port || 25565,
      username: config.username || `Bot_${botId.substr(-4)}`,
      version: config.version || '1.21.8',
      auth: config.auth || 'offline'
    };

    // Add Microsoft-specific auth options if provided
    if (config.auth === 'microsoft' && config.authTitle && config.profilesFolder) {
      botConfig.authTitle = config.authTitle;
      botConfig.profilesFolder = config.profilesFolder;
      botConfig.flow = config.flow || 'msal'; // Required by prismarine-auth >=3.x
      // userIdentifier must match the name used during account linking
      if (config.userIdentifier) {
        botConfig.userIdentifier = config.userIdentifier;
      }
      console.log(`[BotManager] Creating bot with Microsoft auth, cache dir: ${config.profilesFolder}, flow: ${botConfig.flow}, userIdentifier: ${config.userIdentifier || 'not set'}`);
    }

    const bot = mineflayer.createBot(botConfig);
    bot.loadPlugin(pathfinder);

    // Initialize bot state
    const botState = {
      id: botId,
      connected: false,
      username: config.username,
      host: config.host,
      health: 0,
      food: 0,
      position: { x: 0, y: 0, z: 0 },
      dimension: 'unknown',
      gameMode: 'survival',
      experience: { level: 0, points: 0, progress: 0 },
      inventory: [],
      entities: [],
      players: [],
      chatMessages: [],
      time: { age: 0, time: 0 },
      weather: 'clear',
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };

    this.bots.set(botId, bot);
    this.botStates.set(botId, botState);

    // Setup bot events
    this.setupBotEvents(botId, bot, botState);

    return { botId, bot, botState };
  }

  // Reconnect existing botId using provided config, preserving id
  reconnectBot(botId, config) {
    // Ensure any existing instance is ended
    const existing = this.bots.get(botId);
    if (existing) {
      try { existing.quit(); } catch (_) {}
      this.bots.delete(botId);
    }

    const botConfig = {
      host: config.host || 'localhost',
      port: config.port || 25565,
      username: config.username || `Bot_${botId.substr(-4)}`,
      version: config.version || '1.21.8',
      auth: config.auth || 'offline'
    };

    // Add Microsoft-specific auth options if provided
    if (config.auth === 'microsoft' && config.authTitle && config.profilesFolder) {
      botConfig.authTitle = config.authTitle;
      botConfig.profilesFolder = config.profilesFolder;
      botConfig.flow = config.flow || 'msal'; // Required by prismarine-auth >=3.x
      // userIdentifier must match the name used during account linking
      if (config.userIdentifier) {
        botConfig.userIdentifier = config.userIdentifier;
      }
      
      // Check if cache directory exists and has token files
      try {
        const fs = require('fs');
        const exists = fs.existsSync(config.profilesFolder);
        console.log(`[BotManager] Reconnecting bot with Microsoft auth`);
        console.log(`[BotManager] - Cache dir: ${config.profilesFolder}`);
        console.log(`[BotManager] - Flow: ${botConfig.flow}`);
        console.log(`[BotManager] - UserIdentifier: ${config.userIdentifier || 'not set'}`);
        console.log(`[BotManager] - Cache directory exists: ${exists}`);
        
        if (exists) {
          const files = fs.readdirSync(config.profilesFolder);
          console.log(`[BotManager] - Cache directory contents:`, files);
          const hasCacheFiles = files.some(f => f.includes('_live-cache.json') || f.includes('_msal-cache.json'));
          console.log(`[BotManager] - Has valid cache files: ${hasCacheFiles}`);
          
          if (config.userIdentifier) {
            const hasMatchingCache = files.some(f => f.startsWith(config.userIdentifier + '_'));
            console.log(`[BotManager] - Has matching cache for userIdentifier "${config.userIdentifier}": ${hasMatchingCache}`);
          }
        }
      } catch (err) {
        console.error(`[BotManager] Error checking cache:`, err.message);
      }
    }

    console.log(`[BotManager] About to call mineflayer.createBot with config:`, JSON.stringify({ 
      host: botConfig.host, 
      port: botConfig.port, 
      username: botConfig.username, 
      version: botConfig.version, 
      auth: botConfig.auth, 
      flow: botConfig.flow, 
      authTitle: botConfig.authTitle, 
      profilesFolder: botConfig.profilesFolder,
      userIdentifier: botConfig.userIdentifier
    }));
    const bot = mineflayer.createBot(botConfig);
    console.log(`[BotManager] mineflayer.createBot returned successfully for ${botId}`);
    console.log(`[BotManager] Reconnecting bot ${botId} to ${botConfig.host}:${botConfig.port} as ${botConfig.username}`);
    bot.loadPlugin(pathfinder);
    console.log(`[BotManager] Loaded pathfinder plugin for bot ${botId}`);

    // Capture Microsoft device-code prompts printed by prismarine-auth in console
    try {
      this._captureMsAuthConsole(botId);
    } catch (_) {}

    // Initialize/merge state preserving id
    const botState = this.botStates.get(botId) || {
      id: botId,
      connected: false,
      username: config.username,
      host: config.host,
      health: 0,
      food: 0,
      position: { x: 0, y: 0, z: 0 },
      dimension: 'unknown',
      gameMode: 'survival',
      experience: { level: 0, points: 0, progress: 0 },
      inventory: [],
      entities: [],
      players: [],
      chatMessages: [],
      time: { age: 0, time: 0 },
      weather: 'clear',
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };
    botState.username = bot.username;
    botState.host = config.host || botState.host;

    this.bots.set(botId, bot);
    console.log(`[BotManager] Set bot instance in map for ${botId}`);
    this.botStates.set(botId, botState);
    console.log(`[BotManager] Set bot state in map for ${botId}`);
    
    console.log(`[BotManager] About to setup events for bot ${botId}`);
    this.setupBotEvents(botId, bot, botState);
    console.log(`[BotManager] Setup events completed for bot ${botId}`);
    return { botId, bot, botState };
  }

  setupBotEvents(botId, bot, botState) {
    console.log(`[BotManager.setupBotEvents] Starting event setup for ${botId}`);
    
    bot.on('login', () => {
      console.log(`✅ [${botId}] Bot logged in as ${bot.username}`);
      botState.connected = true;
      botState.username = bot.username;
      botState.lastUpdate = new Date().toISOString();
    });
    console.log(`[BotManager.setupBotEvents] Registered 'login' handler for ${botId}`);

    bot.on('spawn', () => {
      console.log(`🌍 [${botId}] Bot spawned in the world!`);
      this.updateBotState(botId);
      // Prepare default movement settings for pathfinder
      try {
        bot.defaultMove = new Movements(bot);
      } catch (_) {}
      
      // Update state every 2 seconds
      const interval = setInterval(() => {
        if (bot._client && bot._client.socket) {
          this.updateBotState(botId);
        } else {
          clearInterval(interval);
        }
      }, 2000);
    });

    // Debounced damage detection with per-type emit guard
    botState._emitGuard = botState._emitGuard || new Map();
    const emitGuarded = (type, payload) => {
      const now = Date.now();
      const last = botState._emitGuard.get(type) || 0;
      if (now - last < 350) return; // guard window
      botState._emitGuard.set(type, now);
      this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type, ...payload, at: new Date().toISOString() } });
    };

    // Debounced damage detection
    botState._lastHealth = botState.health;
    botState._lastDamageAt = 0;
    bot.on('health', () => {
      const now = Date.now();
      const prev = this.botStates.get(botId);
      const oldHealth = prev ? prev.health : botState._lastHealth;
      this.updateBotState(botId);
      const newHealth = this.botStates.get(botId).health;
      botState._lastHealth = newHealth;
      // Only emit if strictly lower and outside debounce window (400ms)
      if (oldHealth != null && newHealth < oldHealth && (now - botState._lastDamageAt) > 400) {
        botState._lastDamageAt = now;
        const dmg = +(oldHealth - newHealth).toFixed(2);
        emitGuarded('damage', { amount: dmg });
      }
    });

    bot.on('kicked', (reason) => {
      console.log(`❌ [${botId}] Bot was kicked:`, reason);
      botState.connected = false;
      botState.lastUpdate = new Date().toISOString();
      emitGuarded('kicked', { reason });
    });

    bot.on('error', (err) => {
      console.error(`⚠️ [${botId}] Bot error:`, err.message);
      console.error(`⚠️ [${botId}] Error stack:`, err.stack);
      botState.connected = false;
      botState.lastUpdate = new Date().toISOString();
      emitGuarded('error', { message: err.message });
    });
    console.log(`[BotManager.setupBotEvents] Registered 'error' handler for ${botId}`);

    bot.on('end', (reason) => {
      console.log(`🔚 [${botId}] Bot connection ended${reason ? `: ${reason}` : ''}`);
      botState.connected = false;
      botState.lastUpdate = new Date().toISOString();
      this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'end', reason: reason || null, at: new Date().toISOString() } });
    });
    console.log(`[BotManager.setupBotEvents] Registered 'end' handler for ${botId}`);

    // Nearby entity hurt: emit for non-self, throttled per entity to avoid spam
    bot.on('entityHurt', (entity) => {
      const now = Date.now();
      botState._eventThrottle = botState._eventThrottle || new Map();
      const key = entity.id;
      const lastEmit = botState._eventThrottle.get(key) || 0;

      if (now - lastEmit > 500) { // Throttle to avoid spam
        botState._eventThrottle.set(key, now);
        const name = entity.username || entity.name || 'entity';
        this.updateBotState(botId);
        emitGuarded('entity-hurt', { target: name });
      }
    });

    // Chat messages
    bot.on('message', (jsonMsg) => {
      const text = jsonMsg.toString().trim();
      if (!text) return;
      const chatMsg = { text, at: new Date().toISOString() };
      botState.chatMessages = botState.chatMessages || [];
      botState.chatMessages.unshift(chatMsg);
      if (botState.chatMessages.length > 50) botState.chatMessages.pop();
      this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'chat', message: text, at: chatMsg.at } });
    });
    console.log(`[BotManager.setupBotEvents] Registered 'message' handler for ${botId}`);
    console.log(`[BotManager.setupBotEvents] Completed all event registrations for ${botId}`);
  }

  // Intercept console output to detect Microsoft device-code prompts and emit an event
  _captureMsAuthConsole(botId) {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const manager = this;
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      console.log = originalLog;
      console.warn = originalWarn;
    };

    const handler = function(...args) {
      try {
        const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
        // Detect typical prismarine-auth device login messages
        const hasLink = /microsoft\.com\/link/i.test(msg) || /verification_uri/i.test(msg);
        const codeMatch = msg.match(/\b([A-Z0-9]{8})\b/);
        if (hasLink && codeMatch) {
          const code = codeMatch[1];
          const uriMatch = msg.match(/https?:\/\/[^\s]+/i);
          const verification_uri = uriMatch ? uriMatch[0] : 'https://www.microsoft.com/link';
          const payload = { user_code: code, verification_uri, prompt: msg };
          // Store on state and emit event for UI
          const state = manager.botStates.get(botId) || {};
          state.msDevice = payload;
          manager.botStates.set(botId, state);
          manager.eventBus.emit('state', { botId, state: { ...state }, event: { type: 'ms-auth', device: payload, at: new Date().toISOString() } });
        }
      } catch (_) {}
      return originalLog.apply(console, args);
    };
    const warnHandler = function(...args) {
      try {
        const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
        const hasLink = /microsoft\.com\/link/i.test(msg) || /verification_uri/i.test(msg);
        const codeMatch = msg.match(/\b([A-Z0-9]{8})\b/);
        if (hasLink && codeMatch) {
          const code = codeMatch[1];
          const uriMatch = msg.match(/https?:\/\/[^\s]+/i);
          const verification_uri = uriMatch ? uriMatch[0] : 'https://www.microsoft.com/link';
          const payload = { user_code: code, verification_uri, prompt: msg };
          const state = manager.botStates.get(botId) || {};
          state.msDevice = payload;
          manager.botStates.set(botId, state);
          manager.eventBus.emit('state', { botId, state: { ...state }, event: { type: 'ms-auth', device: payload, at: new Date().toISOString() } });
        }
      } catch (_) {}
      return originalWarn.apply(console, args);
    };

    console.log = handler;
    console.warn = warnHandler;
    // Auto-restore after 60s or on process next tick after login
    setTimeout(restore, 60000);
    // Also restore when any bot logs in
    this.eventBus.once('state', ({ event }) => {
      if (event && event.type === 'login') restore();
    });
  }

  updateBotState(botId) {
    const bot = this.bots.get(botId);
    const botState = this.botStates.get(botId);
    
    if (!bot || !bot.entity || !botState) return;

    botState.health = bot.health;
    botState.food = bot.food;
    botState.position = bot.entity.position;
    botState.gameMode = bot.game.gameMode;
    botState.experience = {
      level: bot.experience.level,
      points: bot.experience.points,
      progress: bot.experience.progress
    };
    
    // Get inventory items
    botState.inventory = bot.inventory.slots
      .filter(item => item !== null)
      .map(item => ({
        name: item.name,
        count: item.count,
        slot: item.slot,
        displayName: item.displayName
      }));

    // Derive equipped armor pieces from standard armor slot indices (5-8)
    const armorHead = bot.inventory.slots.find(i => i && i.slot === 5) || null;
    const armorTorso = bot.inventory.slots.find(i => i && i.slot === 6) || null;
    const armorLegs = bot.inventory.slots.find(i => i && i.slot === 7) || null;
    const armorFeet = bot.inventory.slots.find(i => i && i.slot === 8) || null;
    botState.equipped = {
      head: armorHead ? { name: armorHead.name, displayName: armorHead.displayName } : null,
      torso: armorTorso ? { name: armorTorso.name, displayName: armorTorso.displayName } : null,
      legs: armorLegs ? { name: armorLegs.name, displayName: armorLegs.displayName } : null,
      feet: armorFeet ? { name: armorFeet.name, displayName: armorFeet.displayName } : null
    };

    // Get nearby entities (within 32 blocks)
    botState.entities = Object.values(bot.entities)
      .filter(entity => entity !== bot.entity && entity.position.distanceTo(bot.entity.position) < 32)
      .map(entity => ({
        type: entity.type,
        name: entity.name || entity.username,
        position: entity.position,
        distance: entity.position.distanceTo(bot.entity.position).toFixed(2)
      }))
      .slice(0, 20);

    // Get online players
    botState.players = Object.keys(bot.players).map(playerName => ({
      username: playerName,
      ping: bot.players[playerName].ping
    }));

    // Time and weather
    botState.time = {
      age: bot.time.age,
      time: bot.time.timeOfDay
    };
    botState.weather = bot.isRaining ? 'rain' : bot.thunderState > 0 ? 'thunder' : 'clear';
    botState.lastUpdate = new Date().toISOString();

    // Emit state update event with explicit type for easier UI
    this.eventBus.emit('state', { botId, state: { ...botState }, event: { type: 'status', at: new Date().toISOString() } });
  }

  getBot(botId) {
    return this.bots.get(botId);
  }

  getBotState(botId) {
    return this.botStates.get(botId);
  }

  getAllBots() {
    return Array.from(this.botStates.values());
  }

  disconnectBot(botId) {
    const bot = this.bots.get(botId);
    if (bot) {
      bot.quit();
      this.bots.delete(botId);
      this.botStates.delete(botId);
      return true;
    }
    return false;
  }

  chatAs(botId, message) {
    const bot = this.bots.get(botId);
    if (bot && bot._client && bot._client.socket) {
      bot.chat(message);
      return true;
    }
    return false;
  }

  onState(listener) {
    this.eventBus.on('state', listener);
  }

  offState(listener) {
    this.eventBus.removeListener('state', listener);
  }

  // Equip armor piece by inventory slot; only allows armor types
equipArmor(botId, slot) {
    console.log("Starting equipArmor function for botId:", botId, "and slot:", slot);
    slot += 1; // adjust for 0-based index
    console.log("Adjusted slot number:", slot);

    const bot = this.bots.get(botId);
    const state = this.botStates.get(botId);
    if (!bot || !state) {
        console.error("Bot or state not found for botId:", botId);
        throw new Error('Bot not found');
    }
    if (!bot.inventory || !bot.inventory.slots) {
        console.error("Inventory not ready for botId:", botId);
        throw new Error('Inventory not ready');
    }

    const item = bot.inventory.slots.find(i => i && i.slot === slot);
    
    console.log(bot.inventory.slots);
    if (!item) {
        console.error("Item not found in slot:", slot);
        throw new Error('Item not found in slot');
    }

    const name = (item.name || item.displayName || '').toLowerCase();
    console.log("Found item:", name, "in slot:", slot);

    // Determine destination based on item name
    let dest = null;
    if (name.includes('helmet')) dest = 'head';
    else if (name.includes('chestplate')) dest = 'torso';
    else if (name.includes('leggings')) dest = 'legs';
    else if (name.includes('boots')) dest = 'feet';

    if (!dest) {
        console.error("Item is not armor:", name);
        throw new Error('Only armor can be equipped');
    }

    console.log("Equipping item:", name, "to destination:", dest);

    return new Promise((resolve, reject) => {
        bot.equip(item, dest).then(() => {
            console.log("Successfully equipped item:", name, "to destination:", dest);
            // Update internal state after equip
            this.updateBotState(botId);
            this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'equip', item: item.displayName || item.name, dest, at: new Date().toISOString() } });
            resolve({ success: true, dest });
        }).catch(err => {
            const message = err && err.message ? err.message : 'Failed to equip';
            console.error("Failed to equip item:", name, "to destination:", dest, "Error:", message);
            this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'equip-error', item: item.displayName || item.name, dest, message, at: new Date().toISOString() } });
            reject(new Error(message));
        });
    });
}

  startTask(botId, name, payload = {}) {
    const bot = this.bots.get(botId);
    const state = this.botStates.get(botId);
    if (!bot || !state) throw new Error('Bot not found');
    // Stop any existing task first
    this.stopTask(botId);

    const taskName = String(name).toUpperCase();
    // Mark task in state
    state.currentTask = { name: taskName, startedAt: new Date().toISOString(), premade: !!payload.premade };
    state.lastUpdate = new Date().toISOString();
    this.eventBus.emit('state', { botId, state: { ...state }, event: { type: 'task-start', name: taskName, at: new Date().toISOString() } });

    if (taskName === 'AFK') {
      // Hardcoded AFK behavior: every 5-10s, small movement and a short jump
      const runTick = () => {
        if (!bot._client || !bot._client.socket) return; // not connected
        const randMs = 5000 + Math.floor(Math.random() * 5000);

        // Slight movement: forward or strafe briefly
        const dirs = ['forward', 'back', 'left', 'right'];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        bot.setControlState(dir, true);
        setTimeout(() => bot.setControlState(dir, false), 500 + Math.floor(Math.random() * 500));

        // Jump
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 250);

        // Emit lightweight progress event for UI feedback
        this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'task-progress', name: 'AFK', at: new Date().toISOString() } });

        // Next tick scheduled
        const next = setTimeout(runTick, randMs);
        this.taskIntervals.set(botId, next);
      };
      // Start immediately
      const first = setTimeout(runTick, 1000);
      this.taskIntervals.set(botId, first);
      return true;
    }
    if (taskName === 'FOLLOW NEAREST PLAYER') {
      if (!bot.pathfinder) {
        console.warn(`[${botId}] Pathfinder plugin not loaded; cannot start follow task.`);
        return false;
      }
      if (!bot.defaultMove) {
        try { bot.defaultMove = new Movements(bot); } catch (_) {}
      }
      // Track last player found time for idle fallback
      let lastPlayerFound = Date.now();
      const runFollow = () => {
        if (!bot._client || !bot._client.socket) return; // disconnected
        // Find nearest other player entity
        let nearest = null;
        let nearestDist = Infinity;
        Object.values(bot.players).forEach(p => {
          const entity = p.entity;
          if (entity && entity !== bot.entity) {
            const dist = bot.entity.position.distanceTo(entity.position);
            if (dist < nearestDist) { nearestDist = dist; nearest = entity; }
          }
        });
        const now = Date.now();
        if (nearest) {
          lastPlayerFound = now;
          const pos = nearest.position;
          try {
            bot.pathfinder.setMovements(bot.defaultMove);
            // GoalNear(x,y,z, range)
            bot.pathfinder.setGoal(new goals.GoalNear(pos.x, pos.y, pos.z, 1));
          } catch (err) {
            console.warn(`[${botId}] Failed to set follow goal:`, err.message);
          }
          this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'task-progress', name: 'FOLLOW NEAREST PLAYER', target: nearest.username || nearest.name, targetPos: pos, distance: nearestDist.toFixed(2), at: new Date().toISOString() } });
        } else {
          // No player found; check if idle fallback needed (10s)
          if (now - lastPlayerFound > 10000) {
            // Idle behavior: stop pathfinder, emit idle event
            try { bot.pathfinder.stop(); } catch (_) {}
            this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'task-idle', name: 'FOLLOW NEAREST PLAYER', reason: 'No players for 10s', at: new Date().toISOString() } });
          } else {
            this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'task-progress', name: 'FOLLOW NEAREST PLAYER', info: 'No player found', at: new Date().toISOString() } });
          }
        }
        const next = setTimeout(runFollow, 2000);
        this.taskIntervals.set(botId, next);
      };
      const first = setTimeout(runFollow, 500);
      this.taskIntervals.set(botId, first);
      return true;
    }

    // For non-premade/custom tasks: placeholder; no-op for now
    return true;
  }

  // Equip armor by item name (search inventory)
  equipArmorByName(botId, itemName) {
    const bot = this.bots.get(botId);
    const state = this.botStates.get(botId);
    if (!bot || !state) throw new Error('Bot not found');
    if (!bot.inventory || !bot.inventory.slots) throw new Error('Inventory not ready');

    if (!itemName || typeof itemName !== 'string') throw new Error('itemName required');
    const target = itemName.toLowerCase();
    const item = bot.inventory.slots.find(i => i && ((i.name || '').toLowerCase() === target || (i.displayName || '').toLowerCase() === target));
    if (!item) throw new Error('Item not found');

    const name = (item.name || item.displayName || '').toLowerCase();
    let dest = null;
    if (name.includes('helmet')) dest = 'head';
    else if (name.includes('chestplate')) dest = 'torso';
    else if (name.includes('leggings')) dest = 'legs';
    else if (name.includes('boots')) dest = 'feet';
    if (!dest) throw new Error('Only armor can be equipped');

    return new Promise((resolve, reject) => {
      bot.equip(item, dest).then(() => {
        this.updateBotState(botId);
        this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'equip', item: item.displayName || item.name, dest, at: new Date().toISOString() } });
        resolve({ success: true, dest });
      }).catch(err => {
        const message = err && err.message ? err.message : 'Failed to equip';
        this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'equip-error', item: item.displayName || item.name, dest, message, at: new Date().toISOString() } });
        reject(new Error(message));
      });
    });
  }

  // Consume food item by slot or name
  async consumeFood(botId, identifier) {
    const bot = this.bots.get(botId);
    const state = this.botStates.get(botId);
    if (!bot || !state) throw new Error('Bot not found');
    if (!bot.inventory || !bot.inventory.slots) throw new Error('Inventory not ready');

    let item = null;
    
    // Find item by slot number or name
    if (typeof identifier === 'number') {
      item = bot.inventory.slots.find(i => i && i.slot === identifier);
    } else if (typeof identifier === 'string') {
      const target = identifier.toLowerCase();
      item = bot.inventory.slots.find(i => i && ((i.name || '').toLowerCase() === target || (i.displayName || '').toLowerCase() === target));
    }

    if (!item) throw new Error('Food item not found');

    const itemName = (item.name || item.displayName || '').toLowerCase();
    
    // List of consumable food items in Minecraft
    const foodItems = [
      'apple', 'baked_potato', 'beef', 'beetroot', 'beetroot_soup', 'bread', 'carrot',
      'chicken', 'chorus_fruit', 'cod', 'cooked_beef', 'cooked_chicken', 'cooked_cod',
      'cooked_mutton', 'cooked_porkchop', 'cooked_rabbit', 'cooked_salmon', 'cookie',
      'dried_kelp', 'enchanted_golden_apple', 'glow_berries', 'golden_apple', 'golden_carrot',
      'honey_bottle', 'melon_slice', 'mushroom_stew', 'mutton', 'poisonous_potato', 'porkchop',
      'potato', 'pumpkin_pie', 'rabbit', 'rabbit_stew', 'rotten_flesh', 'salmon',
      'spider_eye', 'steak', 'suspicious_stew', 'sweet_berries', 'tropical_fish'
    ];

    const isFood = foodItems.some(food => itemName.includes(food));
    if (!isFood) throw new Error('Item is not consumable food');

    console.log(`[BotManager] Bot ${botId} consuming ${item.displayName || item.name} from slot ${item.slot}`);

    return new Promise((resolve, reject) => {
      // Equip food to hand first
      bot.equip(item, 'hand').then(() => {
        // Activate (right-click) to consume
        bot.activateItem();
        
        // Wait for consumption to complete (typically 1.6 seconds for most food)
        setTimeout(() => {
          this.updateBotState(botId);
          this.eventBus.emit('state', { 
            botId, 
            state: { ...this.botStates.get(botId) }, 
            event: { type: 'consume', item: item.displayName || item.name, at: new Date().toISOString() } 
          });
          resolve({ success: true, consumed: item.displayName || item.name });
        }, 2000);
      }).catch(err => {
        const message = err && err.message ? err.message : 'Failed to consume food';
        this.eventBus.emit('state', { 
          botId, 
          state: { ...this.botStates.get(botId) }, 
          event: { type: 'consume-error', item: item.displayName || item.name, message, at: new Date().toISOString() } 
        });
        reject(new Error(message));
      });
    });
  }

  // Unequip armor piece by destination or slot
  unequipArmorPiece(botId, identifier) {
    const bot = this.bots.get(botId);
    const state = this.botStates.get(botId);
    if (!bot || !state) throw new Error('Bot not found');
    if (!bot.inventory || !bot.inventory.slots) throw new Error('Inventory not ready');

    let dest = null;
    if (typeof identifier === 'string') {
      dest = identifier; // expect head|torso|legs|feet
    } else if (typeof identifier === 'number') {
      // Map slot index (5-8) -> destination
      dest = { 5: 'head', 6: 'torso', 7: 'legs', 8: 'feet' }[identifier] || null;
    }
    if (!dest || !['head','torso','legs','feet'].includes(dest)) throw new Error('Invalid armor destination');

    return new Promise((resolve, reject) => {
      bot.unequip(dest).then(() => {
        this.updateBotState(botId);
        this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'unequip', dest, at: new Date().toISOString() } });
        resolve({ success: true, dest });
      }).catch(err => {
        const message = err && err.message ? err.message : 'Failed to unequip';
        this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'unequip-error', dest, message, at: new Date().toISOString() } });
        reject(new Error(message));
      });
    });
  }

  stopTask(botId) {
    const existing = this.taskIntervals.get(botId);
    if (existing) {
      clearTimeout(existing);
      this.taskIntervals.delete(botId);
    }
    // Stop pathfinder motion if active
    const bot = this.bots.get(botId);
    if (bot && bot.pathfinder) {
      try { bot.pathfinder.stop(); } catch (_) {}
    }
    const state = this.botStates.get(botId);
    if (state && state.currentTask) {
      const stopped = state.currentTask.name;
      delete state.currentTask;
      state.lastUpdate = new Date().toISOString();
      this.eventBus.emit('state', { botId, state: { ...state }, event: { type: 'task-stop', name: stopped, at: new Date().toISOString() } });
    }
  }

  forceKill(botId) {
    // Forcefully terminate bot instance and clean all state
    const bot = this.bots.get(botId);
    if (bot) {
      try {
        // Force end without graceful quit
        if (bot._client && bot._client.socket) {
          bot._client.socket.destroy();
        }
        bot.end();
      } catch (err) {
        console.warn(`[${botId}] Force kill error:`, err.message);
      }
      this.bots.delete(botId);
    }
    // Clear all intervals/timeouts
    const interval = this.taskIntervals.get(botId);
    if (interval) {
      clearTimeout(interval);
      this.taskIntervals.delete(botId);
    }
    // Clear state
    this.botStates.delete(botId);
    console.log(`💀 [${botId}] Force killed and purged all state`);
    return true;
  }

  pauseTask(botId) {
    const existing = this.taskIntervals.get(botId);
    if (existing) {
      clearTimeout(existing);
      this.taskIntervals.delete(botId);
    }
    const state = this.botStates.get(botId);
    if (state && state.currentTask) {
      state.currentTask.paused = true;
      state.lastUpdate = new Date().toISOString();
      this.eventBus.emit('state', { botId, state: { ...state }, event: { type: 'task-pause', name: state.currentTask.name, at: new Date().toISOString() } });
    }
  }

  resumeTask(botId) {
    const bot = this.bots.get(botId);
    const state = this.botStates.get(botId);
    if (!bot || !state || !state.currentTask) throw new Error('No task to resume');
    if (!state.currentTask.paused) throw new Error('Task is not paused');

    // Clear paused flag
    state.currentTask.paused = false;
    state.lastUpdate = new Date().toISOString();
    this.eventBus.emit('state', { botId, state: { ...state }, event: { type: 'task-resume', name: state.currentTask.name, at: new Date().toISOString() } });

    const taskName = state.currentTask.name;
    if (taskName === 'AFK') {
      // Restart AFK loop
      const runTick = () => {
        if (!bot._client || !bot._client.socket) return;
        const randMs = 5000 + Math.floor(Math.random() * 5000);

        const dirs = ['forward', 'back', 'left', 'right'];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        bot.setControlState(dir, true);
        setTimeout(() => bot.setControlState(dir, false), 500 + Math.floor(Math.random() * 500));

        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 250);

        this.eventBus.emit('state', { botId, state: { ...this.botStates.get(botId) }, event: { type: 'task-progress', name: 'AFK', at: new Date().toISOString() } });

        const next = setTimeout(runTick, randMs);
        this.taskIntervals.set(botId, next);
      };
      const first = setTimeout(runTick, 1000);
      this.taskIntervals.set(botId, first);
    }
  }
}

module.exports = new BotManager();
