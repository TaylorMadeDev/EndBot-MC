// API client for backend integration
export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

function authHeaders(extra = {}) {
  try {
    const raw = localStorage.getItem('minebot_auth');
    const auth = raw ? JSON.parse(raw) : null;
    const token = auth?.token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra
    };
  } catch {
    return { 'Content-Type': 'application/json', ...extra };
  }
}

// Auth
export async function authRegister(email, username, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, username, password })
  });
  if (!res.ok) throw new Error('Failed to register');
  return res.json();
}
export async function authLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Failed to login');
  return res.json();
}

// Users
export async function getUser(userId = 1) {
  const res = await fetch(`${API_BASE}/users/${userId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to get user ${userId}`);
  return res.json();
}

// Dashboard stats
export async function getUserStats(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get user stats');
  return res.json();
}

// Bots
export async function listBots() {
  const res = await fetch(`${API_BASE}/bots`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to list bots');
  return res.json();
}

export async function createBot({ accountName, accountId, username, serverHost, serverPort, version, userId = 1 }) {
  console.log("API createBot called with:", { accountName, accountId, username, serverHost, serverPort, version, userId });
  const res = await fetch(`${API_BASE}/bots`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ accountName, accountId, username, serverHost, serverPort, version, userId }),
  });
  if (!res.ok) throw new Error('Failed to create bot');
  return res.json();
}

export async function getBot(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to get bot ${botId}`);
  return res.json();
}

export async function getBotHealth(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/health`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get health');
  return res.json();
}

export async function getBotPosition(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/position`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get position');
  return res.json();
}

export async function getBotInventory(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/inventory`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get inventory');
  return res.json();
}

// Unified status
export async function getBotStatus(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/status`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get status');
  return res.json();
}

export async function startBotTask(botId, name, payload = {}) {
  const res = await fetch(`${API_BASE}/bots/${botId}/task`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, payload })
  });
  if (!res.ok) throw new Error('Failed to start task');
  return res.json();
}

export async function stopBotTask(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/task/stop`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to stop task');
  return res.json();
}

export async function pauseBotTask(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/task/pause`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to pause task');
  return res.json();
}

export async function resumeBotTask(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/task/resume`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to resume task');
  return res.json();
}

export async function getBotEntities(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/entities`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get entities');
  return res.json();
}

export async function sendBotChat(botId, message) {
  const res = await fetch(`${API_BASE}/bots/${botId}/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Failed to send chat');
  return res.json();
}

export async function equipItem(botId, payload) {
  const body = typeof payload === 'object' ? payload : { slot: payload };
  const res = await fetch(`${API_BASE}/bots/${botId}/inventory/equip`, {
    method: 'POST',
    headers: authHeaders(),
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
    headers: authHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to unequip');
  return data;
}

export async function consumeFood(botId, payload) {
  const body = typeof payload === 'object' ? payload : { slot: payload };
  const res = await fetch(`${API_BASE}/bots/${botId}/inventory/consume`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to consume food');
  return data;
}

export async function disconnectBot(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/disconnect`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to disconnect bot');
  return res.json();
}

export async function reconnectBot(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/reconnect`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to reconnect bot');
  return res.json();
}

export async function updateBot(botId, updates) {
  const res = await fetch(`${API_BASE}/bots/${botId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update bot');
  return res.json();
}

export async function deleteBot(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete bot');
  return res.json();
}

export async function killBot(botId) {
  const res = await fetch(`${API_BASE}/bots/${botId}/kill`, {
    method: 'POST',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to kill bot');
  return res.json();
}
// Removed demo helpers (fetchBots, demo createBot, assignTask) in favor of real API

// Accounts
export async function listAccounts() {
  const res = await fetch(`${API_BASE}/accounts`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to list accounts');
  return res.json();
}

export async function createAccount({ username, method = 'cracked', userId = 1 }) {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ username, method, userId })
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
}

export async function startMicrosoftAuth(name) {
  const res = await fetch(`${API_BASE}/accounts/microsoft/start`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Microsoft auth failed:', data);
    throw new Error(data.error || 'Failed to start Microsoft authentication');
  }
  return data;
}

export async function finishMicrosoftAuth({ name, allowedUsers = [] } = {}) {
  const res = await fetch(`${API_BASE}/accounts/microsoft/finish`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, allowed_users: allowedUsers })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Microsoft finish failed:', data);
    throw new Error(data.error || 'Failed to complete Microsoft authentication');
  }
  return data;
}

export async function deleteAccount(accountId) {
  const res = await fetch(`${API_BASE}/accounts/${accountId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete account');
  return res.json();
}

// Shodan API
export async function shodanSearch({ query = 'minecraft', version, page = 1, facets, minify }) {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (version) params.append('version', version);
  params.append('page', page);
  if (facets) params.append('facets', facets);
  if (minify !== undefined) params.append('minify', String(minify));
  
  const res = await fetch(`${API_BASE}/shodan/search?${params}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to search Shodan');
  return res.json();
}

export async function getShodanInfo() {
  const res = await fetch(`${API_BASE}/shodan/info`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to get Shodan info');
  return res.json();
}

// Monitored Servers
export async function listMonitoredServers() {
  const res = await fetch(`${API_BASE}/servers`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to list servers');
  return res.json();
}

export async function addMonitoredServer(serverData) {
  const res = await fetch(`${API_BASE}/servers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(serverData)
  });
  if (!res.ok) throw new Error('Failed to add server');
  return res.json();
}

export async function updateMonitoredServer(serverId, updates) {
  const res = await fetch(`${API_BASE}/servers/${serverId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update server');
  return res.json();
}

export async function deleteMonitoredServer(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete server');
  return res.json();
}
