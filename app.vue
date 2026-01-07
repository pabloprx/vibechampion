<template>
  <div class="crt">
    <div class="scanline"></div>
    <div class="noise"></div>
    <div class="flicker"></div>

    <div class="screen">
      <header class="header">
        <div class="logo">
          <span class="logo-text">VIBE<span class="logo-accent">CHAMPION</span></span>
          <span class="logo-version">v1.1</span>
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

            <!-- Update notice -->
            <div class="update-notice">
              <div class="update-header">
                <span class="update-badge">v1.1</span>
                <span class="update-title">new update available</span>
              </div>
              <p class="update-desc">now syncs on session start + end for better tracking</p>
              <div class="update-cmd" @click="copyCommand(2)">
                <span class="prompt">&gt;</span>
                <code>claude plugin update vibechampion@pabloprx-vibechampion</code>
                <span class="copied-badge" v-if="copiedIndex === 2">COPIED</span>
              </div>
              <p class="update-link">
                <a href="https://github.com/pabloprx/vibechampion" target="_blank">
                  view source on github <span class="arrow">&rarr;</span>
                </a>
              </p>
            </div>
          </div>
        </section>

        <!-- Rankings Panel -->
        <section class="panel rankings-panel">
          <div class="panel-header">
            <span class="comment">// rankings</span>
            <div class="filter-row">
              <div class="metric-tabs">
                <button
                  v-for="m in metrics"
                  :key="m.value"
                  :class="{ active: sortBy === m.value }"
                  @click="sortBy = m.value"
                >
                  {{ m.label }}
                </button>
              </div>
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
          </div>
          <div class="panel-content">
            <div v-if="loading" class="loading-state">
              <span class="loading-bar"></span>
              <span class="loading-text">LOADING DATA...</span>
            </div>

            <div v-else-if="leaderboardData?.leaderboard?.length" class="rankings">
              <div class="rankings-header">
                <span class="col-rank">#</span>
                <span class="col-name">USER</span>
                <span class="col-metric">{{ getMetricLabel() }}</span>
              </div>
              <div class="rankings-body">
                <div
                  v-for="(entry, index) in leaderboardData.leaderboard"
                  :key="entry.name"
                  class="ranking-row"
                  :class="{ champion: index === 0, 'top-3': index < 3 }"
                  @mouseenter="index === 0 && handleWinnerHover(true)"
                  @mouseleave="index === 0 && handleWinnerHover(false)"
                >
                  <span class="col-rank">
                    <span v-if="index === 0" class="crown">&#9733;</span>
                    <span v-else>{{ entry.rank }}</span>
                  </span>
                  <span class="col-name">{{ entry.name }}</span>
                  <span class="col-metric metric-value">{{ getMetricValue(entry) }}</span>
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
            <span>auto-sync on session start + end</span>
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
import { ref, watch, onMounted, onUnmounted } from 'vue'

const REFETCH_INTERVAL = 2 * 60 * 1000 // 2 minutes

interface LeaderboardEntry {
  rank: number
  name: string
  total_tokens: number
  output_tokens: number
  vibe_score: number
  total_cost: number
  days_active: number
}

interface LeaderboardResponse {
  period: string
  sortBy: string
  leaderboard: LeaderboardEntry[]
}

type SortMetric = 'vibe_score' | 'total_tokens' | 'output_tokens' | 'total_cost'

const loading = ref(false)
const leaderboardData = ref<LeaderboardResponse | null>(null)
const period = ref('month')
const sortBy = ref<SortMetric>('vibe_score')
const copiedIndex = ref<number | null>(null)
const hoveredWinner = ref(false)

const periods = [
  { label: 'DAY', value: 'today' },
  { label: 'WEEK', value: 'week' },
  { label: 'MONTH', value: 'month' },
  { label: 'ALL', value: 'all' },
]

const metrics = [
  { label: 'VIBE', value: 'vibe_score' as SortMetric },
  { label: 'TOKENS', value: 'total_tokens' as SortMetric },
  { label: 'OUTPUT', value: 'output_tokens' as SortMetric },
  { label: 'COST', value: 'total_cost' as SortMetric },
]

function getMetricValue(entry: LeaderboardEntry): string {
  switch (sortBy.value) {
    case 'vibe_score':
      return formatTokens(entry.vibe_score)
    case 'total_tokens':
      return formatTokens(entry.total_tokens)
    case 'output_tokens':
      return formatTokens(entry.output_tokens)
    case 'total_cost':
      return '$' + entry.total_cost.toFixed(0)
  }
}

function getMetricLabel(): string {
  return metrics.find(m => m.value === sortBy.value)?.label || 'VIBE'
}

const commands = [
  'claude plugin marketplace add pabloprx/vibechampion',
  'claude plugin install vibechampion@pabloprx-vibechampion',
  'claude plugin update vibechampion@pabloprx-vibechampion'
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

let refetchInterval: ReturnType<typeof setInterval> | null = null

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    fetchLeaderboard()
  }
}

onMounted(() => {
  fetchLeaderboard()
  loadConfetti()

  // Auto-refetch every 2 minutes
  refetchInterval = setInterval(fetchLeaderboard, REFETCH_INTERVAL)

  // Refetch on window focus
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (refetchInterval) {
    clearInterval(refetchInterval)
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

async function fetchLeaderboard() {
  loading.value = true
  try {
    const res = await fetch(`/api/leaderboard?period=${period.value}&sortBy=${sortBy.value}`)
    leaderboardData.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch leaderboard:', e)
  } finally {
    loading.value = false
  }
}

// Confetti for winner
let confettiInstance: any = null

async function loadConfetti() {
  if (typeof window !== 'undefined' && !confettiInstance) {
    const { default: confetti } = await import('canvas-confetti')
    confettiInstance = confetti
  }
}

function triggerConfetti() {
  if (!confettiInstance) return
  confettiInstance({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.3 },
    colors: ['#4ade80', '#22c55e', '#16a34a']
  })
}

function handleWinnerHover(isHovering: boolean) {
  hoveredWinner.value = isHovering
  if (isHovering) {
    triggerConfetti()
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

watch([period, sortBy], () => {
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

/* Grid - rankings panel is wider */
.grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
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

/* Update notice */
.update-notice {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--border);
}

.update-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.update-badge {
  background: var(--accent);
  color: var(--bg);
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

.update-title {
  font-size: 0.85rem;
  color: var(--text);
  font-weight: 500;
}

.update-desc {
  font-size: 0.8rem;
  color: var(--text-dim);
  margin-bottom: 0.75rem;
}

.update-cmd {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.75rem;
}

.update-cmd:hover {
  background: var(--accent-soft);
}

.update-cmd code {
  font-size: 0.75rem;
  color: var(--text-dim);
  flex: 1;
}

.update-cmd:hover code {
  color: var(--text);
}

.update-link {
  font-size: 0.75rem;
}

.update-link a {
  color: var(--text-dim);
  text-decoration: none;
  transition: color 0.2s ease;
}

.update-link a:hover {
  color: var(--accent);
}

.update-link .arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}

.update-link a:hover .arrow {
  transform: translateX(3px);
}

/* Filter row */
.filter-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Period tabs */
.period-tabs,
.metric-tabs {
  display: flex;
  gap: 0.25rem;
}

.period-tabs button,
.metric-tabs button {
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

.period-tabs button:hover,
.metric-tabs button:hover {
  color: var(--text);
  background: var(--border);
}

.period-tabs button.active,
.metric-tabs button.active {
  color: var(--accent);
  background: var(--accent-soft);
}

.metric-tabs {
  border-right: 1px solid var(--border);
  padding-right: 1rem;
}

/* Rankings */
.rankings {
  display: flex;
  flex-direction: column;
  position: relative;
}

.rankings-header {
  display: grid;
  grid-template-columns: 2.5rem 1fr auto;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  font-size: 0.7rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--border);
}

.rankings-header .col-metric {
  text-align: right;
  min-width: 5rem;
}

.rankings-body {
  display: flex;
  flex-direction: column;
}

.ranking-row {
  display: grid;
  grid-template-columns: 2.5rem 1fr auto;
  gap: 0.75rem;
  padding: 1rem;
  font-size: 0.95rem;
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
  font-size: 1.1rem;
}

.ranking-row.champion .col-name,
.ranking-row.champion .col-rank {
  color: var(--accent);
  font-weight: 600;
}

.ranking-row.champion .col-metric {
  color: var(--accent);
  font-weight: 600;
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
  font-size: 1.2rem;
}

.col-name {
  font-weight: 500;
}

.col-metric {
  text-align: right;
  min-width: 5rem;
  font-family: 'IBM Plex Mono', monospace;
}

.metric-value {
  color: var(--text-dim);
  font-size: 0.85rem;
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

@media (max-width: 900px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .filter-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .metric-tabs {
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.5rem;
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

  .ranking-row.champion {
    font-size: 0.95rem;
  }
}
</style>
