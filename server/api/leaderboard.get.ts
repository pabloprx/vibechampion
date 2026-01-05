import { getLeaderboard, type Period } from '../utils/db'

const validPeriods: Period[] = ['today', 'week', 'month', 'semester', 'year', 'all']

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  let period = (query.period as Period) || 'month'

  if (!validPeriods.includes(period)) {
    period = 'month'
  }

  return await getLeaderboard(period)
})
