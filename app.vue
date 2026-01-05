<template>
  <div class="container">
    <div class="noise"></div>
    <div class="scanlines"></div>

    <main class="content">
      <header class="hero">
        <pre class="ascii-art">
██╗   ██╗██╗██████╗ ███████╗
██║   ██║██║██╔══██╗██╔════╝
██║   ██║██║██████╔╝█████╗
╚██╗ ██╔╝██║██╔══██╗██╔══╝
 ╚████╔╝ ██║██████╔╝███████╗
  ╚═══╝  ╚═╝╚═════╝ ╚══════╝
   c h a m p i o n
        </pre>
        <p class="tagline">track your claude code battles</p>
      </header>

      <section class="install-section">
        <h2 class="section-title">// install</h2>
        <div class="command-block">
          <div class="command-line" @click="copyCommand(0)">
            <span class="prompt">$</span>
            <code>claude plugin marketplace add pabloprx/vibechampion</code>
            <span class="copy-hint" :class="{ copied: copiedIndex === 0 }">
              {{ copiedIndex === 0 ? 'copied' : 'click to copy' }}
            </span>
          </div>
          <div class="command-line" @click="copyCommand(1)">
            <span class="prompt">$</span>
            <code>claude plugin install vibechampion@pabloprx-vibechampion</code>
            <span class="copy-hint" :class="{ copied: copiedIndex === 1 }">
              {{ copiedIndex === 1 ? 'copied' : 'click to copy' }}
            </span>
          </div>
        </div>
        <p class="hint">then run <code>/vibebattle</code> in claude code</p>
      </section>

      <section class="leaderboard-section">
        <button class="leaderboard-toggle" @click="toggleLeaderboard">
          <span class="toggle-icon">{{ showLeaderboard ? '[-]' : '[+]' }}</span>
          {{ showLeaderboard ? 'hide rankings' : 'view rankings' }}
        </button>

        <Transition name="slide">
          <div v-if="showLeaderboard" class="leaderboard-container">
            <div class="leaderboard-header">
              <h2>// {{ leaderboardData?.period || 'leaderboard' }}</h2>
              <div class="period-selector">
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

            <div v-if="loading" class="loading">
              <span class="loading-text">loading<span class="dots"></span></span>
            </div>

            <div v-else-if="leaderboardData?.leaderboard?.length" class="leaderboard">
              <div class="leaderboard-row header-row">
                <span class="rank">#</span>
                <span class="name">user</span>
                <span class="tokens">tokens</span>
                <span class="cost">cost</span>
                <span class="days">days</span>
              </div>
              <TransitionGroup name="list" tag="div">
                <div
                  v-for="(entry, index) in leaderboardData.leaderboard"
                  :key="entry.name"
                  class="leaderboard-row"
                  :class="{ 'top-three': index < 3 }"
                  :style="{ '--delay': index * 0.05 + 's' }"
                >
                  <span class="rank">
                    <template v-if="index === 0">*</template>
                    <template v-else>{{ entry.rank }}</template>
                  </span>
                  <span class="name">{{ entry.name }}</span>
                  <span class="tokens">{{ formatTokens(entry.total_tokens) }}</span>
                  <span class="cost">${{ entry.total_cost.toFixed(0) }}</span>
                  <span class="days">{{ entry.days_active }}</span>
                </div>
              </TransitionGroup>
            </div>

            <div v-else class="empty-state">
              <p>no battles yet</p>
              <p class="sub">be the first to join</p>
            </div>
          </div>
        </Transition>
      </section>

      <footer class="footer">
        <a href="https://github.com/pabloprx/vibechampion" target="_blank" class="github-link">
          github
        </a>
        <span class="separator">/</span>
        <span class="version">v1.0</span>
      </footer>
    </main>
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

const showLeaderboard = ref(false)
const loading = ref(false)
const leaderboardData = ref<LeaderboardResponse | null>(null)
const period = ref('month')
const copiedIndex = ref<number | null>(null)

const periods = [
  { label: 'today', value: 'today' },
  { label: 'week', value: 'week' },
  { label: 'month', value: 'month' },
  { label: 'all', value: 'all' },
]

const commands = [
  'claude plugin marketplace add pabloprx/vibechampion',
  'claude plugin install vibechampion@pabloprx-vibechampion'
]

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

function toggleLeaderboard() {
  showLeaderboard.value = !showLeaderboard.value
  if (showLeaderboard.value && !leaderboardData.value) {
    fetchLeaderboard()
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
  if (showLeaderboard.value) {
    fetchLeaderboard()
  }
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  --bg: #0a0a0b;
  --bg-elevated: #111113;
  --text: #e8e6e3;
  --text-dim: #6b6b6b;
  --accent: #4ade80;
  --accent-dim: #22543d;
  --border: #1f1f23;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  min-height: 100vh;
}

.container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.noise {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  z-index: 1000;
}

.scanlines {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.02;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.03) 2px,
    rgba(255, 255, 255, 0.03) 4px
  );
  z-index: 1001;
}

.content {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
  padding: 4rem 2rem;
}

.hero {
  margin-bottom: 4rem;
  text-align: center;
}

.ascii-art {
  font-size: 8px;
  line-height: 1.1;
  color: var(--accent);
  margin-bottom: 1rem;
  letter-spacing: -1px;
  text-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
  animation: glow 3s ease-in-out infinite alternate;
}

@keyframes glow {
  from { text-shadow: 0 0 20px rgba(74, 222, 128, 0.2); }
  to { text-shadow: 0 0 30px rgba(74, 222, 128, 0.4); }
}

.tagline {
  color: var(--text-dim);
  font-size: 13px;
  letter-spacing: 0.5px;
}

.section-title {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-dim);
  margin-bottom: 1rem;
  text-transform: lowercase;
}

.install-section {
  margin-bottom: 3rem;
}

.command-block {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.command-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid var(--border);
  position: relative;
}

.command-line:last-child {
  border-bottom: none;
}

.command-line:hover {
  background: rgba(74, 222, 128, 0.05);
}

.command-line:hover .copy-hint {
  opacity: 1;
}

.prompt {
  color: var(--accent);
  font-weight: 500;
}

.command-line code {
  color: var(--text);
  font-size: 12px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-hint {
  font-size: 10px;
  color: var(--text-dim);
  opacity: 0;
  transition: opacity 0.2s ease, color 0.2s ease;
  white-space: nowrap;
}

.copy-hint.copied {
  color: var(--accent);
  opacity: 1;
}

.hint {
  margin-top: 1rem;
  font-size: 12px;
  color: var(--text-dim);
}

.hint code {
  color: var(--accent);
  background: var(--accent-dim);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 11px;
}

.leaderboard-section {
  margin-bottom: 4rem;
}

.leaderboard-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
}

.leaderboard-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.toggle-icon {
  font-weight: 500;
}

.leaderboard-container {
  margin-top: 1.5rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.leaderboard-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.leaderboard-header h2 {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-dim);
}

.period-selector {
  display: flex;
  gap: 0.25rem;
}

.period-selector button {
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-family: inherit;
  font-size: 11px;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.period-selector button:hover {
  color: var(--text);
}

.period-selector button.active {
  background: var(--accent-dim);
  color: var(--accent);
}

.loading {
  padding: 3rem;
  text-align: center;
}

.loading-text {
  color: var(--text-dim);
  font-size: 12px;
}

.dots::after {
  content: '';
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: ''; }
  40% { content: '.'; }
  60% { content: '..'; }
  80%, 100% { content: '...'; }
}

.leaderboard {
  padding: 0.5rem 0;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 2.5rem 1fr 5rem 4rem 3rem;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 12px;
  transition: background 0.2s ease;
  align-items: center;
}

.leaderboard-row:not(.header-row):hover {
  background: rgba(255, 255, 255, 0.02);
}

.header-row {
  color: var(--text-dim);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.75rem;
  margin-bottom: 0.25rem;
}

.leaderboard-row.top-three .rank {
  color: var(--accent);
}

.leaderboard-row.top-three .name {
  color: var(--accent);
}

.rank {
  text-align: center;
  font-weight: 500;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tokens, .cost, .days {
  text-align: right;
  color: var(--text-dim);
}

.empty-state {
  padding: 3rem;
  text-align: center;
}

.empty-state p {
  color: var(--text-dim);
  font-size: 13px;
}

.empty-state .sub {
  font-size: 11px;
  margin-top: 0.25rem;
  opacity: 0.6;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 11px;
  color: var(--text-dim);
}

.github-link {
  color: var(--text-dim);
  text-decoration: none;
  transition: color 0.2s ease;
}

.github-link:hover {
  color: var(--accent);
}

.separator {
  opacity: 0.3;
}

.version {
  opacity: 0.5;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.list-enter-active {
  transition: all 0.3s ease;
  transition-delay: var(--delay);
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

/* Mobile */
@media (max-width: 480px) {
  .content {
    padding: 2rem 1rem;
  }

  .ascii-art {
    font-size: 5px;
  }

  .command-line code {
    font-size: 10px;
  }

  .leaderboard-row {
    grid-template-columns: 2rem 1fr 4rem 3rem 2.5rem;
    font-size: 11px;
    padding: 0.6rem 1rem;
  }

  .leaderboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
