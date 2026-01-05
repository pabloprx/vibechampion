<template>
  <div class="crt">
    <div class="scanline"></div>
    <div class="noise"></div>
    <div class="flicker"></div>

    <div class="screen">
      <header class="header">
        <div class="logo">
          <span class="logo-text">VIBE<span class="logo-accent">CHAMPION</span></span>
          <span class="logo-version">v1.0</span>
        </div>
        <div class="status">
          <span class="status-dot"></span>
          <span>ONLINE</span>
        </div>
      </header>

      <div class="grid">
        <!-- Install Panel -->
        <section class="panel install-panel">
          <div class="panel-header">
            <span class="comment">// install</span>
          </div>
          <div class="panel-content">
            <div class="terminal">
              <div class="terminal-line" @click="copyCommand(0)">
                <span class="prompt">&gt;</span>
                <code>claude plugin marketplace add pabloprx/vibechampion</code>
                <span class="cursor" v-if="copiedIndex !== 0">_</span>
                <span class="copied-badge" v-else>COPIED</span>
              </div>
              <div class="terminal-line" @click="copyCommand(1)">
                <span class="prompt">&gt;</span>
                <code>claude plugin install vibechampion@pabloprx-vibechampion</code>
                <span class="cursor" v-if="copiedIndex !== 1">_</span>
                <span class="copied-badge" v-else>COPIED</span>
              </div>
            </div>
            <p class="terminal-hint">
              <span class="blink">&gt;</span> then run <span class="highlight">/vibebattle</span>
            </p>
          </div>
        </section>

        <!-- Rankings Panel -->
        <section class="panel rankings-panel">
          <div class="panel-header">
            <span class="comment">// rankings</span>
            <div class="period-tabs">
              <button
                v-for="p in periods"
                :key="p.value"
                :class="{ active: period === p.value }"
                @click="period = p.value"
              >
                {{ p.label }}
              </button>
            </div>
          </div>
          <div class="panel-content">
            <div v-if="loading" class="loading-state">
              <span class="loading-bar"></span>
              <span class="loading-text">LOADING DATA...</span>
            </div>

            <div v-else-if="leaderboardData?.leaderboard?.length" class="rankings">
              <div class="rankings-body">
                <div
                  v-for="(entry, index) in leaderboardData.leaderboard"
                  :key="entry.name"
                  class="ranking-row"
                  :class="{ champion: index === 0, 'top-3': index < 3 }"
                >
                  <span class="col-rank">
                    <span v-if="index === 0" class="crown">&#9733;</span>
                    <span v-else>{{ entry.rank }}</span>
                  </span>
                  <span class="col-name">{{ entry.name }}</span>
                  <span class="col-stats">
                    <span class="tokens">{{ formatTokens(entry.total_tokens) }}</span>
                    <span class="cost">${{ entry.total_cost.toFixed(0) }}</span>
                  </span>
                </div>
              </div>
              <!-- Floating roasts -->
              <div class="floating-roasts" v-if="leaderboardData.leaderboard.length > 0">
                <div
                  v-for="(entry, index) in leaderboardData.leaderboard.slice(0, 3)"
                  :key="'roast-' + entry.name"
                  class="floating-roast"
                  :class="'roast-' + index"
                >
                  <span class="roast-arrow">&#8592;</span> {{ getRandomRoast(entry.name) }}
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <p class="glitch" data-text="NO DATA">NO DATA</p>
              <p class="empty-sub">be the first to join the battle</p>
            </div>
          </div>
          <div class="panel-footer">
            <span>{{ leaderboardData?.period || '---' }}</span>
            <span class="separator">|</span>
            <span>auto-sync on session end</span>
          </div>
        </section>
      </div>

      <footer class="footer">
        <a href="https://github.com/pabloprx/vibechampion" target="_blank">
          <span class="bracket">[</span>GITHUB<span class="bracket">]</span>
        </a>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface LeaderboardEntry {
  rank: number
  name: string
  total_tokens: number
  total_cost: number
  days_active: number
}

interface LeaderboardResponse {
  period: string
  leaderboard: LeaderboardEntry[]
}

const loading = ref(false)
const leaderboardData = ref<LeaderboardResponse | null>(null)
const period = ref('month')
const copiedIndex = ref<number | null>(null)

const periods = [
  { label: 'DAY', value: 'today' },
  { label: 'WEEK', value: 'week' },
  { label: 'MONTH', value: 'month' },
  { label: 'ALL', value: 'all' },
]

const commands = [
  'claude plugin marketplace add pabloprx/vibechampion',
  'claude plugin install vibechampion@pabloprx-vibechampion'
]

const roasts = [
  "doesn't actually code",
  "only touches grass when out of credits",
  "#1 CO2 emitter",
  "claude's landlord",
  "vibecoding ceo",
  "all vibes no code",
  "get a life lil bro",
  "anthropic's favorite customer",
  "ctrl+c ctrl+v specialist",
  "senior prompt engineer",
  "tokens go brrr",
  "claude's therapist",
  "professional yapper",
  "built different (dependent)",
  "rm -rf and let claude fix it",
  "stackoverflow is mass",
  "codes by vibes only",
  "chatgpt could never",
  "let him cook (he cant)",
]

const assignedRoasts = ref<Map<string, string>>(new Map())

function getRandomRoast(name: string): string {
  if (!assignedRoasts.value.has(name)) {
    const randomIndex = Math.floor(Math.random() * roasts.length)
    assignedRoasts.value.set(name, roasts[randomIndex])
  }
  return assignedRoasts.value.get(name)!
}

onMounted(() => {
  fetchLeaderboard()
})

async function fetchLeaderboard() {
  loading.value = true
  try {
    const res = await fetch(`/api/leaderboard?period=${period.value}`)
    leaderboardData.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch leaderboard:', e)
  } finally {
    loading.value = false
  }
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000_000) {
    return (tokens / 1_000_000_000).toFixed(1) + 'B'
  }
  if (tokens >= 1_000_000) {
    return (tokens / 1_000_000).toFixed(1) + 'M'
  }
  if (tokens >= 1_000) {
    return (tokens / 1_000).toFixed(1) + 'K'
  }
  return tokens.toString()
}

async function copyCommand(index: number) {
  try {
    await navigator.clipboard.writeText(commands[index])
    copiedIndex.value = index
    setTimeout(() => {
      copiedIndex.value = null
    }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

watch(period, () => {
  fetchLeaderboard()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Caveat:wght@500;600&display=swap');

:root {
  --bg: #0c0c0c;
  --panel: #141414;
  --border: #252525;
  --text: #e0e0e0;
  --text-dim: #666;
  --accent: #4ade80;
  --accent-soft: rgba(74, 222, 128, 0.1);
  --accent-glow: rgba(74, 222, 128, 0.25);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 15px;
  line-height: 1.6;
  min-height: 100vh;
}

/* CRT Effects - subtle */
.crt {
  position: relative;
  min-height: 100vh;
  background: var(--bg);
  overflow: hidden;
}

.crt::before {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.15) 100%);
  pointer-events: none;
  z-index: 100;
}

.scanline {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(to bottom, transparent, var(--accent-soft), transparent);
  animation: scanline 12s linear infinite;
  pointer-events: none;
  z-index: 101;
  opacity: 0.4;
}

@keyframes scanline {
  0% { top: -2px; }
  100% { top: 100%; }
}

.noise {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.015;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  z-index: 99;
}

.flicker {
  display: none;
}

.screen {
  position: relative;
  z-index: 1;
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 2rem;
  margin-bottom: 2rem;
}

.logo {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--text);
}

.logo-accent {
  color: var(--accent);
}

.logo-version {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--accent);
}

.status-dot {
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  flex: 1;
}

/* Panels */
.panel {
  background: var(--panel);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.rankings-panel {
  overflow: visible;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.comment {
  font-size: 0.9rem;
  color: var(--accent);
  letter-spacing: 1px;
}

.panel-content {
  flex: 1;
  padding: 1.25rem;
}

.panel-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--text-dim);
  display: flex;
  gap: 0.5rem;
}

.separator {
  opacity: 0.3;
}

/* Terminal */
.terminal {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.terminal-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--bg);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.terminal-line:hover {
  background: var(--accent-soft);
}

.prompt {
  color: var(--accent);
}

.terminal-line code {
  flex: 1;
  font-size: 0.8rem;
  color: var(--text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal-line:hover code {
  color: var(--text);
}

.cursor {
  color: var(--accent);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.copied-badge {
  font-size: 0.75rem;
  color: var(--accent);
  font-weight: 500;
}

.terminal-hint {
  margin-top: 1.25rem;
  font-size: 0.9rem;
  color: var(--text-dim);
}

.terminal-hint .blink {
  color: var(--accent);
  animation: blink 1s step-end infinite;
}

.highlight {
  color: var(--accent);
}

/* Period tabs */
.period-tabs {
  display: flex;
  gap: 0.25rem;
}

.period-tabs button {
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-family: inherit;
  font-size: 0.75rem;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.period-tabs button:hover {
  color: var(--text);
  background: var(--border);
}

.period-tabs button.active {
  color: var(--accent);
  background: var(--accent-soft);
}

/* Rankings */
.rankings {
  display: flex;
  flex-direction: column;
  position: relative;
}

.rankings-body {
  display: flex;
  flex-direction: column;
}

.ranking-row {
  display: grid;
  grid-template-columns: 2rem auto 1fr;
  gap: 0.75rem;
  padding: 1rem;
  font-size: 0.9rem;
  border-bottom: 1px solid var(--border);
  transition: all 0.15s ease;
  align-items: center;
}

.ranking-row:last-child {
  border-bottom: none;
}

.ranking-row:hover {
  background: var(--accent-soft);
}

.ranking-row.champion {
  background: var(--accent-soft);
}

.ranking-row.champion .col-name,
.ranking-row.champion .col-rank {
  color: var(--accent);
}

.ranking-row.top-3:not(.champion) .col-rank {
  color: var(--accent);
}

.col-rank {
  text-align: center;
  font-weight: 500;
}

.crown {
  color: var(--accent);
  font-size: 1rem;
}

.col-name {
  font-weight: 500;
}

.col-stats {
  display: flex;
  gap: 0.75rem;
  color: var(--text-dim);
  font-size: 0.8rem;
  justify-content: flex-end;
}

.col-stats .tokens {
  min-width: 4rem;
  text-align: right;
}

.col-stats .cost {
  min-width: 3rem;
  text-align: right;
}

/* Floating roasts - handwritten style */
.floating-roasts {
  position: absolute;
  right: -220px;
  top: 0;
  width: 200px;
  pointer-events: none;
}

.floating-roast {
  font-family: 'Caveat', cursive;
  font-size: 1.1rem;
  color: var(--accent);
  white-space: nowrap;
  transform: rotate(-2deg);
  padding: 0.5rem 0;
  opacity: 0.85;
}

.roast-0 {
  margin-top: 0.5rem;
  transform: rotate(-3deg);
}

.roast-1 {
  margin-top: 1.5rem;
  transform: rotate(1deg);
}

.roast-2 {
  margin-top: 1.5rem;
  transform: rotate(-2deg);
}

.roast-arrow {
  display: inline-block;
  margin-right: 0.25rem;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
}

.loading-bar {
  width: 120px;
  height: 2px;
  background: var(--border);
  position: relative;
  overflow: hidden;
  border-radius: 1px;
}

.loading-bar::after {
  content: '';
  position: absolute;
  left: -40%;
  width: 40%;
  height: 100%;
  background: var(--accent);
  animation: loading 1s ease-in-out infinite;
}

@keyframes loading {
  0% { left: -40%; }
  100% { left: 100%; }
}

.loading-text {
  font-size: 0.8rem;
  color: var(--text-dim);
  letter-spacing: 2px;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 0.75rem;
}

.glitch {
  font-size: 1.25rem;
  color: var(--accent);
  letter-spacing: 4px;
}

.empty-sub {
  font-size: 0.85rem;
  color: var(--text-dim);
}

/* Footer */
.footer {
  padding-top: 2rem;
  text-align: center;
}

.footer a {
  color: var(--text-dim);
  text-decoration: none;
  font-size: 0.85rem;
  letter-spacing: 1px;
  transition: all 0.2s ease;
}

.footer a:hover {
  color: var(--accent);
}

.bracket {
  color: var(--accent);
}

/* Mobile */
@media (max-width: 1100px) {
  .floating-roasts {
    display: none;
  }
}

@media (max-width: 800px) {
  .screen {
    padding: 1.5rem;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .terminal-line code {
    font-size: 0.7rem;
  }

  .ranking-row {
    font-size: 0.85rem;
  }
}
</style>
