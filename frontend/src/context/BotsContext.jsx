import React, { createContext, useContext, useEffect, useState } from 'react';
import { listBots, createBot as apiCreateBot, getBotStatus, sendBotChat, getUser, listAccounts, createAccount as apiCreateAccount, disconnectBot as apiDisconnectBot, reconnectBot as apiReconnectBot } from '../utils/api';
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
      await getUser(1); // ensure default user exists
      const data = await listBots(1);
      // Handle both array and { bots: [...] } response formats
      const botList = Array.isArray(data) ? data : (data.bots || []);
      setBots(botList);

      const accData = await listAccounts(1);
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

  const addBot = async ({ username, serverHost, serverPort, version }) => {
    const response = await apiCreateBot({ username, serverHost, serverPort, version, userId: 1 });
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

  return (
    <BotsContext.Provider value={{ bots, accounts, loading, error, refresh, addBot, addAccount, updateBot, getStatus, chat, disconnect, reconnect, assignTask, endTask, pauseTask, resumeTask }}>
      {children}
    </BotsContext.Provider>
  );
}

export const useBots = () => useContext(BotsContext);
