# VibeBattle

Track and compare Claude Code usage with your team. Monthly leaderboard for token consumption.

## Install Plugin

```bash
claude plugin marketplace add pabloprx/vibechampion
claude plugin install vibechampion@pabloprx-vibechampion
```

## Usage

```bash
/vibebattle          # Sync stats and show monthly leaderboard
/vibebattle week     # Weekly leaderboard
/vibebattle semester # Semester leaderboard
/vibebattle year     # Yearly leaderboard
/vibebattle all      # All-time leaderboard
```

### Control Commands

```bash
/vibebattle pause    # Disable auto-sync on session end
/vibebattle resume   # Re-enable auto-sync
/vibebattle reset    # Clear config and re-onboard
/vibebattle status   # Show current config
```

## How It Works

1. First run prompts for your battle name
2. Stats sync automatically when Claude Code sessions end
3. Only token counts are tracked - no code or prompts

## Privacy

- Tracks: token usage, cost, models used
- Does NOT track: code, prompts, file contents, conversation history

Data sent to: https://vibechampion.vercel.app
