<template>
  <div class="crt">
    <div class="scanline"></div>
    <div class="noise"></div>

    <div class="screen">
      <header class="header">
        <div class="logo">
          <div class="mascot">
            <svg viewBox="0 0 64 64" class="mascot-svg">
              <!-- Body -->
              <rect x="8" y="20" width="48" height="36" rx="4" fill="currentColor" class="mascot-body"/>
              <!-- Eyes -->
              <rect x="18" y="30" width="8" height="10" rx="1" fill="#0a0a0a"/>
              <rect x="38" y="30" width="8" height="10" rx="1" fill="#0a0a0a"/>
              <!-- Legs -->
              <rect x="14" y="56" width="8" height="8" rx="2" fill="currentColor" class="mascot-body"/>
              <rect x="42" y="56" width="8" height="8" rx="2" fill="currentColor" class="mascot-body"/>
              <!-- Sparkles -->
              <circle cx="56" cy="16" r="2" fill="currentColor" class="sparkle s1"/>
              <circle cx="48" cy="10" r="1.5" fill="currentColor" class="sparkle s2"/>
              <circle cx="12" cy="14" r="1.5" fill="currentColor" class="sparkle s3"/>
            </svg>
          </div>
          <span class="logo-text">VIBE<span class="logo-accent">CHAMPION</span></span>
        </div>
        <div class="status">
          <span class="status-dot"></span>
          <span>SYSTEM ONLINE</span>
        </div>
      </header>

      <!-- Update Alert -->
      <div v-if="showUpdateAlert" class="update-alert">
        <div class="update-content">
          <span class="update-version">v1.2</span>
          <span class="update-text">Teams feature! Update:</span>
          <code class="update-cmd clickable" @click="copyAlertCommand">
            claude plugin update vibechampion@pabloprx-vibechampion
            <span class="copy-hint">{{ copiedAlertCmd ? 'COPIED' : 'CLICK TO COPY' }}</span>
          </code>
          <span class="update-date">Jan 8, 2026</span>
        </div>
        <button class="update-dismiss" @click="dismissUpdateAlert">&times;</button>
      </div>

      <main class="main">
        <!-- Rankings - The Star -->
        <section class="rankings-section">
          <div class="section-header">
            <h2 class="section-title">
              <span class="title-decorator">//</span> LEADERBOARD
            </h2>
            <div class="controls">
              <!-- Team Selector -->
              <div class="control-group team-control">
                <span class="control-label">TEAM</span>
                <div class="team-selector">
                  <button
                    :class="{ active: !currentTeam }"
                    @click="selectTeam(null)"
                  >
                    GLOBAL
                  </button>
                  <button
                    v-for="t in myTeams"
                    :key="t.code"
                    :class="{ active: currentTeam === t.code }"
                    @click="selectTeam(t.code)"
                    :title="t.name"
                  >
                    {{ t.name.substring(0, 8) }}
                  </button>
                  <button class="add-team-btn" @click="openAddTeamModal" title="Add Team">
                    +
                  </button>
                </div>
              </div>
              <div class="control-group">
                <span class="control-label">RANK BY</span>
                <div class="segmented">
                  <button
                    v-for="m in metrics"
                    :key="m.value"
                    :class="{ active: sortBy === m.value }"
                    @click="sortBy = m.value"
                  >
                    {{ m.label }}
                  </button>
                </div>
              </div>
              <div class="control-group">
                <span class="control-label">PERIOD</span>
                <div class="segmented">
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
          </div>

          <div class="rankings-container">
            <div v-if="loading" class="loading-state">
              <div class="loading-bar"></div>
              <span class="loading-text">FETCHING DATA</span>
            </div>

            <div v-else-if="displayData?.length" class="rankings">
              <div class="rankings-table">
                <div class="table-header">
                  <span class="th-rank">RANK</span>
                  <span class="th-user">USER</span>
                  <span class="th-bar"></span>
                  <span class="th-score">{{ getMetricLabel() }}</span>
                </div>
                <div class="table-body">
                  <div
                    v-for="(entry, index) in displayData"
                    :key="entry.name"
                    class="table-row"
                    :class="{
                      'is-champion': index === 0,
                      'is-top3': index < 3,
                      'is-even': index % 2 === 0
                    }"
                    @mouseenter="index === 0 && handleWinnerHover(true)"
                    @mouseleave="index === 0 && handleWinnerHover(false)"
                  >
                    <span class="td-rank">
                      <span v-if="index === 0" class="champion-badge">
                        <span class="crown-icon">&#9733;</span>
                      </span>
                      <span v-else class="rank-num">{{ index + 1 }}</span>
                    </span>
                    <span class="td-user">
                      <div class="user-row">
                        <span class="user-name">{{ entry.name }}</span>
                        <span
                          v-if="entry.archetype"
                          class="archetype-badge"
                          :style="{ '--archetype-color': getArchetypeInfo(entry.archetype).color }"
                          :title="getArchetypeInfo(entry.archetype).description"
                        >
                          <span class="archetype-icon" v-html="getArchetypeIcon(entry.archetype)"></span>
                          <span class="archetype-name">{{ getArchetypeInfo(entry.archetype).name }}</span>
                        </span>
                      </div>
                      <span v-if="index < 3" class="roast">{{ getRandomRoast(entry.name) }}</span>
                    </span>
                    <span class="td-bar">
                      <div class="bar-track">
                        <div
                          class="bar-fill"
                          :style="{ width: getScorePercent(entry) + '%' }"
                        ></div>
                      </div>
                    </span>
                    <span class="td-score">{{ getMetricValue(entry) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <div class="empty-icon">[ ]</div>
              <p class="empty-title">NO DATA FOUND</p>
              <p class="empty-sub">be the first to join the battle</p>
            </div>
          </div>

          <div class="rankings-footer">
            <span class="period-label">{{ leaderboardData?.period || '---' }}</span>
            <span class="sync-info">
              <span class="sync-dot"></span>
              auto-sync enabled
            </span>
          </div>
        </section>

        <!-- Install Panel - Sidebar -->
        <aside class="install-sidebar">
          <div class="sidebar-header">
            <span class="sidebar-title">// quick start</span>
          </div>
          <div class="sidebar-content">
            <div class="install-steps">
              <div class="step">
                <span class="step-num">1</span>
                <div class="step-content">
                  <span class="step-label">Add plugin</span>
                  <div class="cmd" @click="copyCommand(0)">
                    <code>claude plugin marketplace add pabloprx/vibechampion</code>
                    <span class="cmd-action">{{ copiedIndex === 0 ? 'COPIED' : 'COPY' }}</span>
                  </div>
                </div>
              </div>
              <div class="step">
                <span class="step-num">2</span>
                <div class="step-content">
                  <span class="step-label">Install</span>
                  <div class="cmd" @click="copyCommand(1)">
                    <code>claude plugin install vibechampion@pabloprx-vibechampion</code>
                    <span class="cmd-action">{{ copiedIndex === 1 ? 'COPIED' : 'COPY' }}</span>
                  </div>
                </div>
              </div>
              <div class="step">
                <span class="step-num">3</span>
                <div class="step-content">
                  <span class="step-label">Battle</span>
                  <div class="cmd highlight">
                    <code>/vibechampion:vibebattle</code>
                  </div>
                </div>
              </div>
            </div>

            <div class="update-banner">
              <div class="update-badge">v1.2</div>
              <div class="update-info">
                <span class="update-title">Teams update</span>
                <span class="update-desc">Create teams, share leaderboards</span>
              </div>
            </div>
            <div class="update-cmd" @click="copyUpdateCommand">
              <code>claude plugin update vibechampion@pabloprx-vibechampion</code>
              <span class="cmd-action">{{ copiedUpdate ? 'COPIED' : 'COPY' }}</span>
            </div>

            <div class="links">
              <a href="https://github.com/pabloprx/vibechampion" target="_blank" class="link">
                <span class="link-icon">&gt;</span>
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </aside>
      </main>

      <!-- Team Modal -->
      <div v-if="showTeamModal" class="modal-overlay" @click.self="closeTeamModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ teamModalMode === 'create' ? 'Create Team' : 'Join Team' }}</h3>
            <button class="modal-close" @click="closeTeamModal">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Mode Toggle -->
            <div class="mode-toggle">
              <button
                :class="{ active: teamModalMode === 'join' }"
                @click="teamModalMode = 'join'; teamError = ''"
              >
                Join Existing
              </button>
              <button
                :class="{ active: teamModalMode === 'create' }"
                @click="teamModalMode = 'create'; teamError = ''"
              >
                Create New
              </button>
            </div>

            <div class="form-group">
              <label>Team Code</label>
              <input
                v-model="pendingTeamCode"
                type="text"
                placeholder="e.g. ACME-2024"
                @input="teamError = ''; newTeamName = ''"
              />
              <span class="form-hint">3-20 chars, alphanumeric and hyphens</span>
            </div>

            <div v-if="teamModalMode === 'create'" class="form-group">
              <label>Team Name</label>
              <input v-model="newTeamName" type="text" placeholder="e.g. Acme Corp" />
            </div>

            <div v-if="teamModalMode === 'create'" class="form-group">
              <label>Image URL (optional)</label>
              <input v-model="newTeamImageUrl" type="text" placeholder="https://..." />
            </div>

            <div class="form-group">
              <label>Your Visibility</label>
              <div class="visibility-options">
                <label class="radio-option">
                  <input type="radio" v-model="newTeamVisibility" value="both" />
                  <span>Public + Team</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="newTeamVisibility" value="team" />
                  <span>Team Only</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="newTeamVisibility" value="public" />
                  <span>Public Only</span>
                </label>
              </div>
              <span class="form-hint">Control where your stats appear</span>
            </div>

            <div v-if="teamError" class="form-error">{{ teamError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeTeamModal">Cancel</button>
            <button
              v-if="teamModalMode === 'create'"
              class="btn-primary"
              @click="createTeam"
            >
              Create Team
            </button>
            <button
              v-else
              class="btn-primary"
              @click="joinTeam"
            >
              Join Team
            </button>
          </div>
        </div>
      </div>

      <!-- Team Settings Panel -->
      <div v-if="showTeamSettings" class="team-settings-overlay" @click.self="showTeamSettings = false">
        <div class="team-settings">
          <div class="settings-header">
            <h3>My Teams</h3>
            <button class="modal-close" @click="showTeamSettings = false">&times;</button>
          </div>
          <div class="settings-body">
            <div v-if="myTeams.length === 0" class="empty-teams">
              No teams yet. Add one to get started!
            </div>
            <div v-for="t in myTeams" :key="t.code" class="team-item">
              <div class="team-item-info">
                <span class="team-item-name">{{ t.name }}</span>
                <div class="team-join-cmd" @click="copyJoinCommand(t.code)">
                  <code>/vibechampion:vibebattle join {{ t.code }}</code>
                  <span class="copy-hint-small">{{ copiedJoinCode === t.code ? 'COPIED' : 'COPY' }}</span>
                </div>
              </div>
              <button class="btn-danger-sm" @click="leaveTeam(t.code)">Leave</button>
            </div>
          </div>
          <div class="settings-footer">
            <button class="btn-primary" @click="openAddTeamModal">+ Add Team</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const REFETCH_INTERVAL = 2 * 60 * 1000

type Archetype = 'vibe-coder' | 'architect' | 'thinker' | 'grinder' | 'sniper'

interface ArchetypeInfo {
  id: Archetype
  name: string
  title: string
  description: string
  color: string
}

const ARCHETYPES: Record<Archetype, ArchetypeInfo> = {
  'vibe-coder': {
    id: 'vibe-coder',
    name: 'Vibe Coder',
    title: 'El Vibe Coder',
    description: 'Trusts Claude completely. Short prompts, batch approves, pure autonomous mode.',
    color: '#4ade80'
  },
  'architect': {
    id: 'architect',
    name: 'Architect',
    title: 'El Arquitecto',
    description: 'Loads massive context. Specs, docs, entire codebases. Claude reads before acting.',
    color: '#60a5fa'
  },
  'thinker': {
    id: 'thinker',
    name: 'Thinker',
    title: 'El Pensador',
    description: 'Conversational explorer. Uses Claude as a sparring partner, not a code generator.',
    color: '#c084fc'
  },
  'grinder': {
    id: 'grinder',
    name: 'Grinder',
    title: 'El Grinder',
    description: 'Brute force warrior. Many retries, high volume, never gives up.',
    color: '#f97316'
  },
  'sniper': {
    id: 'sniper',
    name: 'Sniper',
    title: 'El Sniper',
    description: 'Surgical precision. Targeted prompts, minimal tokens, maximum impact.',
    color: '#ef4444'
  }
}

interface LeaderboardEntry {
  rank: number
  name: string
  total_tokens: number
  output_tokens: number
  vibe_score: number
  total_cost: number
  days_active: number
  archetype: Archetype
}

interface LeaderboardResponse {
  period: string
  sortBy: string
  teamCode?: string
  teamName?: string
  leaderboard: LeaderboardEntry[]
}

type SortMetric = 'vibe_score' | 'total_tokens' | 'output_tokens' | 'total_cost'
type Visibility = 'public' | 'team' | 'both'

interface Team {
  code: string
  name: string
  image_url?: string
  member_count?: number
}

interface MyTeam extends Team {
  visibility: Visibility
}

const loading = ref(false)
const leaderboardData = ref<LeaderboardResponse | null>(null)
const displayData = ref<LeaderboardEntry[]>([])
const period = ref('month')
const sortBy = ref<SortMetric>('total_tokens')
const copiedIndex = ref<number | null>(null)
const copiedUpdate = ref(false)
const hoveredWinner = ref(false)

// Update alert
const UPDATE_VERSION = 'v1.2'
const showUpdateAlert = ref(false)
const copiedAlertCmd = ref(false)

function initUpdateAlert() {
  const dismissed = localStorage.getItem('vibechampion_update_dismissed')
  showUpdateAlert.value = dismissed !== UPDATE_VERSION
}

function dismissUpdateAlert() {
  showUpdateAlert.value = false
  localStorage.setItem('vibechampion_update_dismissed', UPDATE_VERSION)
}

function copyAlertCommand() {
  navigator.clipboard.writeText('claude plugin update vibechampion@pabloprx-vibechampion')
  copiedAlertCmd.value = true
  setTimeout(() => { copiedAlertCmd.value = false }, 2000)
}

// Team state
const currentTeam = ref<string | null>(null)
const myTeams = ref<MyTeam[]>([])
const copiedJoinCode = ref<string | null>(null)

function copyJoinCommand(code: string) {
  navigator.clipboard.writeText(`/vibechampion:vibebattle join ${code}`)
  copiedJoinCode.value = code
  setTimeout(() => { copiedJoinCode.value = null }, 2000)
}
const showTeamModal = ref(false)
const teamModalMode = ref<'create' | 'join'>('join')
const pendingTeamCode = ref('')
const newTeamName = ref('')
const newTeamImageUrl = ref('')
const newTeamVisibility = ref<Visibility>('both')
const teamError = ref('')
const showTeamSettings = ref(false)

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

function getScorePercent(entry: LeaderboardEntry): number {
  if (!leaderboardData.value?.leaderboard?.length) return 0
  const max = getNumericScore(leaderboardData.value.leaderboard[0])
  const current = getNumericScore(entry)
  return max > 0 ? (current / max) * 100 : 0
}

function getNumericScore(entry: LeaderboardEntry): number {
  switch (sortBy.value) {
    case 'vibe_score': return entry.vibe_score
    case 'total_tokens': return entry.total_tokens
    case 'output_tokens': return entry.output_tokens
    case 'total_cost': return entry.total_cost
  }
}


const commands = [
  'claude plugin marketplace add pabloprx/vibechampion',
  'claude plugin install vibechampion@pabloprx-vibechampion',
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

function getArchetypeInfo(archetype: Archetype): ArchetypeInfo {
  return ARCHETYPES[archetype] || ARCHETYPES['vibe-coder']
}

// Pixel art SVG icons for each archetype (16x16 grid)
function getArchetypeIcon(archetype: Archetype): string {
  const icons: Record<Archetype, string> = {
    // Vibe Coder: chill face with sunglasses
    'vibe-coder': `<svg viewBox="0 0 16 16" fill="currentColor">
      <rect x="4" y="3" width="8" height="10" rx="2"/>
      <rect x="3" y="6" width="4" height="2" fill="#0a0a0a"/>
      <rect x="9" y="6" width="4" height="2" fill="#0a0a0a"/>
      <rect x="6" y="10" width="4" height="1" fill="#0a0a0a"/>
    </svg>`,
    // Architect: character with blueprint/grid
    'architect': `<svg viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="2" width="10" height="12" rx="1"/>
      <rect x="5" y="4" width="2" height="2" fill="#0a0a0a"/>
      <rect x="9" y="4" width="2" height="2" fill="#0a0a0a"/>
      <rect x="5" y="8" width="6" height="1" fill="#0a0a0a"/>
      <rect x="5" y="10" width="6" height="1" fill="#0a0a0a"/>
      <rect x="5" y="12" width="6" height="1" fill="#0a0a0a"/>
    </svg>`,
    // Thinker: character with thought bubble
    'thinker': `<svg viewBox="0 0 16 16" fill="currentColor">
      <rect x="4" y="5" width="8" height="9" rx="2"/>
      <rect x="5" y="8" width="2" height="2" fill="#0a0a0a"/>
      <rect x="9" y="8" width="2" height="2" fill="#0a0a0a"/>
      <circle cx="12" cy="3" r="2"/>
      <circle cx="14" cy="2" r="1"/>
    </svg>`,
    // Grinder: muscular/intense character
    'grinder': `<svg viewBox="0 0 16 16" fill="currentColor">
      <rect x="4" y="3" width="8" height="10" rx="1"/>
      <rect x="2" y="5" width="2" height="6"/>
      <rect x="12" y="5" width="2" height="6"/>
      <rect x="5" y="5" width="2" height="2" fill="#0a0a0a"/>
      <rect x="9" y="5" width="2" height="2" fill="#0a0a0a"/>
      <rect x="5" y="9" width="6" height="2" fill="#0a0a0a"/>
    </svg>`,
    // Sniper: character with crosshairs/scope
    'sniper': `<svg viewBox="0 0 16 16" fill="currentColor">
      <rect x="5" y="4" width="6" height="8" rx="1"/>
      <rect x="6" y="6" width="1" height="2" fill="#0a0a0a"/>
      <rect x="9" y="6" width="1" height="2" fill="#0a0a0a"/>
      <circle cx="13" cy="6" r="2" fill="none" stroke="currentColor" stroke-width="1"/>
      <line x1="13" y1="4" x2="13" y2="8" stroke="currentColor" stroke-width="0.5"/>
      <line x1="11" y1="6" x2="15" y2="6" stroke="currentColor" stroke-width="0.5"/>
    </svg>`
  }
  return icons[archetype] || icons['vibe-coder']
}

// Team functions
const TEAMS_STORAGE_KEY = 'vibechampion_teams'

function loadTeamsFromStorage() {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(TEAMS_STORAGE_KEY)
    if (stored) {
      myTeams.value = JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load teams from storage:', e)
  }
}

function saveTeamsToStorage() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(myTeams.value))
  } catch (e) {
    console.error('Failed to save teams to storage:', e)
  }
}

async function checkAndHandleTeamFromUrl(code: string) {
  pendingTeamCode.value = code

  // Check if already in my teams
  const existing = myTeams.value.find(t => t.code === code)
  if (existing) {
    currentTeam.value = code
    return
  }

  // Check if team exists in DB
  try {
    const res = await fetch(`/api/teams/${code}`)
    if (res.ok) {
      const team = await res.json()
      teamModalMode.value = 'join'
      newTeamName.value = team.name
      newTeamImageUrl.value = team.image_url || ''
      showTeamModal.value = true
    } else if (res.status === 404) {
      // Team doesn't exist - offer to create
      teamModalMode.value = 'create'
      newTeamName.value = ''
      newTeamImageUrl.value = ''
      showTeamModal.value = true
    }
  } catch (e) {
    console.error('Failed to check team:', e)
  }
}

async function createTeam() {
  if (!pendingTeamCode.value || !newTeamName.value) {
    teamError.value = 'Code and name are required'
    return
  }

  try {
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: pendingTeamCode.value,
        name: newTeamName.value,
        image_url: newTeamImageUrl.value || undefined
      })
    })

    if (!res.ok) {
      const error = await res.json()
      teamError.value = error.message || 'Failed to create team'
      return
    }

    const team = await res.json()
    myTeams.value.push({
      ...team,
      visibility: newTeamVisibility.value
    })
    saveTeamsToStorage()
    currentTeam.value = team.code
    closeTeamModal()
    fetchLeaderboard()
  } catch (e) {
    teamError.value = 'Failed to create team'
  }
}

async function joinTeam() {
  if (!pendingTeamCode.value) return

  try {
    // For now we just add to local storage
    // The actual join API would be called when submitting stats
    const res = await fetch(`/api/teams/${pendingTeamCode.value}`)
    if (!res.ok) {
      teamError.value = 'Team not found'
      return
    }

    const team = await res.json()
    myTeams.value.push({
      code: team.code,
      name: team.name,
      image_url: team.image_url,
      visibility: newTeamVisibility.value
    })
    saveTeamsToStorage()
    currentTeam.value = team.code
    closeTeamModal()
    fetchLeaderboard()
  } catch (e) {
    teamError.value = 'Failed to join team'
  }
}

function leaveTeam(code: string) {
  myTeams.value = myTeams.value.filter(t => t.code !== code)
  saveTeamsToStorage()
  if (currentTeam.value === code) {
    currentTeam.value = null
    fetchLeaderboard()
  }
}

function closeTeamModal() {
  showTeamModal.value = false
  teamError.value = ''
  pendingTeamCode.value = ''
  newTeamName.value = ''
  newTeamImageUrl.value = ''
}

function openAddTeamModal() {
  teamModalMode.value = 'join'
  pendingTeamCode.value = ''
  newTeamName.value = ''
  newTeamImageUrl.value = ''
  teamError.value = ''
  showTeamModal.value = true
}

function selectTeam(code: string | null) {
  currentTeam.value = code
  showTeamSettings.value = false
  fetchLeaderboard()
  updateUrlParams()
}

let refetchInterval: ReturnType<typeof setInterval> | null = null

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    fetchLeaderboard()
  }
}

onMounted(() => {
  initUpdateAlert()
  loadTeamsFromStorage()
  loadFromUrlParams()
  fetchLeaderboard()
  loadConfetti()
  refetchInterval = setInterval(fetchLeaderboard, REFETCH_INTERVAL)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (refetchInterval) clearInterval(refetchInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

async function fetchLeaderboard() {
  loading.value = true
  try {
    let url = `/api/leaderboard?period=${period.value}&sortBy=${sortBy.value}`
    if (currentTeam.value) {
      url += `&team=${currentTeam.value}`
    }
    const res = await fetch(url)
    leaderboardData.value = await res.json()
    if (leaderboardData.value?.leaderboard) {
      displayData.value = leaderboardData.value.leaderboard
    }
  } catch (e) {
    console.error('Failed to fetch leaderboard:', e)
  } finally {
    loading.value = false
  }
}

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
  if (isHovering) triggerConfetti()
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000_000) return (tokens / 1_000_000_000).toFixed(1) + 'B'
  if (tokens >= 1_000_000) return (tokens / 1_000_000).toFixed(1) + 'M'
  if (tokens >= 1_000) return (tokens / 1_000).toFixed(1) + 'K'
  return tokens.toString()
}

async function copyCommand(index: number) {
  try {
    await navigator.clipboard.writeText(commands[index])
    copiedIndex.value = index
    setTimeout(() => { copiedIndex.value = null }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

async function copyUpdateCommand() {
  try {
    await navigator.clipboard.writeText('claude plugin update vibechampion@pabloprx-vibechampion')
    copiedUpdate.value = true
    setTimeout(() => { copiedUpdate.value = false }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

// Sync with URL query params
function updateUrlParams() {
  const url = new URL(window.location.href)
  url.searchParams.set('period', period.value)
  url.searchParams.set('sortBy', sortBy.value)
  if (currentTeam.value) {
    url.searchParams.set('team', currentTeam.value)
  } else {
    url.searchParams.delete('team')
  }
  window.history.replaceState({}, '', url.toString())
}

function loadFromUrlParams() {
  const params = new URLSearchParams(window.location.search)
  const urlPeriod = params.get('period')
  const urlSortBy = params.get('sortBy')
  const urlTeam = params.get('team')

  if (urlPeriod && ['today', 'week', 'month', 'all'].includes(urlPeriod)) {
    period.value = urlPeriod
  }
  if (urlSortBy && ['vibe_score', 'total_tokens', 'output_tokens', 'total_cost'].includes(urlSortBy)) {
    sortBy.value = urlSortBy as SortMetric
  }
  if (urlTeam) {
    checkAndHandleTeamFromUrl(urlTeam)
  }
}

watch([period, sortBy], () => {
  fetchLeaderboard()
  updateUrlParams()
})

watch(currentTeam, () => {
  updateUrlParams()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root {
  --bg-deep: #050505;
  --bg: #0a0a0a;
  --bg-elevated: #111111;
  --bg-hover: #1a1a1a;
  --border: #1f1f1f;
  --border-bright: #2a2a2a;
  --text: #e8e8e8;
  --text-secondary: #888;
  --text-dim: #555;
  --accent: #4ade80;
  --accent-dim: #22c55e;
  --accent-soft: rgba(74, 222, 128, 0.08);
  --accent-glow: rgba(74, 222, 128, 0.15);
  --champion-bg: linear-gradient(135deg, rgba(74, 222, 128, 0.12) 0%, rgba(74, 222, 128, 0.04) 100%);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  background: var(--bg-deep);
  color: var(--text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* CRT Effects */
.crt {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(74, 222, 128, 0.03) 0%, transparent 50%),
    var(--bg-deep);
}

.scanline {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(to bottom, transparent, rgba(74, 222, 128, 0.06), transparent);
  animation: scanline 8s linear infinite;
  pointer-events: none;
  z-index: 1000;
}

@keyframes scanline {
  0% { top: -3px; }
  100% { top: 100%; }
}

.noise {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.02;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  z-index: 999;
}

.screen {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1rem;
}

.update-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(90deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05));
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: var(--accent); box-shadow: 0 0 10px rgba(0, 255, 136, 0.2); }
  50% { border-color: var(--accent-bright); box-shadow: 0 0 20px rgba(0, 255, 136, 0.4); }
}

.update-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.update-version {
  background: var(--accent);
  color: var(--bg);
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.update-text {
  color: var(--text);
  font-size: 0.875rem;
}

.update-cmd {
  background: var(--surface);
  color: var(--accent);
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  font-family: inherit;
  font-size: 0.8rem;
}

.update-date {
  color: var(--text-dim);
  font-size: 0.75rem;
}

.update-dismiss {
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s;
}

.update-dismiss:hover {
  color: var(--text);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mascot {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mascot-svg {
  width: 100%;
  height: 100%;
  color: var(--accent);
}

.mascot-body {
  filter: drop-shadow(0 0 8px var(--accent-glow));
}

.sparkle {
  animation: twinkle 2s ease-in-out infinite;
}

.sparkle.s1 { animation-delay: 0s; }
.sparkle.s2 { animation-delay: 0.5s; }
.sparkle.s3 { animation-delay: 1s; }

@keyframes twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.8); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.95); }
}

.logo-text {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text);
}

.logo-accent {
  color: var(--accent);
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--accent);
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Main Layout */
.main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  align-items: start;
}

/* Rankings Section */
.rankings-section {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-decorator {
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
}

.controls {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.control-label {
  font-size: 0.65rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.segmented {
  display: flex;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px;
  gap: 2px;
}

.segmented button {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.segmented button:hover {
  color: var(--text);
  background: var(--bg-hover);
}

.segmented button.active {
  color: var(--bg-deep);
  background: var(--accent);
  font-weight: 600;
}

/* Rankings Table */
.rankings-container {
  min-height: 300px;
}

.rankings-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 70px 1fr 200px 100px;
  padding: 0.75rem 1.5rem;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-dim);
}

.table-body {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: grid;
  grid-template-columns: 70px 1fr 200px 100px;
  padding: 1rem 1.5rem;
  align-items: center;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--bg-hover);
}

.table-row.is-champion {
  background: var(--champion-bg);
  border-left: 3px solid var(--accent);
  padding-left: calc(1.5rem - 3px);
}

.table-row.is-champion:hover {
  background: var(--champion-bg);
}

.td-rank {
  font-weight: 600;
  color: var(--text-secondary);
}

.table-row.is-top3 .rank-num {
  color: var(--accent);
}

.champion-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--accent);
  border-radius: 8px;
  box-shadow: 0 0 20px var(--accent-glow);
}

.crown-icon {
  color: var(--bg-deep);
  font-size: 1rem;
}

.td-user {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.user-name {
  font-weight: 600;
  color: var(--text);
  font-size: 1rem;
}

.table-row.is-champion .user-name {
  color: var(--accent);
  font-size: 1.1rem;
}

/* Archetype Badge */
.archetype-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.5rem;
  background: color-mix(in srgb, var(--archetype-color) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--archetype-color) 40%, transparent);
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--archetype-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: help;
  transition: all 0.15s ease;
}

.archetype-badge:hover {
  background: color-mix(in srgb, var(--archetype-color) 25%, transparent);
  border-color: var(--archetype-color);
  transform: translateY(-1px);
}

.archetype-icon {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.archetype-icon svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 2px var(--archetype-color));
}

.archetype-name {
  white-space: nowrap;
}

.roast {
  font-size: 0.75rem;
  color: var(--text-dim);
  font-style: italic;
}

.td-score {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-secondary);
  text-align: right;
}

.table-row.is-champion .td-score {
  color: var(--accent);
  font-size: 1.1rem;
}

/* Progress Bar */
.td-bar {
  padding: 0 0.5rem;
}

.bar-track {
  width: 100%;
  height: 8px;
  background: var(--bg-deep);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-dim), var(--accent));
  border-radius: 3px;
  transition: width 0.4s ease-out;
  box-shadow: 0 0 8px var(--accent-glow);
}

.table-row.is-champion .bar-fill {
  box-shadow: 0 0 12px var(--accent-glow), 0 0 20px var(--accent-glow);
}

/* Rankings Footer */
.rankings-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--bg-elevated);
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--text-dim);
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sync-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  animation: blink 2s ease-in-out infinite;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
}

.loading-bar {
  width: 150px;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.loading-bar::after {
  content: '';
  position: absolute;
  left: -50%;
  width: 50%;
  height: 100%;
  background: var(--accent);
  animation: loading 1s ease-in-out infinite;
}

@keyframes loading {
  0% { left: -50%; }
  100% { left: 100%; }
}

.loading-text {
  font-size: 0.75rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 0.5rem;
}

.empty-icon {
  font-size: 2rem;
  color: var(--text-dim);
  margin-bottom: 0.5rem;
}

.empty-title {
  font-size: 0.9rem;
  color: var(--text);
  font-weight: 600;
  letter-spacing: 1px;
}

.empty-sub {
  font-size: 0.8rem;
  color: var(--text-dim);
}

/* Install Sidebar */
.install-sidebar {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  position: sticky;
  top: 2rem;
}

.sidebar-header {
  padding: 1rem 1.25rem;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
}

.sidebar-title {
  font-size: 0.75rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sidebar-content {
  padding: 1.25rem;
}

.install-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step {
  display: flex;
  gap: 0.75rem;
}

.step-num {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.4rem;
}

.cmd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cmd:hover {
  border-color: var(--border-bright);
  background: var(--bg-elevated);
}

.cmd code {
  font-size: 0.7rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cmd:hover code {
  color: var(--text);
}

.cmd-action {
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--accent);
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cmd.highlight {
  background: var(--accent-soft);
  border-color: var(--accent-dim);
}

.cmd.highlight code {
  color: var(--accent);
  font-weight: 600;
}

/* Update Banner */
.update-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.update-badge {
  background: var(--accent);
  color: var(--bg-deep);
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.update-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.update-title {
  font-size: 0.75rem;
  color: var(--text);
  font-weight: 500;
}

.update-desc {
  font-size: 0.65rem;
  color: var(--text-dim);
}

.update-cmd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin-top: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.update-cmd:hover {
  border-color: var(--accent-dim);
  background: var(--bg-elevated);
}

.update-cmd code {
  font-size: 0.65rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.update-cmd:hover code {
  color: var(--text);
}

/* Links */
.links {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.75rem;
  padding: 0.5rem 0;
  transition: color 0.15s ease;
}

.link:hover {
  color: var(--accent);
}

.link-icon {
  color: var(--accent);
}

/* Mobile */
@media (max-width: 900px) {
  .main {
    grid-template-columns: 1fr;
  }

  .install-sidebar {
    position: static;
    order: 2;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .controls {
    width: 100%;
    flex-direction: column;
    gap: 1rem;
  }

  .control-group {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .segmented {
    width: 100%;
    justify-content: stretch;
  }

  .segmented button {
    flex: 1;
    text-align: center;
  }

  .table-header,
  .table-row {
    grid-template-columns: 50px 1fr 120px 70px;
    padding: 0.75rem 1rem;
  }

  .user-name {
    font-size: 0.9rem;
  }

  .td-score {
    font-size: 0.85rem;
  }
}

@media (max-width: 600px) {
  .td-bar,
  .th-bar {
    display: none;
  }

  .table-header,
  .table-row {
    grid-template-columns: 50px 1fr 70px;
  }
}

@media (max-width: 500px) {
  .screen {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .table-header,
  .table-row {
    grid-template-columns: 40px 1fr 60px;
    padding: 0.5rem 0.75rem;
  }

  .roast {
    display: none;
  }

  .mascot {
    width: 36px;
    height: 36px;
  }
}

/* Team Selector */
.team-control {
  min-width: 0;
}

.team-selector {
  display: flex;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px;
  gap: 2px;
  flex-wrap: wrap;
}

.team-selector button {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.team-selector button:hover {
  color: var(--text);
  background: var(--bg-hover);
}

.team-selector button.active {
  color: var(--bg-deep);
  background: var(--accent);
  font-weight: 600;
}

.add-team-btn {
  color: var(--accent) !important;
  font-size: 1rem !important;
  padding: 0.3rem 0.6rem !important;
}

.add-team-btn:hover {
  background: var(--accent-soft) !important;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: var(--text);
}

.modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mode-toggle {
  display: flex;
  gap: 0;
  background: var(--surface);
  border-radius: 4px;
  padding: 2px;
}

.mode-toggle button {
  flex: 1;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s;
}

.mode-toggle button:hover {
  color: var(--text);
}

.mode-toggle button.active {
  background: var(--accent);
  color: var(--bg);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border);
}

/* Form Elements */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input {
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--text);
  outline: none;
  transition: border-color 0.15s ease;
}

.form-group input:focus {
  border-color: var(--accent);
}

.form-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-hint {
  font-size: 0.7rem;
  color: var(--text-dim);
}

.form-error {
  color: #ef4444;
  font-size: 0.8rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 4px;
}

/* Visibility Options */
.visibility-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.radio-option input {
  accent-color: var(--accent);
}

.radio-option:hover {
  color: var(--text);
}

/* Team Preview */
.team-preview {
  padding: 1rem;
  background: var(--bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.team-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.team-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.team-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.team-name {
  font-weight: 600;
  color: var(--text);
}

.team-code {
  font-size: 0.75rem;
  color: var(--text-dim);
  font-family: 'JetBrains Mono', monospace;
}

/* Buttons */
.btn-primary {
  background: var(--accent);
  color: var(--bg-deep);
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-bright);
}

.btn-danger-sm {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 4px;
  padding: 0.4rem 0.75rem;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-danger-sm:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* Team Settings Panel */
.team-settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: flex-end;
  z-index: 1000;
}

.team-settings {
  background: var(--bg);
  border-left: 1px solid var(--border);
  width: 100%;
  max-width: 320px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.settings-header h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.settings-footer {
  padding: 1rem;
  border-top: 1px solid var(--border);
}

.empty-teams {
  text-align: center;
  padding: 2rem;
  color: var(--text-dim);
  font-size: 0.85rem;
}

.team-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.team-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.team-item-name {
  font-weight: 500;
  color: var(--text);
  font-size: 0.9rem;
}

.team-join-cmd {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface);
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.2s;
}

.team-join-cmd:hover {
  background: var(--border);
}

.team-join-cmd code {
  font-size: 0.7rem;
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
}

.copy-hint-small {
  font-size: 0.6rem;
  color: var(--text-dim);
  text-transform: uppercase;
}

.update-cmd.clickable {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: background 0.2s;
}

.update-cmd.clickable:hover {
  background: rgba(0, 255, 136, 0.15);
}

.copy-hint {
  font-size: 0.65rem;
  color: var(--text-dim);
  text-transform: uppercase;
  opacity: 0.8;
}
</style>
