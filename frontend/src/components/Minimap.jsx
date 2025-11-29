import React from 'react';
import '../styles/minimap.css';

export default function Minimap({ botPosition, entities, players, size = 360, range = 32 }) {
  // Minimap settings (configurable)
  const mapSize = size; // pixels
  const viewRange = range; // blocks to show in each direction
  const scale = mapSize / (viewRange * 2);

  // Build mob image path from public/mobs using a safe name
  const getMobImageSrc = (entity) => {
    if (!entity) return null;
    const baseName = (entity.name || entity.type || '').toString().trim();
    if (!baseName) return null;
    const safe = baseName.toLowerCase().replace(/\s+/g, '_');
    return `/mobs/${safe}.png`;
  };

  // Convert world coordinates to minimap coordinates
  const worldToMap = (worldX, worldZ) => {
    const relX = worldX - botPosition.x;
    const relZ = worldZ - botPosition.z;
    
    // Map coordinates: center is (mapSize/2, mapSize/2)
    // Z maps to Y (down is positive Z in Minecraft)
    const mapX = mapSize / 2 + relX * scale;
    const mapY = mapSize / 2 + relZ * scale;
    
    return { x: mapX, y: mapY };
  };

  // Check if entity is within range
  const isInRange = (entity) => {
    if (!entity.position) return false;
    const dx = Math.abs(entity.position.x - botPosition.x);
    const dz = Math.abs(entity.position.z - botPosition.z);
    return dx <= viewRange && dz <= viewRange;
  };

  const entitiesInRange = (entities || []).filter(isInRange);
  const playersInRange = (players || []).filter(p => {
    // Players might not have position, filter them carefully
    return p.position && isInRange({ position: p.position });
  });

  return (
    <div className="minimap" style={{ width: mapSize, height: mapSize }}>
        {/* Grid lines */}
        <div className="minimap-grid">
          <div className="grid-line vertical" style={{ left: '25%' }}></div>
          <div className="grid-line vertical" style={{ left: '50%' }}></div>
          <div className="grid-line vertical" style={{ left: '75%' }}></div>
          <div className="grid-line horizontal" style={{ top: '25%' }}></div>
          <div className="grid-line horizontal" style={{ top: '50%' }}></div>
          <div className="grid-line horizontal" style={{ top: '75%' }}></div>
        </div>

        {/* Cardinal directions */}
        <div className="cardinal north">N</div>
        <div className="cardinal south">S</div>
        <div className="cardinal east">E</div>
        <div className="cardinal west">W</div>

        {/* Entities */}
        {entitiesInRange.map((entity, idx) => {
          const pos = worldToMap(entity.position.x, entity.position.z);
          const isHostile = ['zombie', 'skeleton', 'creeper', 'spider', 'enderman', 'witch'].some(
            mob => entity.type?.toLowerCase().includes(mob) || entity.name?.toLowerCase().includes(mob)
          );
          const isPassive = ['cow', 'pig', 'sheep', 'chicken', 'horse', 'villager'].some(
            mob => entity.type?.toLowerCase().includes(mob) || entity.name?.toLowerCase().includes(mob)
          );
          
          return (
            <div
              key={`entity-${idx}`}
              className={`minimap-dot entity ${isHostile ? 'hostile' : isPassive ? 'passive' : 'neutral'}`}
              style={{ left: pos.x, top: pos.y }}
              title={`${entity.name || entity.type} (${entity.distance}m)`}
            >
              {(() => {
                const src = getMobImageSrc(entity);
                return src ? (
                  <img
                    src={src}
                    alt={entity.name || entity.type}
                    style={{ width: 20, height: 20, borderRadius: '50%' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.fallback-icon')) {
                        const fallback = document.createElement('i');
                        fallback.className = `fas ${isHostile ? 'fa-skull' : isPassive ? 'fa-paw' : 'fa-circle'} fallback-icon`;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <i className={`fas ${isHostile ? 'fa-skull' : isPassive ? 'fa-paw' : 'fa-circle'}`} style={{ fontSize: 14 }}></i>
                );
              })()}
            </div>
          );
        })}

        {/* Players */}
        {playersInRange.map((player, idx) => {
          const pos = worldToMap(player.position.x, player.position.z);
          return (
            <div
              key={`player-${idx}`}
              className="minimap-dot player"
              style={{ left: pos.x, top: pos.y }}
              title={`${player.username}`}
            >
              <i className="fas fa-user"></i>
            </div>
          );
        })}

        {/* Bot (center) */}
        <div className="minimap-dot bot" style={{ left: mapSize / 2, top: mapSize / 2 }}>
          <i className="fas fa-circle"></i>
          <div className="bot-pulse"></div>
        </div>
      </div>
  );
}
