# /vibebattle - Claude Code usage leaderboard

Compare your Claude Code usage with your team.

## Config File
Config stored at: `~/.config/vibechampion/config.json`

```json
{
  "username": "your-name",
  "team": "TEAM-CODE",
  "visibility": "both",
  "server": "https://vibechampion.vercel.app",
  "acknowledged": true
}
```

Fields:
- `username`: Your display name on the leaderboard
- `team`: Team code (optional) - if set, shows team leaderboard by default
- `visibility`: Where your stats appear - "public", "team", or "both"
- `server`: API server URL
- `acknowledged`: User accepted data sharing

## Flow

### 1. Check if onboarded

Read `~/.config/vibechampion/config.json`. If it doesn't exist or `acknowledged` is false, run onboarding.

### 2. Onboarding (first time only)

Use AskUserQuestion to collect info. Ask all questions in ONE call with multiple questions:

**Question 1: "What's your battle name?"**
- Header: "Username"
- Options: Let them type custom input (use Other)
- This will appear on the leaderboard

**Question 2: "Team code (optional)"**
- Header: "Team"
- Options:
  - "Skip - global only"
  - "Enter code" (let them type)
- If they have a team code from a coworker, they enter it here
- If empty/skipped, they only appear on global leaderboard

**Question 3: "Where should your stats appear?"** (only if team code provided)
- Header: "Visibility"
- Options:
  - "Public + Team (Recommended)" - visible everywhere
  - "Team Only" - only teammates see your stats
  - "Public Only" - team can't see you (why join then?)

**Question 4: "VibeBattle tracks ONLY token counts (no code, no prompts). Continue?"**
- Header: "Privacy"
- Options: "Yes, let's battle" / "No thanks"

If they accept:
1. Create config directory: `mkdir -p ~/.config/vibechampion`
2. Write config file with username, team (if provided), visibility, server, acknowledged: true
3. If team code provided, join the team on server:
   ```bash
   curl -s -X POST "https://vibechampion.vercel.app/api/teams/{TEAM_CODE}/join" \
     -H "Content-Type: application/json" \
     -d '{"user_name": "{USERNAME}", "visibility": "{VISIBILITY}"}'
   ```
   - If team doesn't exist (404), tell user: "Team code not found. You can create it at vibechampion.vercel.app or ask your team lead for the correct code."
4. Continue to sync

If they decline: Exit with "No worries, your stats stay private."

### 3. Sync Team Membership (check if user joined team via web)

Before syncing stats, check if user's team membership changed on the server:

```bash
# Get user's teams from server
curl -s "https://vibechampion.vercel.app/api/users/{USERNAME}/teams"
```

Response:
```json
{
  "teams": [
    {"code": "MYCOMPANY", "name": "Acme Corp", "visibility": "both"}
  ]
}
```

If server returns a team but local config has no team (or different team):
- Update config.json with the team info from server
- This handles the case where user joined via web UI

If server returns no teams but local config has a team:
- User left via web UI, remove team from config.json

### 4. Sync Stats

Get stats from START OF CURRENT MONTH. Calculate the first day of current month in YYYYMMDD format.

```bash
# Get first day of current month (e.g., 20260101 for January 2026)
SINCE=$(date +%Y%m01)
npx --yes ccusage@latest daily --json --since $SINCE
```

Parse the JSON output. The format is:
```json
{
  "daily": [
    {
      "date": "2026-01-05",
      "inputTokens": 123,
      "outputTokens": 456,
      "cacheCreationTokens": 789,
      "cacheReadTokens": 1000,
      "totalTokens": 2368,
      "totalCost": 1.23,
      "modelsUsed": ["claude-opus-4-5-20251101"]
    }
  ]
}
```

### 5. Submit to Server

POST to `https://vibechampion.vercel.app/api/stats`:
```json
{
  "user": "{username}",
  "daily": [/* array from ccusage */]
}
```

Use curl:
```bash
curl -s -X POST https://vibechampion.vercel.app/api/stats \
  -H "Content-Type: application/json" \
  -d '{"user": "NAME", "daily": [...]}'
```

### 6. Get Leaderboard

Build the URL based on config:
- Base: `https://vibechampion.vercel.app/api/leaderboard`
- Add period: `?period=month` (or week, semester, year, all)
- If team in config AND not using `/vibebattle global`: add `&team={TEAM_CODE}`

Examples:
```bash
# Global monthly (no team or /vibebattle global)
GET https://vibechampion.vercel.app/api/leaderboard?period=month

# Team monthly (team in config)
GET https://vibechampion.vercel.app/api/leaderboard?period=month&team=MYCOMPANY
```

Available periods: `today`, `week`, `month`, `semester`, `year`, `all`

### 7. Display Results

Format the leaderboard nicely. Include team name if showing team leaderboard:

```
VIBE CHAMPION - January 2026
Team: Acme Corp
=============================

 #  | Name           | Archetype  | Tokens (M) | Cost ($)
----|----------------|------------|------------|----------
 1  | pablo          | Vibe Coder |     318.3  |   348.17
 2  | diego          | Architect  |     180.5  |   198.00
 3  | carlos         | Thinker    |      95.2  |   102.30

Your rank: #1 / 3

Stats synced! View full leaderboard: vibechampion.vercel.app/?team=MYCOMPANY
```

Notes:
- Show tokens in millions (divide by 1,000,000, format to 1 decimal)
- Include archetype from API response (vibe-coder, architect, thinker, grinder, sniper)
- If team leaderboard, include shareable URL at the bottom
- "Team: {name}" line only shown when viewing team leaderboard

## Error Handling

- If server unreachable: "VibeBattle server is temporarily unavailable. Try again later."
- If ccusage fails: "Could not get stats. Make sure Claude Code has been used recently."
- If no stats: "No usage data found for this month."

## Arguments

Handle these BEFORE doing anything else:

### Control Commands (no sync)

- `/vibebattle pause` - Set `"paused": true` in config. Say "Auto-sync paused. Run /vibebattle resume to re-enable."
- `/vibebattle resume` - Remove `paused` from config. Say "Auto-sync resumed."
- `/vibebattle reset` - Delete config file. Re-run onboarding next time.
- `/vibebattle status` - Show current config (username, team, visibility, paused state)

### Team Commands

- `/vibebattle join CODE` - Join a team:
  1. Ask visibility: "Public + Team" / "Team Only" / "Public Only"
  2. Call API: `POST /api/teams/{CODE}/join` with user_name and visibility
  3. If 404: "Team not found. Check the code or create it at vibechampion.vercel.app"
  4. If success: Update config.json with team and visibility
  5. Say "Joined team {NAME}! Your stats will appear on the team leaderboard."

- `/vibebattle leave-team` - Leave current team:
  1. If no team in config: "You're not in a team."
  2. Call API: `POST /api/teams/{CODE}/leave` with user_name
  3. Remove team and visibility from config.json
  4. Say "Left team. Your stats will only appear on the global leaderboard."

- `/vibebattle team` - Show team leaderboard (if in a team)

### Leaderboard Commands (sync first)

- `/vibebattle` - Sync stats and show leaderboard (team if configured, otherwise global monthly)
- `/vibebattle global` - Show global leaderboard (ignores team setting)
- `/vibebattle week` - Show weekly leaderboard
- `/vibebattle semester` - Show semester leaderboard
- `/vibebattle year` - Show yearly leaderboard
- `/vibebattle all` - Show all-time leaderboard

$ARGUMENTS
