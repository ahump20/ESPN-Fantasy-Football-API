const express = require('express');
const path = require('path');
const { Client } = require('./node');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory cache for API responses
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Cache middleware
function cacheMiddleware(duration) {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }

    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, { data: body, timestamp: Date.now() });
      res.sendResponse(body);
    };
    next();
  };
}

// Create ESPN client with configuration
function createClient(leagueId, espnS2 = null, SWID = null) {
  const config = { leagueId: parseInt(leagueId) };

  if (espnS2 && SWID) {
    config.espnS2 = espnS2;
    config.SWID = SWID;
  }

  return new Client(config);
}

// API Routes

// Get league information
app.get('/api/league/:leagueId/info', cacheMiddleware(CACHE_DURATION), async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { seasonId } = req.query;
    const { espnS2, SWID } = req.headers;

    if (!seasonId) {
      return res.status(400).json({ error: 'seasonId query parameter is required' });
    }

    const client = createClient(leagueId, espnS2, SWID);
    const leagueInfo = await client.getLeagueInfo({ seasonId: parseInt(seasonId) });

    res.json(leagueInfo);
  } catch (error) {
    console.error('Error fetching league info:', error);
    res.status(500).json({
      error: 'Failed to fetch league information',
      message: error.message
    });
  }
});

// Get teams for a specific week
app.get('/api/league/:leagueId/teams', cacheMiddleware(CACHE_DURATION), async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { seasonId, scoringPeriodId } = req.query;
    const { espnS2, SWID } = req.headers;

    if (!seasonId || !scoringPeriodId) {
      return res.status(400).json({
        error: 'seasonId and scoringPeriodId query parameters are required'
      });
    }

    const client = createClient(leagueId, espnS2, SWID);
    const teams = await client.getTeamsAtWeek({
      seasonId: parseInt(seasonId),
      scoringPeriodId: parseInt(scoringPeriodId)
    });

    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      error: 'Failed to fetch teams',
      message: error.message
    });
  }
});

// Get boxscores for a specific week
app.get('/api/league/:leagueId/boxscores', cacheMiddleware(CACHE_DURATION), async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { seasonId, matchupPeriodId, scoringPeriodId } = req.query;
    const { espnS2, SWID } = req.headers;

    if (!seasonId || !matchupPeriodId || !scoringPeriodId) {
      return res.status(400).json({
        error: 'seasonId, matchupPeriodId, and scoringPeriodId query parameters are required'
      });
    }

    const client = createClient(leagueId, espnS2, SWID);
    const boxscores = await client.getBoxscoreForWeek({
      seasonId: parseInt(seasonId),
      matchupPeriodId: parseInt(matchupPeriodId),
      scoringPeriodId: parseInt(scoringPeriodId)
    });

    res.json(boxscores);
  } catch (error) {
    console.error('Error fetching boxscores:', error);
    res.status(500).json({
      error: 'Failed to fetch boxscores',
      message: error.message
    });
  }
});

// Get free agents
app.get('/api/league/:leagueId/free-agents', cacheMiddleware(CACHE_DURATION), async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { seasonId, scoringPeriodId } = req.query;
    const { espnS2, SWID } = req.headers;

    if (!seasonId || !scoringPeriodId) {
      return res.status(400).json({
        error: 'seasonId and scoringPeriodId query parameters are required'
      });
    }

    const client = createClient(leagueId, espnS2, SWID);
    const freeAgents = await client.getFreeAgents({
      seasonId: parseInt(seasonId),
      scoringPeriodId: parseInt(scoringPeriodId)
    });

    res.json(freeAgents);
  } catch (error) {
    console.error('Error fetching free agents:', error);
    res.status(500).json({
      error: 'Failed to fetch free agents',
      message: error.message
    });
  }
});

// Get draft information
app.get('/api/league/:leagueId/draft', cacheMiddleware(CACHE_DURATION), async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { seasonId } = req.query;
    const { espnS2, SWID } = req.headers;

    if (!seasonId) {
      return res.status(400).json({ error: 'seasonId query parameter is required' });
    }

    const client = createClient(leagueId, espnS2, SWID);
    const draftInfo = await client.getDraftInfo({ seasonId: parseInt(seasonId) });

    res.json(draftInfo);
  } catch (error) {
    console.error('Error fetching draft info:', error);
    res.status(500).json({
      error: 'Failed to fetch draft information',
      message: error.message
    });
  }
});

// Get NFL games for a period
app.get('/api/nfl-games', cacheMiddleware(CACHE_DURATION), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required (format: YYYYMMDD)'
      });
    }

    // Use any league ID since this is a general NFL endpoint
    const client = new Client({ leagueId: 0 });
    const games = await client.getNFLGamesForPeriod({
      startDate,
      endDate
    });

    res.json(games);
  } catch (error) {
    console.error('Error fetching NFL games:', error);
    res.status(500).json({
      error: 'Failed to fetch NFL games',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Clear cache endpoint (useful for development)
app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared successfully' });
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  ESPN Fantasy Football API Server                        ║
║  Connected to BlazeSportsIntel.com                       ║
╚═══════════════════════════════════════════════════════════╝

Server running on: http://localhost:${PORT}
API Documentation: http://localhost:${PORT}/api/health

Available Endpoints:
  GET  /api/league/:leagueId/info
  GET  /api/league/:leagueId/teams
  GET  /api/league/:leagueId/boxscores
  GET  /api/league/:leagueId/free-agents
  GET  /api/league/:leagueId/draft
  GET  /api/nfl-games
  POST /api/cache/clear

Press Ctrl+C to stop the server
  `);
});

module.exports = app;
