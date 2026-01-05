import { bulkUpsertStats, type StatsPayload } from '../utils/db'

interface SubmitBody {
  user: string
  daily: StatsPayload[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SubmitBody>(event)

  if (!body.user || typeof body.user !== 'string') {
    throw createError({ statusCode: 400, message: 'user is required' })
  }

  if (!Array.isArray(body.daily) || body.daily.length === 0) {
    throw createError({ statusCode: 400, message: 'daily stats array is required' })
  }

  try {
    await bulkUpsertStats(body.user, body.daily)
    return { success: true, message: `Synced ${body.daily.length} days for ${body.user}` }
  } catch (err: any) {
    throw createError({ statusCode: 500, message: err.message })
  }
})
