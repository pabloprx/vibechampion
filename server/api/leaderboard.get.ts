import { getLeaderboard, type Period, type SortMetric } from '../utils/db'

const validPeriods: Period[] = ['today', 'week', 'month', 'semester', 'year', 'all']
const validMetrics: SortMetric[] = ['vibe_score', 'total_tokens', 'output_tokens', 'total_cost']

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  let period = (query.period as Period) || 'month'
  let sortBy = (query.sortBy as SortMetric) || 'total_tokens'

  if (!validPeriods.includes(period)) {
    period = 'month'
  }
  if (!validMetrics.includes(sortBy)) {
    sortBy = 'vibe_score'
  }

  return await getLeaderboard(period, sortBy)
})
