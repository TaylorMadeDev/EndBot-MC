import React, { createContext, useContext, useEffect, useState } from 'react';
import { listBots, createBot as apiCreateBot, getBotStatus, sendBotChat, listAccounts, createAccount as apiCreateAccount, disconnectBot as apiDisconnectBot, reconnectBot as apiReconnectBot, updateBot as apiUpdateBot, deleteBot as apiDeleteBot, killBot as apiKillBot } from '../utils/api';
import { startBotTask, stopBotTask, pauseBotTask, resumeBotTask } from '../utils/api';
import { API_BASE } from '../utils/api';

const BotsContext = createContext();

export function BotsProvider({ children }) {
  const [bots, setBots] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBots();
      // Handle both array and { bots: [...] } response formats
      const botList = Array.isArray(data) ? data : (data.bots || []);
      setBots(botList);

      const accData = await listAccounts();
      const accountList = Array.isArray(accData) ? accData : (accData.accounts || []);
      setAccounts(accountList);
    } catch (e) {
      setError(e.message || 'Failed to load bots');
      console.error('Failed to load bots:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refresh();
      // periodic refresh every 30s
      const t = setInterval(() => refresh(), 30000);
      if (!mounted) clearInterval(t);
    })();
    return () => { mounted = false; };
  }, []);

  const addBot = async ({ accountName, accountId, username, serverHost, serverPort, version }) => {
    console.log('Adding bot with accountName:', accountName, 'accountId:', accountId, 'username:', username);
    const response = await apiCreateBot({ accountName, accountId, username, serverHost, serverPort, version });
    // Handle { success: true, botId: '...', bot: {...} } response format
    const bot = response.bot || response;
    setBots((s) => [bot, ...s]);
    return bot;
  };

  const addAccount = async ({ username, method = 'cracked' }) => {
    const response = await apiCreateAccount({ username, method, userId: 1 });
    const account = response.account || response;
    setAccounts(s => [account, ...s]);
    return account;
  };

  const updateBot = (id, patch) => setBots((s) => s.map(b => (b.id === id ? { ...b, ...patch } : b)));

  const getStatus = async (id) => {
    try {
      const status = await getBotStatus(id);
      return status;
    } catch (e) {
      console.error('Failed to get unified status, falling back:', e);
      return { health: null, position: null, inventory: null };
    }
  };

  const chat = async (id, message) => sendBotChat(id, message);

  const disconnect = async (id) => {
    await apiDisconnectBot(id);
    updateBot(id, { status: 'offline' });
  };

  const reconnect = async (id) => {
    const res = await apiReconnectBot(id);
    updateBot(id, { status: 'online', id: res.botId });
  };

  const killBot = async (id) => {
    await apiKillBot(id);
    updateBot(id, { status: 'offline' });
  };

  const assignTask = async (botId, taskName) => {
    await startBotTask(botId, taskName);
  };

  const endTask = async (botId) => {
    await stopBotTask(botId);
  };

  const pauseTask = async (botId) => {
    await pauseBotTask(botId);
  };

  const resumeTask = async (botId) => {
    await resumeBotTask(botId);
  };

  const editBot = async (botId, updates) => {
    const bot = await apiUpdateBot(botId, updates);
    setBots(s => s.map(b => b.id === botId ? { ...b, ...bot } : b));
    return bot;
  };

  const removeBot = async (botId) => {
    await apiDeleteBot(botId);
    setBots(s => s.filter(b => b.id !== botId));
  };

  return (
    <BotsContext.Provider value={{ bots, accounts, loading, error, refresh, addBot, addAccount, updateBot, getStatus, chat, disconnect, reconnect, killBot, assignTask, endTask, pauseTask, resumeTask, editBot, removeBot }}>
      {children}
    </BotsContext.Provider>
  );
}

export const useBots = () => useContext(BotsContext);
