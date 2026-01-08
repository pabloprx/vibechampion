// Development-only endpoint to seed test data with different archetypes
import { bulkUpsertStats, type StatsPayload } from '../utils/db'

// Test users designed to trigger each archetype:
// - vibe-coder: high output/input ratio (>0.15%), high volume
// - architect: low output/input (<0.05%), very high total (>100M)
// - thinker: low output/input, high vibe efficiency (>0.3)
// - grinder: high total, low vibe efficiency (<0.1)
// - sniper: low total (<50M), high output ratio

interface TestUser {
  name: string
  targetArchetype: string
  input: number
  output: number
  cache_read: number
  cache_create: number
  total: number
  cost: number
}

const TEST_USERS: TestUser[] = [
  {
    name: 'Pablo',
    targetArchetype: 'vibe-coder',
    // High output/input ratio (~0.33%), trusts Claude
    input: 500_000_000,
    output: 1_700_000,
    cache_read: 10_000_000,
    cache_create: 5_000_000,
    total: 517_000_000,
    cost: 150
  },
  {
    name: 'Luis',
    targetArchetype: 'architect',
    // Low output/input (~0.03%), massive total (1.7B)
    input: 1_600_000_000,
    output: 472_000,
    cache_read: 80_000_000,
    cache_create: 20_000_000,
    total: 1_700_000_000,
    cost: 500
  },
  {
    name: 'Felipe',
    targetArchetype: 'thinker',
    // Low output/input (~0.03%), but high vibe efficiency
    input: 250_000_000,
    output: 82_000,
    cache_read: 20_000_000,
    cache_create: 3_000_000,
    total: 273_000_000,
    cost: 80
  },
  {
    name: 'Carlos',
    targetArchetype: 'grinder',
    // High total, low vibe efficiency - many retries
    input: 800_000_000,
    output: 50_000,
    cache_read: 5_000_000,
    cache_create: 45_000_000,
    total: 850_000_000,
    cost: 400
  },
  {
    name: 'Maria',
    targetArchetype: 'sniper',
    // Low total (<50M), but high output ratio - surgical precision
    input: 30_000_000,
    output: 100_000,
    cache_read: 1_000_000,
    cache_create: 500_000,
    total: 32_000_000,
    cost: 10
  },
  {
    name: 'Diego',
    targetArchetype: 'vibe-coder',
    // Another vibe-coder for variety
    input: 200_000_000,
    output: 600_000,
    cache_read: 8_000_000,
    cache_create: 2_000_000,
    total: 210_000_000,
    cost: 60
  },
  {
    name: 'Ana',
    targetArchetype: 'architect',
    // Another architect
    input: 400_000_000,
    output: 150_000,
    cache_read: 90_000_000,
    cache_create: 10_000_000,
    total: 500_000_000,
    cost: 180
  }
]

export default defineEventHandler(async (event) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      message: 'Seed endpoint disabled in production'
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const results: { name: string; archetype: string }[] = []

  for (const user of TEST_USERS) {
    const stats: StatsPayload = {
      date: today,
      inputTokens: user.input,
      outputTokens: user.output,
      cacheCreationTokens: user.cache_create,
      cacheReadTokens: user.cache_read,
      totalTokens: user.total,
      totalCost: user.cost,
      modelsUsed: ['claude-sonnet-4-20250514']
    }

    await bulkUpsertStats(user.name, [stats])
    results.push({ name: user.name, archetype: user.targetArchetype })
  }

  return {
    success: true,
    seeded: results,
    message: `Seeded ${results.length} test users with different archetypes`
  }
})
