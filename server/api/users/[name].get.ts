import { getUserStats, getUser, getUserByName, type Period } from '../../utils/db'

const validPeriods: Period[] = ['today', 'week', 'month', 'semester', 'year', 'all']

export default defineEventHandler(async (event) => {
  const identifier = getRouterParam(event, 'name')
  const query = getQuery(event)
  let period = (query.period as Period) || 'month'

  if (!validPeriods.includes(period)) {
    period = 'month'
  }

  if (!identifier) {
    throw createError({ statusCode: 400, message: 'identifier is required' })
  }

  // Try machine_id first, fallback to name (legacy)
  let user = await getUser(identifier)
  if (!user) {
    user = await getUserByName(identifier)
  }

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const stats = await getUserStats(user.machine_id, period)

  if (!stats) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return stats
})
