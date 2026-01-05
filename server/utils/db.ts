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

// Leaderboard
export interface LeaderboardEntry {
  rank: number
  name: string
  total_tokens: number
  total_cost: number
  days_active: number
  avg_tokens_per_day: number
}

export type Period = 'today' | 'week' | 'month' | 'semester' | 'year' | 'all'

export function getPeriodDates(period: Period): { since: string; until: string; label: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.toISOString().split('T')[0]

  switch (period) {
    case 'today':
      return { since: today, until: today, label: 'Today' }

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

export async function getLeaderboard(period: Period = 'month'): Promise<{ period: string; leaderboard: LeaderboardEntry[] }> {
  const client = getDb()
  const { since, label } = getPeriodDates(period)

  const result = await client.execute({
    sql: `
      SELECT
        u.name,
        SUM(ds.total_tokens) as total_tokens,
        SUM(ds.total_cost) as total_cost,
        COUNT(DISTINCT ds.date) as days_active,
        CAST(SUM(ds.total_tokens) AS REAL) / MAX(COUNT(DISTINCT ds.date), 1) as avg_tokens_per_day
      FROM users u
      LEFT JOIN daily_stats ds ON u.id = ds.user_id AND ds.date >= ?
      GROUP BY u.id, u.name
      HAVING total_tokens > 0
      ORDER BY total_tokens DESC
    `,
    args: [since]
  })

  const rows = result.rows as unknown as Omit<LeaderboardEntry, 'rank'>[]

  return {
    period: label,
    leaderboard: rows.map((r, i) => ({ ...r, rank: i + 1 }))
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
