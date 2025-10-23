# BlazeSportsIntel - Web Integration Guide

This guide explains how to use the ESPN Fantasy Football API with the BlazeSportsIntel web interface.

## Overview

The web integration consists of:
- **Backend API Server** (`server.js`) - Express server that provides REST API endpoints
- **Frontend Interface** (`public/` directory) - HTML/CSS/JavaScript dashboard for viewing fantasy football data
- **In-memory Caching** - Improves performance by caching API responses for 10 minutes

## Quick Start

### 1. Install Dependencies

First, make sure you have the required npm packages installed:

```bash
npm install
```

This will install:
- `express` - Web server framework
- `axios` - HTTP client for ESPN API calls
- `lodash` - Utility functions
- All existing development dependencies

### 2. Build the Project

Build the ESPN Fantasy Football API library:

```bash
npm run build
```

This compiles the source code into the distributable `node.js` file that the server uses.

### 3. Start the Web Server

You have two options:

**Option A: Production mode** (builds first, then starts)
```bash
npm start
# or
npm run web
```

**Option B: Development mode** (starts immediately without building)
```bash
npm run start:dev
```

The server will start on port 3000 (or the port specified in your `.env` file).

### 4. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

## Using the Dashboard

### Public Leagues

1. Enter your **League ID** (found in your ESPN league URL)
2. Enter the **Season Year** (e.g., 2024)
3. Enter the **Week Number** (1-18)
4. Click **"Load League Data"**

### Private Leagues

For private leagues, you need ESPN authentication cookies:

1. Check the **"Private League"** checkbox
2. Open your browser's Developer Tools (F12)
3. Go to: **Application > Cookies > espn.com**
4. Copy the values for:
   - `espn_s2` cookie
   - `SWID` cookie
5. Paste them into the form
6. Click **"Load League Data"**

**Note**: Private league support only works with the Node.js backend (not browser-only).

## Available Features

### 1. League Info Tab
- League name and basic settings
- Current season and week
- Number of teams
- League configuration

### 2. Standings Tab
- Team rankings sorted by wins
- Win-Loss records
- Points For (PF) and Points Against (PA)
- Current streaks

### 3. Weekly Matchups Tab
- All matchups for the selected week
- Scores for home and away teams
- Winner highlighted in green

### 4. Free Agents Tab
- Top 50 available players
- Filter by position (QB, RB, WR, TE, K, D/ST)
- Projected points and current season points
- Injury status indicators

### 5. Draft Results Tab
- Complete draft history (up to 100 picks)
- Pick number, round, and team
- Player information

## API Endpoints

The backend server provides the following REST API endpoints:

### League Information
```
GET /api/league/:leagueId/info?seasonId=2024
```

### Team Standings
```
GET /api/league/:leagueId/teams?seasonId=2024&scoringPeriodId=8
```

### Weekly Matchups
```
GET /api/league/:leagueId/boxscores?seasonId=2024&matchupPeriodId=8&scoringPeriodId=8
```

### Free Agents
```
GET /api/league/:leagueId/free-agents?seasonId=2024&scoringPeriodId=8
```

### Draft Information
```
GET /api/league/:leagueId/draft?seasonId=2024
```

### NFL Games
```
GET /api/nfl-games?startDate=20240901&endDate=20240908
```

### Health Check
```
GET /api/health
```

### Clear Cache
```
POST /api/cache/clear
```

## Private League Authentication

For private leagues, include ESPN cookies as headers:

```javascript
fetch('/api/league/12345/teams?seasonId=2024&scoringPeriodId=8', {
  headers: {
    'espnS2': 'YOUR_ESPN_S2_COOKIE',
    'SWID': 'YOUR_SWID_COOKIE'
  }
})
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
# Server Configuration
PORT=3000

# ESPN Private League Cookies (optional - for testing)
ESPN_S2=your_espn_s2_cookie_here
SWID=your_swid_cookie_here

# Example League Configuration
DEFAULT_LEAGUE_ID=387659
DEFAULT_SEASON=2024
```

### Cache Configuration

The server caches API responses for **10 minutes** by default. You can modify this in `server.js`:

```javascript
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can change it:

**Option 1: Environment variable**
```bash
PORT=3001 npm start
```

**Option 2: .env file**
```env
PORT=3001
```

### "Failed to fetch league information"

**Possible causes:**
1. Invalid League ID
2. League doesn't exist for the specified season
3. Private league requires cookies
4. ESPN API is temporarily unavailable

### Private League Not Working

Make sure:
1. You're using the Node.js backend (not browser-only)
2. Cookies are copied correctly (including `{` and `}` characters in SWID)
3. Cookies haven't expired (ESPN cookies last about 2 years)
4. Your ESPN account has access to the league

### Data Not Loading

1. Check browser console for errors (F12)
2. Verify the server is running
3. Clear cache: `POST /api/cache/clear`
4. Try a different week or season

## File Structure

```
ESPN-Fantasy-Football-API/
├── server.js              # Express backend API server
├── public/                # Frontend files
│   ├── index.html        # Main dashboard HTML
│   ├── styles.css        # Dashboard styling
│   └── app.js            # Frontend JavaScript logic
├── .env.example          # Environment configuration template
├── WEB_INTEGRATION.md    # This file
└── package.json          # Updated with Express dependency
```

## Customization

### Changing Colors/Theme

Edit `public/styles.css` and modify the CSS variables:

```css
:root {
    --primary-color: #ff6b35;      /* Main accent color */
    --secondary-color: #004e89;     /* Secondary accent */
    --success-color: #2ecc71;       /* Success/winner color */
    --danger-color: #e74c3c;        /* Error/danger color */
    --dark-bg: #1a1a2e;            /* Main background */
    --card-bg: #16213e;            /* Card backgrounds */
}
```

### Adding New Endpoints

Add new endpoints in `server.js`:

```javascript
app.get('/api/your-endpoint', async (req, res) => {
  try {
    const client = createClient(leagueId, espnS2, SWID);
    const data = await client.yourMethod();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Adding New Dashboard Features

1. Add HTML in `public/index.html`
2. Add styling in `public/styles.css`
3. Add logic in `public/app.js` to fetch and display data

## Production Deployment

### Deploy to Heroku

1. Create a `Procfile`:
```
web: npm start
```

2. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

### Deploy to AWS/Azure/DigitalOcean

1. Build the project: `npm run build`
2. Upload all files to your server
3. Install dependencies: `npm install --production`
4. Start with PM2: `pm2 start server.js`
5. Set up reverse proxy (nginx) for production

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t espn-fantasy-api .
docker run -p 3000:3000 espn-fantasy-api
```

## Security Considerations

1. **Never commit cookies or .env files** - Add them to `.gitignore`
2. **Use HTTPS in production** - Encrypt cookie transmission
3. **Rate limiting** - Consider adding rate limiting middleware
4. **Input validation** - Validate all user inputs
5. **Secure cookies storage** - Encrypt cookies if storing in database

## Support

For issues related to:
- **ESPN API**: Check [ESPN Fantasy Football API Issues](https://github.com/mkreiser/ESPN-Fantasy-Football-API/issues)
- **Web Integration**: Review this documentation or create an issue
- **ESPN's API changes**: ESPN may change their API without notice

## License

This web integration is part of the ESPN Fantasy Football API project and is licensed under LGPL-3.0.

---

**Powered by ESPN Fantasy Football API**
BlazeSportsIntel &copy; 2024
