const db = require('../models/db');

class ServerController {
  /**
   * Get all monitored servers for current user
   * GET /api/servers
   */
  async listServers(req, res) {
    try {
      const userId = req.user.id;
      
      const servers = db.prepare(`
        SELECT * FROM monitored_servers 
        WHERE user_id = ? 
        ORDER BY added_at DESC
      `).all(userId);

      // Parse metadata JSON
      const parsed = servers.map(s => ({
        ...s,
        metadata: s.metadata ? JSON.parse(s.metadata) : null
      }));

      res.json({
        success: true,
        servers: parsed
      });

    } catch (err) {
      console.error('List servers error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to list servers'
      });
    }
  }

  /**
   * Add a server to monitoring
   * POST /api/servers
   * Body: { host, port, version?, motd?, playerCount?, maxPlayers?, metadata? }
   */
  async addServer(req, res) {
    try {
      const userId = req.user.id;
      const { host, port = 25565, version, motd, playerCount, maxPlayers, metadata } = req.body;

      if (!host) {
        return res.status(400).json({
          success: false,
          error: 'Host is required'
        });
      }

      // Check if already monitoring this server
      const existing = db.prepare(`
        SELECT id FROM monitored_servers 
        WHERE user_id = ? AND host = ? AND port = ?
      `).get(userId, host, port);

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Server already being monitored'
        });
      }

      // Insert new server
      const result = db.prepare(`
        INSERT INTO monitored_servers (
          user_id, host, port, version, status, 
          player_count, max_players, motd, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, host, port, version || null, 'unknown',
        playerCount || null, maxPlayers || null, motd || null,
        metadata ? JSON.stringify(metadata) : null
      );

      const server = db.prepare(`
        SELECT * FROM monitored_servers WHERE id = ?
      `).get(result.lastInsertRowid);

      res.json({
        success: true,
        server: {
          ...server,
          metadata: server.metadata ? JSON.parse(server.metadata) : null
        }
      });

    } catch (err) {
      console.error('Add server error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to add server'
      });
    }
  }

  /**
   * Update a monitored server
   * PUT /api/servers/:id
   * Body: { status?, version?, playerCount?, maxPlayers?, motd?, metadata? }
   */
  async updateServer(req, res) {
    try {
      const userId = req.user.id;
      const serverId = parseInt(req.params.id);
      const { status, version, playerCount, maxPlayers, motd, metadata } = req.body;

      // Verify ownership
      const server = db.prepare(`
        SELECT * FROM monitored_servers WHERE id = ? AND user_id = ?
      `).get(serverId, userId);

      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Server not found'
        });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }
      if (version !== undefined) {
        updates.push('version = ?');
        values.push(version);
      }
      if (playerCount !== undefined) {
        updates.push('player_count = ?');
        values.push(playerCount);
      }
      if (maxPlayers !== undefined) {
        updates.push('max_players = ?');
        values.push(maxPlayers);
      }
      if (motd !== undefined) {
        updates.push('motd = ?');
        values.push(motd);
      }
      if (metadata !== undefined) {
        updates.push('metadata = ?');
        values.push(JSON.stringify(metadata));
      }

      updates.push('last_checked = datetime("now")');
      values.push(serverId, userId);

      if (updates.length > 1) { // More than just last_checked
        db.prepare(`
          UPDATE monitored_servers 
          SET ${updates.join(', ')}
          WHERE id = ? AND user_id = ?
        `).run(...values);
      }

      const updated = db.prepare(`
        SELECT * FROM monitored_servers WHERE id = ?
      `).get(serverId);

      res.json({
        success: true,
        server: {
          ...updated,
          metadata: updated.metadata ? JSON.parse(updated.metadata) : null
        }
      });

    } catch (err) {
      console.error('Update server error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to update server'
      });
    }
  }

  /**
   * Delete a monitored server
   * DELETE /api/servers/:id
   */
  async deleteServer(req, res) {
    try {
      const userId = req.user.id;
      const serverId = parseInt(req.params.id);

      // Verify ownership
      const server = db.prepare(`
        SELECT * FROM monitored_servers WHERE id = ? AND user_id = ?
      `).get(serverId, userId);

      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Server not found'
        });
      }

      db.prepare(`
        DELETE FROM monitored_servers WHERE id = ? AND user_id = ?
      `).run(serverId, userId);

      res.json({
        success: true,
        message: 'Server removed from monitoring'
      });

    } catch (err) {
      console.error('Delete server error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete server'
      });
    }
  }

  /**
   * Get a single monitored server
   * GET /api/servers/:id
   */
  async getServer(req, res) {
    try {
      const userId = req.user.id;
      const serverId = parseInt(req.params.id);

      const server = db.prepare(`
        SELECT * FROM monitored_servers WHERE id = ? AND user_id = ?
      `).get(serverId, userId);

      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Server not found'
        });
      }

      res.json({
        success: true,
        server: {
          ...server,
          metadata: server.metadata ? JSON.parse(server.metadata) : null
        }
      });

    } catch (err) {
      console.error('Get server error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to get server'
      });
    }
  }
}

module.exports = new ServerController();
