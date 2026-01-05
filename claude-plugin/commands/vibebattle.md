# /vibebattle - Claude Code usage leaderboard

Compare your Claude Code usage with your team.

## Config File
Config stored at: `~/.config/vibechampion/config.json`

```json
{
  "username": "your-name",
  "server": "https://vibechampion.vercel.app",
  "acknowledged": true
}
```

## Flow

### 1. Check if onboarded

Read `~/.config/vibechampion/config.json`. If it doesn't exist or `acknowledged` is false, run onboarding.

### 2. Onboarding (first time only)

Use AskUserQuestion to ask:

**Question 1:** "Enter your battle name (will appear on leaderboard)"
- Let them type custom input

**Question 2:** "VibeBattle tracks ONLY token usage (no code, no prompts). This data is sent to the team server. Continue?"
- Options: "Yes, let's battle" / "No, cancel"

If they accept:
1. Create config directory: `mkdir -p ~/.config/vibechampion`
2. Write config file with their username, server `https://vibechampion.vercel.app`, and `acknowledged: true`
3. Continue to sync

If they decline: Exit with "No worries, your stats stay private."

### 3. Sync Stats (ALWAYS re-sync when /vibebattle runs)

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

### 4. Submit to Server

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

### 5. Get Leaderboard

GET `https://vibechampion.vercel.app/api/leaderboard?period=month`

Available periods: `today`, `week`, `month`, `semester`, `year`, `all`

### 6. Display Results

Format the leaderboard nicely:

```
VIBE CHAMPION - January 2026
=============================

 #  | Name           | Tokens (M) | Cost ($) | Days
----|----------------|------------|----------|------
 1  | pablo          |     318.3  |   348.17 |    7
 2  | diego          |     180.5  |   198.00 |    5
 3  | carlos         |      95.2  |   102.30 |    4

Your rank: #1 / 3

Stats synced!
```

Show tokens in millions (divide by 1,000,000 and format to 1 decimal).

## Error Handling

- If server unreachable: "VibeBattle server is temporarily unavailable. Try again later."
- If ccusage fails: "Could not get stats. Make sure Claude Code has been used recently."
- If no stats: "No usage data found for this month."

## Arguments

Handle these BEFORE doing anything else:

- `/vibebattle pause` - Set `"paused": true` in config. Say "Auto-sync paused. Run /vibebattle resume to re-enable."
- `/vibebattle resume` - Remove `paused` from config. Say "Auto-sync resumed."
- `/vibebattle reset` - Delete config file. Re-run onboarding.
- `/vibebattle status` - Show current config (username, server, paused state)

If not a control command, proceed with sync:

- `/vibebattle` - Sync stats and show monthly leaderboard
- `/vibebattle week` - Show weekly leaderboard
- `/vibebattle semester` - Show semester leaderboard
- `/vibebattle year` - Show yearly leaderboard
- `/vibebattle all` - Show all-time leaderboard

$ARGUMENTS
