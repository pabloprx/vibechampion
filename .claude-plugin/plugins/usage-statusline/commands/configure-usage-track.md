# /configure-usage-track - Claude platform usage in statusline

Display your Claude.ai platform usage (5-hour and 7-day limits) directly in Claude Code's statusline.

## What it shows

- `5h:12% 3:39` - 5-hour usage percentage + time until reset
- `7d:6%` - 7-day usage percentage
- Colors: red >80%, yellow >50%

## Config Files

**Credentials:** `~/.claude/usage-config.json`
```json
{
  "orgId": "your-org-uuid",
  "sessionKey": "sk-ant-sid01-..."
}
```

**Statusline script:** `~/.claude/statusline-command.sh`
**Fetch script:** `~/.claude/fetch-usage.js`

## Flow

### 1. Check existing setup

Read `~/.claude/settings.json` and check if `statusLine` is configured.

### 2. Get credentials

Use AskUserQuestion with ONE call containing both questions. Tell user to paste in the text field:

**Question 1: "Organization ID? (type/paste in text field - find at https://claude.ai/settings/account)"**
- Header: "Org ID"
- Options:
  - Label: "Where do I find this?", Description: "Go to claude.ai/settings/account and copy the UUID"
  - Label: "Skip", Description: "Cancel setup"

**Question 2: "sessionKey cookie? (type/paste in text field)"**
- Header: "Session Key"
- Options:
  - Label: "Where do I find this?", Description: "DevTools (F12) > Application > Cookies > claude.ai > sessionKey"
  - Label: "Skip", Description: "Cancel setup"

IMPORTANT: The user will paste their values in the "Other" text field. If they select "Skip", abort the setup.

After user provides values, validate by testing the API:
```bash
bun -e "
const r = await fetch('https://claude.ai/api/organizations/ORG_ID/usage', {
  headers: { 'Cookie': 'sessionKey=SESSION_KEY', 'anthropic-client-platform': 'web_claude_ai' }
});
console.log(r.ok ? 'OK' : 'FAIL');
"
```

If FAIL: Tell user credentials are invalid and ask again.

### 3. Check statusline status

Read `~/.claude/settings.json`. Check `statusLine` field:

**If statusLine exists:**
Use AskUserQuestion:
- Question: "You already have a custom statusline. How should we add usage tracking?"
- Header: "Statusline"
- Options:
  - "Add to existing (Recommended)" - inject usage into current script
  - "Replace entirely" - overwrite with usage-focused statusline
  - "Skip statusline" - only save credentials, user will integrate manually

**If no statusLine:**
Use AskUserQuestion:
- Question: "What indicators do you want in your statusline?"
- Header: "Indicators"
- multiSelect: true
- Options:
  - "Usage tracking (5h/7d)" - always included
  - "Session timer" - time since session start
  - "Context window %" - current context usage
  - "Git branch" - current branch name

### 4. Create fetch script

Write `~/.claude/fetch-usage.js`:

```javascript
#!/usr/bin/env bun
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.env.HOME, '.claude/usage-config.json');
const CACHE_PATH = '/tmp/claude_usage_cache.json';
const CACHE_TTL_MS = 60000;

async function fetchUsage(orgId, sessionKey) {
  const url = `https://claude.ai/api/organizations/${orgId}/usage`;
  const response = await fetch(url, {
    headers: {
      'accept': '*/*',
      'content-type': 'application/json',
      'anthropic-client-platform': 'web_claude_ai',
      'Cookie': `sessionKey=${sessionKey}`
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  if (text.includes('<!DOCTYPE html>')) throw new Error('AUTH_FAILED');
  return JSON.parse(text);
}

function formatOutput(usage) {
  const result = { fiveHour: null, sevenDay: null };
  if (usage.five_hour) {
    const pct = usage.five_hour.utilization || 0;
    let remaining = '';
    if (usage.five_hour.resets_at) {
      const diffMs = new Date(usage.five_hour.resets_at).getTime() - Date.now();
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        remaining = `${hours}:${String(mins).padStart(2, '0')}`;
      } else {
        remaining = '0:00';
      }
    }
    result.fiveHour = { pct, remaining };
  }
  if (usage.seven_day) {
    result.sevenDay = { pct: usage.seven_day.utilization || 0 };
  }
  return result;
}

async function main() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      if (Date.now() - cache.timestamp < CACHE_TTL_MS) {
        console.log(JSON.stringify(cache.data));
        return;
      }
    }
  } catch {}

  if (!fs.existsSync(CONFIG_PATH)) {
    console.log(JSON.stringify({ error: 'NO_CONFIG' }));
    return;
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (!config.sessionKey || !config.orgId) {
    console.log(JSON.stringify({ error: 'MISSING_CREDS' }));
    return;
  }

  try {
    const usage = await fetchUsage(config.orgId, config.sessionKey);
    const formatted = formatOutput(usage);
    fs.writeFileSync(CACHE_PATH, JSON.stringify({ timestamp: Date.now(), data: formatted }));
    console.log(JSON.stringify(formatted));
  } catch (err) {
    console.log(JSON.stringify({ error: err.message }));
  }
}

main();
```

### 5. Create or update statusline script

Based on user choice, either:

**A. Add to existing:** Read current script, inject usage fetch + display logic before final printf

**B. Replace/New:** Create `~/.claude/statusline-command.sh`:

```bash
#!/bin/bash
input=$(cat)
cid=$(echo "$input" | jq -r '.session_id // "default"')

# Session timer (if selected)
sf="/tmp/claude_session_$cid"
[ ! -f "$sf" ] && date +%s > "$sf"
st=$(cat "$sf"); now=$(date +%s); e=$((now-st))
h=$((e/3600)); m=$(((e%3600)/60)); s=$((e%60))
if [ $h -gt 0 ]; then timer="${h}h ${m}m"
elif [ $m -gt 0 ]; then timer="${m}m ${s}s"
else timer="${s}s"; fi

# Context window (if selected)
usage=$(echo "$input" | jq '.context_window.current_usage')
if [ "$usage" != "null" ]; then
  current=$(echo "$usage" | jq '.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens')
  size=$(echo "$input" | jq '.context_window.context_window_size')
  ctx_pct=$((current * 100 / size))
  if [ $ctx_pct -gt 50 ]; then ctx_str="\033[31mctx:${ctx_pct}%\033[0m"
  elif [ $ctx_pct -gt 40 ]; then ctx_str="\033[33mctx:${ctx_pct}%\033[0m"
  else ctx_str="ctx:${ctx_pct}%"; fi
else ctx_str="ctx:0%"; fi

# Git branch (if selected)
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

# Platform usage
pu=$(bun ~/.claude/fetch-usage.js 2>/dev/null)
five_hour=""; seven_day=""
if [ -n "$pu" ]; then
  err=$(echo "$pu" | jq -r '.error // empty')
  if [ -z "$err" ]; then
    fp=$(echo "$pu" | jq -r '.fiveHour.pct // empty')
    fr=$(echo "$pu" | jq -r '.fiveHour.remaining // empty')
    if [ -n "$fp" ]; then
      if [ "$fp" -gt 80 ]; then five_hour="\033[31m5h:${fp}% ${fr}\033[0m"
      elif [ "$fp" -gt 50 ]; then five_hour="\033[33m5h:${fp}% ${fr}\033[0m"
      else five_hour="5h:${fp}% ${fr}"; fi
    fi
    sp=$(echo "$pu" | jq -r '.sevenDay.pct // empty')
    if [ -n "$sp" ]; then
      if [ "$sp" -gt 80 ]; then seven_day="\033[31m7d:${sp}%\033[0m"
      elif [ "$sp" -gt 50 ]; then seven_day="\033[33m7d:${sp}%\033[0m"
      else seven_day="7d:${sp}%"; fi
    fi
  else
    five_hour="\033[31m5h:ERR\033[0m"
    seven_day="\033[31m7d:ERR\033[0m"
  fi
fi

# Build output based on selected indicators
# This is dynamically generated based on user selections
```

The script must be dynamically generated based on user's indicator choices. Build the final printf statement with only the selected indicators.

### 6. Update settings.json

Read `~/.claude/settings.json`, update the `statusLine` field:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-command.sh"
  }
}
```

Write back the updated settings.json (preserve all other fields).

### 7. Save credentials

Write `~/.claude/usage-config.json`:
```json
{
  "orgId": "USER_ORG_ID",
  "sessionKey": "USER_SESSION_KEY"
}
```

### 8. Confirm

Tell user:
```
Usage tracking configured!

Your statusline now shows:
- 5h: X% H:MM (5-hour usage + reset time)
- 7d: Y% (7-day usage)

Credentials saved to ~/.claude/usage-config.json
If auth fails, run /configure-usage-track update-key to refresh sessionKey.

Restart Claude Code to see changes.

Want more? Ask me to tune your statusline - I can add RAM usage, git branch, custom emojis, and more!
```

## Error Handling

- If bun not installed: "This feature requires Bun. Install with: curl -fsSL https://bun.sh/install | bash"
- If credentials invalid: Ask user to re-enter
- If statusline update fails: Show manual instructions

## Subcommands

- `/configure-usage-track` - Run setup wizard
- `/configure-usage-track update-key` - Update sessionKey only (for when it expires)
- `/configure-usage-track status` - Show current config and test connection

### update-key flow

1. Ask for new sessionKey using AskUserQuestion
2. Test it against the API
3. Update ~/.claude/usage-config.json
4. Say "SessionKey updated!"

### status flow

1. Read ~/.claude/usage-config.json
2. Test API connection
3. Show: orgId (masked), sessionKey (masked), connection status (OK/FAIL)
4. If FAIL: "Your sessionKey may be expired. Run /configure-usage-track update-key"

$ARGUMENTS
