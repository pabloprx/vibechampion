import Database from 'better-sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), '.data', 'vibechampion.db')
const db = new Database(dbPath)

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS daily_stats (
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
  );

  CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
  CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date);
`)

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
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
  totalTokens: number
  totalCost: number
  modelsUsed: string[]
}

// User operations
export function getOrCreateUser(name: string): User {
  const existing = db.prepare('SELECT * FROM users WHERE name = ?').get(name) as User | undefined
  if (existing) return existing

  const result = db.prepare('INSERT INTO users (name) VALUES (?)').run(name)
  return { id: result.lastInsertRowid as number, name, created_at: new Date().toISOString() }
}

export function getUser(name: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE name = ?').get(name) as User | undefined
}

export function getAllUsers(): User[] {
  return db.prepare('SELECT * FROM users ORDER BY name').all() as User[]
}

// Stats operations
export function upsertDailyStats(userId: number, stats: StatsPayload): void {
  db.prepare(`
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
  `).run(
    userId,
    stats.date,
    stats.inputTokens,
    stats.outputTokens,
    stats.cacheCreationTokens,
    stats.cacheReadTokens,
    stats.totalTokens,
    stats.totalCost,
    JSON.stringify(stats.modelsUsed)
  )
}

export function bulkUpsertStats(userName: string, dailyStats: StatsPayload[]): void {
  const user = getOrCreateUser(userName)
  const insertMany = db.transaction((stats: StatsPayload[]) => {
    for (const s of stats) {
      upsertDailyStats(user.id, s)
    }
  })
  insertMany(dailyStats)
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
      // H1: Jan-Jun, H2: Jul-Dec
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

export function getLeaderboard(period: Period = 'month'): { period: string; leaderboard: LeaderboardEntry[] } {
  const { since, label } = getPeriodDates(period)

  const rows = db.prepare(`
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
  `).all(since) as Omit<LeaderboardEntry, 'rank'>[]

  return {
    period: label,
    leaderboard: rows.map((r, i) => ({ ...r, rank: i + 1 }))
  }
}

export function getUserStats(userName: string, period: Period = 'month') {
  const user = getUser(userName)
  if (!user) return null

  const { since, label } = getPeriodDates(period)

  const stats = db.prepare(`
    SELECT * FROM daily_stats
    WHERE user_id = ? AND date >= ?
    ORDER BY date DESC
  `).all(user.id, since) as DailyStats[]

  const totals = db.prepare(`
    SELECT
      SUM(total_tokens) as total_tokens,
      SUM(total_cost) as total_cost,
      COUNT(*) as days_active
    FROM daily_stats
    WHERE user_id = ? AND date >= ?
  `).get(user.id, since) as { total_tokens: number; total_cost: number; days_active: number }

  return { user, stats, totals, period: label }
}

export default db
