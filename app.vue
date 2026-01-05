<template>
  <div style="font-family: monospace; padding: 2rem; max-width: 800px; margin: 0 auto;">
    <h1>ViBE CHAMPiON</h1>
    <p>API-only server for tracking Claude Code usage battles.</p>
    <h2>Endpoints:</h2>
    <ul>
      <li><code>POST /api/stats</code> - Submit daily stats</li>
      <li><code>GET /api/leaderboard?days=7</code> - Get leaderboard</li>
      <li><code>GET /api/users</code> - List all users</li>
      <li><code>GET /api/users/:name?days=7</code> - Get user stats</li>
    </ul>
    <h2>Usage:</h2>
    <pre>
# Submit stats (from ccusage)
curl -X POST http://localhost:3000/api/stats \
  -H "Content-Type: application/json" \
  -d '{"user": "pablo", "daily": [...]}'

# Get leaderboard
curl http://localhost:3000/api/leaderboard
    </pre>
  </div>
</template>
