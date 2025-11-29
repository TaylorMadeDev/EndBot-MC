// Multi-bot manager for Mineflayer bots
const mineflayer = require('mineflayer');
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
    
    const bot = mineflayer.createBot({
      host: config.host || 'ryasandigzz.aternos.me',
      port: config.port || 25565,
      username: config.username || `Bot_${botId.substr(-4)}`,
      version: config.version || '1.21.8',
      auth: config.auth || 'offline'
    });

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

    const bot = mineflayer.createBot({
      host: config.host || 'localhost',
      port: config.port || 25565,
      username: config.username || `Bot_${botId.substr(-4)}`,
      version: config.version || '1.21.8',
      auth: config.auth || 'offline'
    });

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
    this.botStates.set(botId, botState);
    this.setupBotEvents(botId, bot, botState);
    return { botId, bot, botState };
  }

  setupBotEvents(botId, bot, botState) {
    bot.on('login', () => {
      console.log(`✅ [${botId}] Bot logged in as ${bot.username}`);
      botState.connected = true;
      botState.username = bot.username;
      botState.lastUpdate = new Date().toISOString();
    });

    bot.on('spawn', () => {
      console.log(`🌍 [${botId}] Bot spawned in the world!`);
      this.updateBotState(botId);
      
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
      botState.connected = false;
      botState.lastUpdate = new Date().toISOString();
      emitGuarded('error', { message: err.message });
    });

    bot.on('end', () => {
      console.log(`🔌 [${botId}] Bot disconnected`);
      botState.connected = false;
      botState.lastUpdate = new Date().toISOString();
      emitGuarded('disconnect', {});
    });

    // Nearby entity hurt: emit for non-self, throttled per entity to avoid spam
    botState._eventThrottle = botState._eventThrottle || new Map();
    bot.on('entityHurt', (entity) => {
      if (!entity || entity === bot.entity) return;
      const key = entity.id || entity.username || entity.name || 'unknown';
      const last = botState._eventThrottle.get(key) || 0;
      const now = Date.now();
      if (now - last < 300) return; // throttle per entity 300ms
      botState._eventThrottle.set(key, now);
      const name = entity.username || entity.name || 'entity';
      this.updateBotState(botId);
      emitGuarded('entity-hurt', { target: name });
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
    const state = this.botStates.get(botId);
    if (state && state.currentTask) {
      const stopped = state.currentTask.name;
      delete state.currentTask;
      state.lastUpdate = new Date().toISOString();
      this.eventBus.emit('state', { botId, state: { ...state }, event: { type: 'task-stop', name: stopped, at: new Date().toISOString() } });
    }
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
