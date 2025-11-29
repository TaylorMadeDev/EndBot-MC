import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBots } from '../context/BotsContext';
import '../styles/botdetails.css';
import Minimap from '../components/Minimap';
// UI icon helpers for Minecraft-style HUD from public/ui
const uiIcon = (name) => `/ui/${name}`;
const HeartSlot = ({ state }) => {
  // state: 'empty' | 'half' | 'full'
  return (
    <div className="hud-slot">
      <img src={uiIcon('container.png')} alt="heart-container" className="hud-base" />
      {state === 'full' && <img src={uiIcon('heart_full.png')} alt="heart-full" className="hud-overlay" />}
      {state === 'half' && <img src={uiIcon('heart_half.png')} alt="heart-half" className="hud-overlay" />}
      {state === 'empty' && null}
    </div>
  );
};
const FoodSlot = ({ state }) => {
  // state: 'empty' | 'half' | 'full'
  return (
    <div className="hud-slot">
      <img src={uiIcon('food_empty.png')} alt="food-empty" className="hud-base" />
      {state === 'full' && <img src={uiIcon('food_full.png')} alt="food-full" className="hud-overlay" />}
      {state === 'half' && <img src={uiIcon('food_half.png')} alt="food-half" className="hud-overlay" />}
    </div>
  );
};
const ArmorSlot = ({ state }) => {
  // state: 'empty' | 'half' | 'full'
  return (
    <div className="hud-slot">
      <img src={uiIcon('armor_empty.png')} alt="armor-empty" className="hud-base" />
      {state === 'full' && <img src={uiIcon('armor_full.png')} alt="armor-full" className="hud-overlay" />}
      {state === 'half' && <img src={uiIcon('armor_half.png')} alt="armor-half" className="hud-overlay" />}
    </div>
  );
};

// Context menu component for inventory/hotbar actions
function InventoryContextMenu({ state, onClose, onDrop, onEquip, onUnequip, onInspect }) {
  if (!state.open) return null;
  return (
    <div
      className="inventory-context-menu"
      style={{ top: state.y, left: state.x }}
    >
      <div className="cm-header">
        <i className="fas fa-box"></i>
        <span>{state.item?.displayName || state.item?.name || 'Item'}</span>
      </div>
      {/* Equip / Unequip toggle for armor */}
      {(() => {
        const name = (state.item?.name || state.item?.displayName || '').toLowerCase();
        const isArmor = name.includes('helmet') || name.includes('chestplate') || name.includes('leggings') || name.includes('boots');
        const armorSlots = [5,6,7,8];
        const isEquipped = isArmor && armorSlots.includes(state.item?.slot);
        if (!isArmor) return null;
        return isEquipped ? (
          <button className="cm-item" onClick={onUnequip}><i className="fas fa-times-circle"></i> Unequip</button>
        ) : (
          <button className="cm-item" onClick={onEquip}><i className="fas fa-shield-alt"></i> Equip</button>
        );
      })()}
      <button className="cm-item" onClick={onDrop}><i className="fas fa-trash"></i> Drop</button>
      <button className="cm-item" onClick={onInspect}><i className="fas fa-search"></i> Inspect</button>
    </div>
  );
}

// Helper to build image path for item icons from public/minecraft_items
const getItemImageSrc = (item) => {
    console.log(item);
  if (!item) return null;
  const baseName = (item.displayName || item.name || '').toString().trim();
  if (!baseName) return null;
  const safe = baseName.toLowerCase().replace(/\s+/g, '_');
  console.log(`/minecraft_items/${safe}.png`);
  return `/minecraft_items/${safe}.png`;
};


export default function BotDetails() {
  const { id } = useParams();
  const { bots, getStatus, chat, disconnect, reconnect, endTask, pauseTask, resumeTask } = useBots();
  const bot = useMemo(() => bots.find(b => String(b.id) === String(id)), [bots, id]);
  const [status, setStatus] = useState({ health: null, position: null, inventory: null });
  const [uiReady, setUiReady] = useState(false);
  const [events, setEvents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [menuState, setMenuState] = useState({ open: false, x: 0, y: 0, item: null, slot: null, area: null });

  useEffect(() => {
    const handler = (ev) => {
      const { x, y, item, slot, area } = ev.detail || {};
      setMenuState({ open: true, x, y, item, slot, area });
    };
    const close = () => setMenuState(s => ({ ...s, open: false }));
    window.addEventListener('inventory-context', handler);
    window.addEventListener('click', close);
    return () => {
      window.removeEventListener('inventory-context', handler);
      window.removeEventListener('click', close);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let es;
    let polling; // interval id
    let fastPoll = true; // start fast polling until ready
    (async () => {
      if (!bot) return;
      const s = await getStatus(bot.id);
      if (mounted) {
        setStatus(s);
        // Mark ready only when connected and we have core sections
        if (s && s.connected && s.position && s.health) setUiReady(true);
      }
      // Subscribe to SSE for live events
      try {
        es = new EventSource(`${process.env.REACT_APP_API_BASE || 'http://localhost:3001/api'}/bots/${bot.id}/events`);
        es.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data.event) {
              if (data.event.type === 'chat') {
                setChatMessages((prev) => [{ text: data.event.message, at: data.event.at }, ...prev].slice(0, 50));
              } else {
                setEvents((prev) => {
                  const last = prev[0];
                  const at = new Date(data.event.at || Date.now()).getTime();
                  const lastAt = last ? new Date(last.at || Date.now()).getTime() : 0;
                  // Deduplicate same type within 300ms
                  if (last && last.type === data.event.type && (at - lastAt) < 300) {
                    return prev;
                  }
                  return [{ ...data.event }, ...prev].slice(0, 20);
                });
              }
            }
            // If SSE indicates connected state, mark UI ready sooner
            if (data.state && data.state.connected) {
              setUiReady(true);
            }
          } catch {}
        };
        // We keep polling for status regardless; SSE is only for events
      } catch {}
    })();
    // Continuous polling for status; fast until ready
    const poll = async () => {
      if (!bot) return;
      const s = await getStatus(bot.id);
      setStatus(s);
      if (s && s.chatMessages && s.chatMessages.length > 0) setChatMessages(s.chatMessages);
      if (s && s.connected && s.position && s.health) setUiReady(true);
      // After ready, switch to normal pace
      if (fastPoll && (s && s.connected)) {
        fastPoll = false;
        if (polling) clearInterval(polling);
        polling = setInterval(poll, 2000);
      }
    };
    polling = setInterval(poll, 700);
    return () => { mounted = false; if (polling) clearInterval(polling); if (es) es.close(); };
  }, [bot, getStatus]);

  if (!bot) {
    return (
      <div className="card" style={{margin:16}}>
        <h3>Bot not found</h3>
        <p>Check the URL or return to My Bots.</p>
      </div>
    );
  }

  const rawHealth = status?.health?.value ?? status?.health?.health ?? null;
  const hearts = status?.health?.hearts ?? (rawHealth != null ? Math.ceil(rawHealth / 2) : 0);
  const armor = status?.health?.armor ?? 0;
  const food = status?.health?.food ?? 20;
  const healthPoints = rawHealth != null ? Math.max(0, Math.min(20, Math.round(rawHealth))) : hearts * 2;
  const foodPoints = Math.max(0, Math.min(20, Math.round(food)));
  const armorPoints = Math.max(0, Math.min(20, Math.round(armor)));
  const pos = status?.position || { x: 0, y: 0, z: 0, dimension: 'overworld' };
  const inv = status?.inventory?.items || [];
  const equipped = status?.equipped || {};
  const armorSlots = {
    head: inv.find(i => i && i.slot === 5) || null,
    torso: inv.find(i => i && i.slot === 6) || null,
    legs: inv.find(i => i && i.slot === 7) || null,
    feet: inv.find(i => i && i.slot === 8) || null,
  };
  const isOnline = (status && (status.connected === true || !!status.health || status.online === true || status.status === 'online')) || bot.status === 'online';
  const isLoaded = uiReady === true;
  // Equip handler: call backend equip API for armor-only
  const handleEquip = async () => {
    try {
      const { equipItem, getStatus: fetchStatus } = await import('../utils/api');
      const name = (menuState.item?.name || menuState.item?.displayName || '').toLowerCase();
      const payload = name ? { name } : { slot: menuState.slot };
      await equipItem(bot.id, payload);
      const fresh = await fetchStatus(bot.id);
      setStatus(fresh);
      setMenuState({ open: false, x: 0, y: 0, item: null, slot: null, area: null });
    } catch (err) {
      console.error('Equip failed', err);
    }
  };
  // Unequip handler
  const handleUnequip = async () => {
    try {
      const { unequipItem, getStatus: fetchStatus } = await import('../utils/api');
      const slot = menuState.item?.slot;
      const destMap = { 5: 'head', 6: 'torso', 7: 'legs', 8: 'feet' };
      const payload = slot != null && destMap[slot] ? { dest: destMap[slot] } : (slot != null ? { slot } : null);
      if (!payload) return;
      await unequipItem(bot.id, payload);
      const fresh = await fetchStatus(bot.id);
      setStatus(fresh);
      setMenuState({ open: false, x: 0, y: 0, item: null, slot: null, area: null });
    } catch (err) {
      console.error('Unequip failed', err);
    }
  };

  // ...later in JSX render, ensure Minimap and Events occupy full rows
  // NOTE: We add wrapper classes to enforce full-width stacking

  return (
    <div className="dashboard-page bot-details-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title"><i className="fas fa-sliders-h"></i> Manage {bot.username}</h1>
          <p className="page-subtitle">Status and controls for this bot</p>
        </div>
        <div className="header-right">
          <div className="current-task-card">
            <div className="ct-header">
              <i className="fas fa-tasks"></i>
              <span>Current Task</span>
            </div>
            {status?.currentTask ? (
              <div className="ct-body">
                <div className="ct-name">{status.currentTask.name}{status.currentTask.paused ? ' (Paused)' : ''}</div>
                <div className="ct-meta">
                  <span>Started at {new Date(status.currentTask.startedAt).toLocaleTimeString()}</span>
                  <span>•</span>
                  <span>
                    Elapsed {
                      (() => {
                        const start = new Date(status.currentTask.startedAt).getTime();
                        const now = Date.now();
                        const ms = Math.max(0, now - start);
                        const m = Math.floor(ms / 60000);
                        const s = Math.floor((ms % 60000) / 1000);
                        return `${m}m ${s}s`;
                      })()
                    }
                  </span>
                </div>
              </div>
            ) : (
              <div className="ct-body">
                <div className="ct-name idle">Idle</div>
                <div className="ct-meta"><span>No active task</span></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bot-details-grid-84">
        {/* Left 8-column main area */}
        <div className="bot-main-column">
          <div className="bot-main-card">
            {/* Active label top-left */}
            <div className={`active-label ${isOnline ? 'on' : 'off'}`}>
              <i className={`fas ${isOnline ? 'fa-circle' : 'fa-ban'}`}></i>
              {isOnline ? 'Active' : 'Offline'}
            </div>
            {!isLoaded ? (
              <div className="loading-overlay">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                <img
                  alt="skin"
                  src={`https://minotar.net/armor/body/${encodeURIComponent(bot.username)}/300.png`}
                  className="bot-main-image"
                />
                <div className="bot-overlay bot-overlay-name">
                  <div className="bot-name-heading">{bot.username}</div>
                </div>
                <div className="bot-overlay bot-overlay-position">
                  <div className="position-heading"><i className="fas fa-map-marker-alt"></i> Position</div>
                  <div className="position-values">X:{pos.x} Y:{pos.y} Z:{pos.z}</div>
                  <div className="dimension-label"><i className="fas fa-globe"></i> {pos.dimension}</div>
                </div>
              </>
            )}

            {/* Armor stacks beside model: head+torso left, legs+feet right */}
            {isLoaded && (
            <div className="armor-stack left">
              {['head','torso'].map(key => {
                const piece = armorSlots[key];
                return (
                  <div
                    key={key}
                    className={`slot armor ${piece ? 'filled' : ''}`}
                    title={piece ? (piece.displayName || piece.name) : key}
                    onContextMenu={(e) => {
                      if (!piece) return;
                      e.preventDefault();
                      const menuEvent = new CustomEvent('inventory-context', {
                        detail: { x: e.clientX, y: e.clientY, item: piece, slot: piece.slot, area: 'armor' }
                      });
                      window.dispatchEvent(menuEvent);
                    }}
                  >
                    {piece ? (() => { const src = getItemImageSrc(piece); return src ? <img src={src} alt={piece.displayName || piece.name} className="inventory-icon" /> : <i className="fas fa-cube" />; })() : null}
                  </div>
                );
              })}
            </div>
            )}
            {isLoaded && (
            <div className="armor-stack right">
              {['legs','feet'].map(key => {
                const piece = armorSlots[key];
                return (
                  <div
                    key={key}
                    className={`slot armor ${piece ? 'filled' : ''}`}
                    title={piece ? (piece.displayName || piece.name) : key}
                    onContextMenu={(e) => {
                      if (!piece) return;
                      e.preventDefault();
                      const menuEvent = new CustomEvent('inventory-context', {
                        detail: { x: e.clientX, y: e.clientY, item: piece, slot: piece.slot, area: 'armor' }
                      });
                      window.dispatchEvent(menuEvent);
                    }}
                  >
                    {piece ? (() => { const src = getItemImageSrc(piece); return src ? <img src={src} alt={piece.displayName || piece.name} className="inventory-icon" /> : <i className="fas fa-cube" />; })() : null}
                  </div>
                );
              })}
            </div>
            )}

            {/* Hotbar under model */}
            {isLoaded && (
            <div className="hotbar">
              {Array.from({ length: 9 }).map((_, i) => {
                // Mineflayer hotbar slots are 36-44
                const slotIndex = 36 + i;
                const itemInHotbar = inv.find(it => it && typeof it.slot === 'number' && it.slot === slotIndex);
                return (
                  <div
                    key={i}
                    className="slot hotbar-slot"
                    title={itemInHotbar ? (itemInHotbar.displayName || itemInHotbar.name) : ''}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const menuEvent = new CustomEvent('inventory-context', {
                        detail: { x: e.clientX, y: e.clientY, item: itemInHotbar, slot: slotIndex, area: 'hotbar' }
                      });
                      window.dispatchEvent(menuEvent);
                    }}
                  >
                    {itemInHotbar ? (
                      <>
                        {(() => {
                          const src = getItemImageSrc(itemInHotbar);
                          return src ? (
                            <img
                              src={src}
                              alt={itemInHotbar.displayName || itemInHotbar.name}
                              className="inventory-icon"
                              onError={(e) => {
                                console.log("Bruh")
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent && !parent.querySelector('.fallback-icon')) {
                                  const fallback = document.createElement('i');
                                  fallback.className = 'fas fa-cube fallback-icon';
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : (
                            <div className="inventory-icon">
                              <i className="fas fa-cube"></i>
                            </div>
                          );
                        })()}
                        {itemInHotbar.count > 0 && (
                          <span className="item-count hotbar-count">{itemInHotbar.count}</span>
                        )}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
            )}
            {/* Hotbar HUD */}
            {isLoaded && (
              <div className="hotbar-hud">
                <div className="hud-left">
                  <div className="hud-armor">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const left = i * 2;
                      const right = left + 2;
                      const state = armorPoints >= right ? 'full' : armorPoints >= left + 1 ? 'half' : 'empty';
                      return <ArmorSlot key={i} state={state} />;
                    })}
                  </div>
                  <div className="hud-hearts">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const left = i * 2;
                      const right = left + 2;
                      const state = healthPoints >= right ? 'full' : healthPoints >= left + 1 ? 'half' : 'empty';
                      return <HeartSlot key={i} state={state} />;
                    })}
                  </div>
                </div>
                <div className="hud-right">
                  <div className="hud-food">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const left = i * 2;
                      const right = left + 2;
                      const state = foodPoints >= right ? 'full' : foodPoints >= left + 1 ? 'half' : 'empty';
                      return <FoodSlot key={i} state={state} />;
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panels beneath main card */}
          <div className="bot-subgrid">
            <div className="dashboard-section bot-inventory-panel">
              <div className="section-header">
                <h2><i className="fas fa-box"></i> Inventory</h2>
                <span className="item-count">{inv.length} / 36 items</span>
              </div>
              <div className="inventory-grid">
                {Array.from({ length: 36 }).map((_, idx) => {
                  const item = inv[idx];
                  // Skip rendering items in armor slots (5-8)
                  const isArmorSlot = item && [5, 6, 7, 8].includes(item.slot);
                  if (isArmorSlot) {
                    return <div key={idx} className="inventory-slot empty"></div>;
                  }
                  if (!item) {
                    return <div key={idx} className="inventory-slot empty"></div>;
                  }
                  return (
                    <div
                      key={idx}
                      className="inventory-slot"
                      title={item.displayName || item.name || 'Item'}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        const menuEvent = new CustomEvent('inventory-context', {
                          detail: { x: e.clientX, y: e.clientY, item, slot: idx, area: 'inventory' }
                        });
                        window.dispatchEvent(menuEvent);
                      }}
                    >
                      {(() => {
                        const src = getItemImageSrc(item);
                        return src ? (
                          <img
                            src={src}
                            alt={item.displayName || item.name}
                            className="inventory-icon inventory-icon-large"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const fallback = document.createElement('i');
                                fallback.className = 'fas fa-cube fallback-icon';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="inventory-icon inventory-icon-large">
                            <i className="fas fa-cube"></i>
                          </div>
                        );
                      })()}
                      {item.count > 0 && (
                        <span className="item-count" data-count={item.count}>{item.count}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="dashboard-section bot-events-panel">
              <div className="section-header">
                <h2><i className="fas fa-bell"></i> Events</h2>
                <span className="item-count">{events.length} recent</span>
              </div>
              <div className="events-list">
                {events.length === 0 ? (
                  <div className="event-line muted">No events yet</div>
                ) : (
                  events.map((e, idx) => (
                    <div key={idx} className={`event-line ${e.type}`}>
                      <span className="time">{new Date(e.at || Date.now()).toLocaleTimeString()}</span>
                      <span className="desc">
                        {e.type === 'damage' ? (
                          <>Took {e.amount} damage</>
                        ) : e.type === 'self-hurt' ? (
                          <>You were hurt</>
                        ) : e.type === 'entity-hurt' ? (
                          <>Nearby entity hurt: {e.target}</>
                        ) : e.type === 'kicked' ? (
                          <>Kicked: {e.reason}</>
                        ) : e.type === 'disconnect' ? (
                          <>Disconnected</>
                        ) : e.type === 'error' ? (
                          <>Error: {e.message}</>
                        ) : e.type === 'equip' ? (
                          <>Equipped {e.item} to {e.dest}</>
                        ) : e.type === 'equip-error' ? (
                          <>Equip failed: {e.item} ({e.message})</>
                        ) : e.type === 'unequip' ? (
                          <>Unequipped {e.dest}</>
                        ) : e.type === 'unequip-error' ? (
                          <>Unequip failed: {e.dest} ({e.message})</>
                        ) : e.type === 'status' ? (
                          <>Status updated</>
                        ) : (
                          <>{e.type}</>
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            {isLoaded && (
              <div className="dashboard-section bot-radar-panel">
                <div className="section-header">
                  <h2><i className="fas fa-radar"></i> Radar</h2>
                  <span className="item-count">{(status?.entities || []).length + (status?.players || []).length} detected</span>
                </div>
                <Minimap 
                  botPosition={pos} 
                  entities={status?.entities || []} 
                  players={status?.players || []}
                  size={420}
                  range={48}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right 4-column: Quick Actions on top, Chat, then Current Task */}
        <div className="bot-chat-column">
          <div className="dashboard-section side-quick-actions bot-actions-panel">
            <div className="section-header">
              <h2><i className="fas fa-bolt"></i> Quick Actions</h2>
            </div>
            <div className="quick-actions-list">
              {!status?.currentTask ? (
                <button className="action-btn action-cyan" onClick={() => setShowTaskModal(true)}>
                  <i className="fas fa-play"></i>
                  <span>Start Task</span>
                </button>
              ) : (
                <>
                  <button className="action-btn action-orange" onClick={async () => {
                    if (status?.currentTask?.paused) {
                      await resumeTask(bot.id);
                    } else {
                      await pauseTask(bot.id);
                    }
                  }}>
                    <i className={`fas ${status?.currentTask?.paused ? 'fa-play' : 'fa-pause'}`}></i>
                    <span>{status?.currentTask?.paused ? 'Unpause Task' : 'Pause Task'}</span>
                  </button>
                  <button className="action-btn action-danger-strong" onClick={async () => { await endTask(bot.id); }}>
                    <i className="fas fa-stop"></i>
                    <span>End Task</span>
                  </button>
                </>
              )}
              <button className="action-btn action-purple">
                <i className="fas fa-home"></i>
                <span>Go Home</span>
              </button>
              <button className="action-btn action-orange">
                <i className="fas fa-redo"></i>
                <span>Respawn</span>
              </button>
              {isOnline ? (
                <button className="action-btn action-danger" onClick={async () => { setUiReady(false); await disconnect(bot.id); }}>
                  <i className="fas fa-power-off"></i>
                  <span>Disconnect</span>
                </button>
              ) : (
                <button className="action-btn action-cyan" onClick={async () => { setUiReady(false); await reconnect(bot.id); }}>
                  <i className="fas fa-plug"></i>
                  <span>Reconnect</span>
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-section bot-chat-panel side-chat-panel">
            <div className="section-header">
              <h2><i className="fas fa-comments"></i> Chat</h2>
            </div>
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="chat-message system">
                  <i className="fas fa-info-circle"></i>
                  <span>No chat messages yet. Waiting for Minecraft chat...</span>
                </div>
              ) : (
                chatMessages.map((cm, idx) => (
                  <div key={idx} className="chat-message">
                    <span className="chat-time">{new Date(cm.at).toLocaleTimeString()}</span>
                    <span className="chat-text">{cm.text}</span>
                  </div>
                ))
              )}
            </div>
            <form className="chat-input-form" onSubmit={async (e) => { e.preventDefault(); if (!msg) return; await chat(bot.id, msg); setMsg(''); }}>
              <input
                className="chat-input"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Type a message or command..."
              />
              <button className="btn primary chat-send" type="submit">
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>

          <div className="dashboard-section side-task-panel bot-task-panel">
            <div className="section-header">
              <h2><i className="fas fa-tasks"></i> Current Task</h2>
            </div>
            <div className="task-status">
              {status?.currentTask ? (
                <>
                  <div className="task-badge running">
                    <i className="fas fa-running"></i> {status.currentTask.name}
                  </div>
                  <p className="task-description">Started at {new Date(status.currentTask.startedAt).toLocaleTimeString()}</p>
                </>
              ) : (
                <>
                  <div className="task-badge idle">
                    <i className="fas fa-pause-circle"></i> Idle
                  </div>
                  <p className="task-description">No active task running</p>
            {/* Stop Task in Quick Actions when a task is active */}
            {/* Render alongside existing quick actions button group */}
                </>
              )}
            </div>
            <div className="output-log">
              <div className="log-header">
                <i className="fas fa-terminal"></i> Output Log
              </div>
              <div className="log-content">
                <div className="log-line">[{new Date().toLocaleTimeString()}] Bot connected successfully</div>
                <div className="log-line">[{new Date().toLocaleTimeString()}] Spawned at {pos.x}, {pos.y}, {pos.z}</div>
                <div className="log-line">[{new Date().toLocaleTimeString()}] Awaiting commands...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showTaskModal && (
        // Lazy import to avoid circular issues
        (() => {
          const TaskModal = require('../components/TaskModal').default;
          return <TaskModal botId={bot.id} isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} />;
        })()
      )}
      <InventoryContextMenu
        state={menuState}
        onClose={() => setMenuState(s => ({ ...s, open: false }))}
        onDrop={() => { console.log('Dropping item', menuState); setMenuState(s => ({ ...s, open: false })); }}
        onEquip={handleEquip}
        onUnequip={handleUnequip}
        onInspect={() => { console.log('Inspecting item', menuState.item); setMenuState(s => ({ ...s, open: false })); }}
      />
    </div>
  );
}