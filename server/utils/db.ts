import { createClient, type Client } from '@libsql/client'

let db: Client | null = null

function getDb(): Client {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN
    })
  }
  return db
}

// Initialize tables
export async function initDb(): Promise<void> {
  const client = getDb()

  await client.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      cache_creation_tokens INTEGER DEFAULT 0,
      cache_read_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      total_cost REAL DEFAULT 0,
      models_used TEXT DEFAULT '[]',
      submitted_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, date)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date)`,
    `CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date)`
  ])
}

export interface User {
  id: number
  name: string
  created_at: string
}

export interface DailyStats {
  id: number
  user_id: number
  date: string
  input_tokens: number
  output_tokens: number
  cache_creation_tokens: number
  cache_read_tokens: number
  total_tokens: number
  total_cost: number
  models_used: string
  submitted_at: string
}

export interface StatsPayload {
  date: string
  inputTokens?: number
  outputTokens?: number
  cacheCreationTokens?: number
  cacheReadTokens?: number
  totalTokens?: number
  totalCost?: number
  modelsUsed?: string[]
}

// User operations
export async function getOrCreateUser(name: string): Promise<User> {
  const client = getDb()
  const existing = await client.execute({
    sql: 'SELECT * FROM users WHERE name = ?',
    args: [name]
  })

  if (existing.rows.length > 0) {
    return existing.rows[0] as unknown as User
  }

  const result = await client.execute({
    sql: 'INSERT INTO users (name) VALUES (?)',
    args: [name]
  })

  return {
    id: Number(result.lastInsertRowid),
    name,
    created_at: new Date().toISOString()
  }
}

export async function getUser(name: string): Promise<User | undefined> {
  const client = getDb()
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE name = ?',
    args: [name]
  })
  return result.rows[0] as unknown as User | undefined
}

export async function getAllUsers(): Promise<User[]> {
  const client = getDb()
  const result = await client.execute('SELECT * FROM users ORDER BY name')
  return result.rows as unknown as User[]
}

// Stats operations
export async function upsertDailyStats(userId: number, stats: StatsPayload): Promise<void> {
  const client = getDb()
  await client.execute({
    sql: `
      INSERT INTO daily_stats (user_id, date, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, total_tokens, total_cost, models_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        input_tokens = excluded.input_tokens,
        output_tokens = excluded.output_tokens,
        cache_creation_tokens = excluded.cache_creation_tokens,
        cache_read_tokens = excluded.cache_read_tokens,
        total_tokens = excluded.total_tokens,
        total_cost = excluded.total_cost,
        models_used = excluded.models_used,
        submitted_at = datetime('now')
    `,
    args: [
      userId,
      stats.date,
      stats.inputTokens ?? 0,
      stats.outputTokens ?? 0,
      stats.cacheCreationTokens ?? 0,
      stats.cacheReadTokens ?? 0,
      stats.totalTokens ?? 0,
      stats.totalCost ?? 0,
      JSON.stringify(stats.modelsUsed ?? [])
    ]
  })
}

export async function bulkUpsertStats(userName: string, dailyStats: StatsPayload[]): Promise<void> {
  const user = await getOrCreateUser(userName)
  for (const s of dailyStats) {
    await upsertDailyStats(user.id, s)
  }
}

// Archetypes based on usage patterns
export type Archetype =
  | 'vibe-coder'    // High output/input ratio - trusts Claude, autonomous
  | 'architect'     // Low output/input + high total - massive context provider
  | 'thinker'       // High vibe/tokens efficiency - conversational, exploratory
  | 'grinder'       // High total + low efficiency - brute force retries
  | 'sniper'        // Low total + high output ratio - precise, targeted

export interface ArchetypeInfo {
  id: Archetype
  name: string
  title: string
  description: string
}

export const ARCHETYPES: Record<Archetype, ArchetypeInfo> = {
  'vibe-coder': {
    id: 'vibe-coder',
    name: 'Vibe Coder',
    title: 'El Vibe Coder',
    description: 'Trusts Claude completely. Short prompts, batch approves, pure autonomous mode.'
  },
  'architect': {
    id: 'architect',
    name: 'Architect',
    title: 'El Arquitecto',
    description: 'Loads massive context. Specs, docs, entire codebases. Claude reads before acting.'
  },
  'thinker': {
    id: 'thinker',
    name: 'Thinker',
    title: 'El Pensador',
    description: 'Conversational explorer. Uses Claude as a sparring partner, not a code generator.'
  },
  'grinder': {
    id: 'grinder',
    name: 'Grinder',
    title: 'El Grinder',
    description: 'Brute force warrior. Many retries, high volume, never gives up.'
  },
  'sniper': {
    id: 'sniper',
    name: 'Sniper',
    title: 'El Sniper',
    description: 'Surgical precision. Targeted prompts, minimal tokens, maximum impact.'
  }
}

function calculateArchetype(
  input_tokens: number,
  output_tokens: number,
  total_tokens: number,
  vibe_score: number,
  cache_read_tokens: number = 0
): Archetype {
  // Avoid division by zero
  const inputSafe = Math.max(input_tokens, 1)
  const totalSafe = Math.max(total_tokens, 1)

  // Key ratios from boss's analysis:
  // - output/input: how much Claude generates vs what user types
  // - cache_read/total: how much pre-loaded context (full codebases, docs)
  // - vibe/tokens: efficiency score
  const outputInputRatio = output_tokens / inputSafe  // e.g., 0.79 = 79% = Claude outputs a lot
  const cacheRatio = cache_read_tokens / totalSafe    // e.g., 0.96 = 96% = loads massive context
  const vibeEfficiency = vibe_score / totalSafe       // higher = more efficient

  // Volume thresholds
  const isHighVolume = total_tokens > 500_000_000    // 500M+ tokens
  const isMediumVolume = total_tokens > 100_000_000  // 100M+ tokens
  const isLowVolume = total_tokens < 50_000_000      // under 50M tokens

  // Boss's analysis patterns:
  // Pablo (vibe-coder): output/input ~0.79, autonomous, lets Claude cook
  // Luis (architect): 1.7B tokens, 96% cache_read, loads massive context
  // Felipe (thinker): conversational, high vibe efficiency relative to tokens

  // 1. Architect: Loads massive context (high cache ratio + high volume)
  if (cacheRatio > 0.85 && isHighVolume) {
    return 'architect'
  }

  // 2. Vibe Coder: High output/input ratio - trusts Claude to generate
  if (outputInputRatio > 0.5 && isMediumVolume) {
    return 'vibe-coder'
  }

  // 3. Sniper: Low volume but efficient - surgical precision
  if (isLowVolume && vibeEfficiency > 0.003) {
    return 'sniper'
  }

  // 4. Grinder: High volume but low efficiency - many retries
  if (isMediumVolume && vibeEfficiency < 0.002) {
    return 'grinder'
  }

  // 5. Thinker: Conversational, medium efficiency, balanced approach
  if (vibeEfficiency > 0.003 || outputInputRatio < 0.3) {
    return 'thinker'
  }

  // Default based on volume
  if (isHighVolume) {
    return 'architect'
  }
  if (isMediumVolume) {
    return 'vibe-coder'
  }

  return 'sniper'
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number
  name: string
  total_tokens: number
  output_tokens: number
  input_tokens: number
  cache_read_tokens: number
  vibe_score: number
  total_cost: number
  days_active: number
  archetype: Archetype
}

export type SortMetric = 'vibe_score' | 'total_tokens' | 'output_tokens' | 'total_cost'

export type Period = 'today' | 'week' | 'month' | 'semester' | 'year' | 'all'

function formatLocalDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getPeriodDates(period: Period): { since: string; until: string; label: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = formatLocalDate(now)

  switch (period) {
    case 'today': {
      // Include yesterday to handle timezone differences (server UTC vs client local)
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      return { since: formatLocalDate(yesterday), until: today, label: 'Today' }
    }

    case 'week': {
      const dayOfWeek = now.getDay()
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(now)
      monday.setDate(now.getDate() - mondayOffset)
      return { since: monday.toISOString().split('T')[0], until: today, label: 'This Week' }
    }

    case 'month': {
      const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`
      return { since: firstOfMonth, until: today, label: `${now.toLocaleString('en', { month: 'long' })} ${year}` }
    }

    case 'semester': {
      const semesterStart = month < 6 ? `${year}-01-01` : `${year}-07-01`
      const semesterLabel = month < 6 ? `H1 ${year}` : `H2 ${year}`
      return { since: semesterStart, until: today, label: semesterLabel }
    }

    case 'year': {
      return { since: `${year}-01-01`, until: today, label: `${year}` }
    }

    case 'all':
    default:
      return { since: '2000-01-01', until: today, label: 'All Time' }
  }
}

export async function getLeaderboard(
  period: Period = 'month',
  sortBy: SortMetric = 'total_tokens'
): Promise<{ period: string; sortBy: SortMetric; leaderboard: LeaderboardEntry[] }> {
  const client = getDb()
  const { since, label } = getPeriodDates(period)

  // vibe_score = weighted efficiency score: (output*2 + input + tokens) / cost
  // Higher = more value per dollar spent. Rewards both output AND efficiency.
  const result = await client.execute({
    sql: `
      SELECT
        u.name,
        COALESCE(SUM(ds.total_tokens), 0) as total_tokens,
        COALESCE(SUM(ds.output_tokens), 0) as output_tokens,
        COALESCE(SUM(ds.input_tokens), 0) as input_tokens,
        COALESCE(SUM(ds.cache_read_tokens), 0) as cache_read_tokens,
        COALESCE(SUM(ds.cache_creation_tokens), 0) as cache_creation_tokens,
        CAST(
          (COALESCE(SUM(ds.output_tokens), 0) * 2 + COALESCE(SUM(ds.input_tokens), 0) + COALESCE(SUM(ds.total_tokens), 0))
          / MAX(COALESCE(SUM(ds.total_cost), 0.01), 0.01)
        AS INTEGER) as vibe_score,
        COALESCE(SUM(ds.total_cost), 0) as total_cost,
        COUNT(DISTINCT ds.date) as days_active
      FROM users u
      LEFT JOIN daily_stats ds ON u.id = ds.user_id AND ds.date >= ?
      GROUP BY u.id, u.name
      HAVING total_tokens > 0
      ORDER BY ${sortBy} DESC
    `,
    args: [since]
  })

  const rows = result.rows as unknown as Omit<LeaderboardEntry, 'rank' | 'archetype'>[]

  return {
    period: label,
    sortBy,
    leaderboard: rows.map((r, i) => ({
      ...r,
      rank: i + 1,
      archetype: calculateArchetype(
        r.input_tokens,
        r.output_tokens,
        r.total_tokens,
        r.vibe_score,
        r.cache_read_tokens
      )
    }))
  }
}

export async function getUserStats(userName: string, period: Period = 'month') {
  const client = getDb()
  const user = await getUser(userName)
  if (!user) return null

  const { since, label } = getPeriodDates(period)

  const statsResult = await client.execute({
    sql: `
      SELECT * FROM daily_stats
      WHERE user_id = ? AND date >= ?
      ORDER BY date DESC
    `,
    args: [user.id, since]
  })

  const totalsResult = await client.execute({
    sql: `
      SELECT
        SUM(total_tokens) as total_tokens,
        SUM(total_cost) as total_cost,
        COUNT(*) as days_active
      FROM daily_stats
      WHERE user_id = ? AND date >= ?
    `,
    args: [user.id, since]
  })

  const stats = statsResult.rows as unknown as DailyStats[]
  const totals = totalsResult.rows[0] as unknown as { total_tokens: number; total_cost: number; days_active: number }

  return { user, stats, totals, period: label }
}

export { getDb }
