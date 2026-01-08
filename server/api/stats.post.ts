import { bulkUpsertStats, type StatsPayload } from '../utils/db'

interface SubmitBody {
  machine_id: string
  display_name: string
  // Legacy support
  user?: string
  daily: StatsPayload[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SubmitBody>(event)

  // Support both new (machine_id) and legacy (user) formats
  const machineId = body.machine_id || body.user
  const displayName = body.display_name || body.user || 'Unknown'

  if (!machineId || typeof machineId !== 'string') {
    throw createError({ statusCode: 400, message: 'machine_id is required' })
  }

  if (!Array.isArray(body.daily) || body.daily.length === 0) {
    throw createError({ statusCode: 400, message: 'daily stats array is required' })
  }

  try {
    await bulkUpsertStats(machineId, displayName, body.daily)
    return { success: true, message: `Synced ${body.daily.length} days for ${displayName}` }
  } catch (err: any) {
    throw createError({ statusCode: 500, message: err.message })
  }
})
