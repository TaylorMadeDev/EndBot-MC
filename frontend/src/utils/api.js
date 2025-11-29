// API client for backend integration
export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

export async function login(email, password) {
  // Placeholder login; backend auth not implemented yet
  return { id: 'user-1', email, name: email.split('@')[0] || 'User' };
}

// Users
export async function getUser(userId = 1) {
  const res = await fetch(`${API_BASE}/users/${userId}`);
  if (!res.ok) throw new Error(`Failed to get user ${userId}`);
  return res.json();
}

// Bots
export async function listBots(userId = 1) {
  const res = await fetch(`${API_BASE}/bots?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to list bots');
  return res.json();
}

export async function createBot({ username, serverHost, serverPort, version, userId = 1 }) {
  const res = await fetch(`${API_BASE}/bots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, serverHost, serverPort, version, userId }),
  });
  if (!res.ok) throw new Error('Failed to create bot');
  return res.json();
}

export async function getBot(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}`);
  if (!res.ok) throw new Error(`Failed to get bot ${botId}`);
  return res.json();
}

export async function getBotHealth(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/health`);
  if (!res.ok) throw new Error('Failed to get health');
  return res.json();
}

export async function getBotPosition(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/position`);
  if (!res.ok) throw new Error('Failed to get position');
  return res.json();
}

export async function getBotInventory(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/inventory`);
  if (!res.ok) throw new Error('Failed to get inventory');
  return res.json();
}

// Unified status
export async function getBotStatus(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/status`);
  if (!res.ok) throw new Error('Failed to get status');
  return res.json();
}

export async function startBotTask(botId, name, payload = {}) {
  const res = await fetch(`${API_BASE}/bots/${botId}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, payload })
  });
  if (!res.ok) throw new Error('Failed to start task');
  return res.json();
}

export async function stopBotTask(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/task/stop`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to stop task');
  return res.json();
}

export async function pauseBotTask(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/task/pause`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to pause task');
  return res.json();
}

export async function resumeBotTask(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/task/resume`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to resume task');
  return res.json();
}

export async function getBotEntities(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/entities`);
  if (!res.ok) throw new Error('Failed to get entities');
  return res.json();
}

export async function sendBotChat(botId, message) {
  const res = await fetch(`${API_BASE}/bots/${botId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Failed to send chat');
  return res.json();
}

export async function equipItem(botId, payload) {
  const body = typeof payload === 'object' ? payload : { slot: payload };
  const res = await fetch(`${API_BASE}/bots/${botId}/inventory/equip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to equip');
  return data;
}

export async function unequipItem(botId, payload) {
  const body = typeof payload === 'object' ? payload : { slot: payload };
  const res = await fetch(`${API_BASE}/bots/${botId}/inventory/unequip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to unequip');
  return data;
}

export async function disconnectBot(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/disconnect`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to disconnect bot');
  return res.json();
}

export async function reconnectBot(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/reconnect`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reconnect bot');
  return res.json();
}
// Removed demo helpers (fetchBots, demo createBot, assignTask) in favor of real API

// Accounts
export async function listAccounts(userId = 1) {
  const res = await fetch(`${API_BASE}/accounts?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to list accounts');
  return res.json();
}

export async function createAccount({ username, method = 'cracked', userId = 1 }) {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, method, userId })
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
}
