const shodanClient = require('shodan-client');
const https = require('https');

class ShodanController {
  constructor() {
    this.apiKey = process.env.SHODAN_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️ SHODAN_API_KEY not set in environment variables');
    }
  }

  /**
   * Search Shodan for Minecraft servers by version/query
   * GET /api/shodan/search?query=minecraft&version=1.21
   */
  async search(req, res) {
    try {
      if (!this.apiKey) {
        return res.status(503).json({
          success: false,
          error: 'Shodan API key not configured'
        });
      }

      const { query = 'minecraft', version, page = 1, facets, minify } = req.query;
      
      // Build Shodan query
      let shodanQuery = 'product:minecraft';
      if (version) {
        shodanQuery += ` version:${version}`;
      }
      if (query && query !== 'minecraft') {
        shodanQuery += ` ${query}`;
      }

      console.log(`🔍 Shodan search: "${shodanQuery}" (page ${page})`);

      // shodan-client usage: search(query, apiKey, options)
      const searchOpts = {
        page: parseInt(page, 10) || 1,
        ...(facets ? { facets } : {}),
        ...(minify !== undefined ? { minify: String(minify).toLowerCase() === 'true' } : {}),
      };

      const searchResults = await shodanClient.search(shodanQuery, this.apiKey, searchOpts);

      // Parse and format results
      const servers = searchResults.matches.map(match => {
        // Extract Minecraft-specific data from match
        const minecraftData = match.data || '';
        const lines = minecraftData.split('\n');
        
        let motd = '';
        let playerCount = null;
        let maxPlayers = null;
        let detectedVersion = version || match.version || 'unknown';

        // Try to parse MOTD and player info from response
        for (const line of lines) {
          if (line.includes('description') || line.includes('motd')) {
            motd = line.replace(/.*(?:description|motd).*?:?\s*["']?(.*?)["']?\s*$/i, '$1').trim();
          }
          if (line.includes('players')) {
            const playersMatch = line.match(/(\d+)\s*\/\s*(\d+)/);
            if (playersMatch) {
              playerCount = parseInt(playersMatch[1]);
              maxPlayers = parseInt(playersMatch[2]);
            }
          }
          if (line.includes('version') && !version) {
            const versionMatch = line.match(/version.*?([0-9.]+)/i);
            if (versionMatch) {
              detectedVersion = versionMatch[1];
            }
          }
        }

        return {
          host: match.ip_str,
          port: match.port || 25565,
          version: detectedVersion,
          motd: motd || 'No MOTD',
          playerCount,
          maxPlayers,
          country: match.location?.country_name || 'Unknown',
          countryCode: match.location?.country_code || '??',
          org: match.org || 'Unknown',
          lastUpdate: match.timestamp || new Date().toISOString(),
          raw: match.data
        };
      });

      res.json({
        success: true,
        total: searchResults.total || servers.length,
        page: parseInt(page),
        servers
      });

    } catch (err) {
      console.error('Shodan search error:', err);
      
      // Handle specific Shodan errors
      if (err.message?.includes('Invalid API key')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid Shodan API key'
        });
      }
      
      if (err.message?.includes('query credits')) {
        return res.status(429).json({
          success: false,
          error: 'Shodan API query credits exhausted'
        });
      }

      res.status(500).json({
        success: false,
        error: err.message || 'Failed to search Shodan'
      });
    }
  }

  /**
   * Get API info/credits remaining
   * GET /api/shodan/info
   */
  async info(req, res) {
    try {
      if (!this.apiKey) {
        return res.status(503).json({
          success: false,
          error: 'Shodan API key not configured'
        });
      }

      // Use Shodan REST API directly for reliable account info
      const url = `https://api.shodan.io/api-info?key=${encodeURIComponent(this.apiKey)}`;
      https.get(url, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            const json = JSON.parse(data);
            // json.usage limits may vary by plan; pass-through
            res.json({
              success: true,
              credits: json.credits_left ?? json.credits ?? 0,
              plan: json.plan ?? 'unknown',
              usage: json
            });
          } catch (e) {
            console.error('Failed to parse Shodan info response:', e);
            res.status(502).json({ success: false, error: 'Invalid response from Shodan' });
          }
        });
      }).on('error', (err) => {
        console.error('Shodan info request error:', err);
        res.status(500).json({ success: false, error: err.message || 'Failed to get Shodan info' });
      });

    } catch (err) {
      console.error('Shodan info error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to get Shodan info'
      });
    }
  }
}

module.exports = new ShodanController();
