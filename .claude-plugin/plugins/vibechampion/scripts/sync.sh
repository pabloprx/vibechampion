#!/bin/bash
# VibeBattle auto-sync script
# Runs on session end to sync stats

CONFIG_FILE="$HOME/.config/vibechampion/config.json"
SERVER="https://vibechampion.vercel.app"

# Check if config exists and user is onboarded
if [ ! -f "$CONFIG_FILE" ]; then
  exit 0
fi

# Check if paused
if grep -q '"paused": true' "$CONFIG_FILE" 2>/dev/null; then
  exit 0
fi

# Get username
USERNAME=$(grep -o '"username": *"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
if [ -z "$USERNAME" ]; then
  exit 0
fi

# Get stats for current month
SINCE=$(date +%Y%m01)
STATS=$(npx --yes ccusage@latest daily --json --since "$SINCE" 2>/dev/null)

if [ -z "$STATS" ]; then
  exit 0
fi

# Extract daily array
DAILY=$(echo "$STATS" | jq -c '.daily')

if [ "$DAILY" = "[]" ] || [ -z "$DAILY" ]; then
  exit 0
fi

# Submit to server (silent)
curl -s -X POST "$SERVER/api/stats" \
  -H "Content-Type: application/json" \
  -d "{\"user\": \"$USERNAME\", \"daily\": $DAILY}" > /dev/null 2>&1

exit 0
