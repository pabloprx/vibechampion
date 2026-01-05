import { getUserStats, type Period } from '../../utils/db'

const validPeriods: Period[] = ['today', 'week', 'month', 'semester', 'year', 'all']

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  const query = getQuery(event)
  let period = (query.period as Period) || 'month'

  if (!validPeriods.includes(period)) {
    period = 'month'
  }

  if (!name) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }

  const stats = await getUserStats(name, period)

  if (!stats) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return stats
})
