import { getUser, getUserTeams, getUserByName } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const identifier = getRouterParam(event, 'name')

  if (!identifier) {
    throw createError({
      statusCode: 400,
      message: 'User identifier is required'
    })
  }

  // Try machine_id first, fallback to name (legacy)
  let user = await getUser(identifier)
  if (!user) {
    user = await getUserByName(identifier)
  }

  if (!user) {
    // User doesn't exist yet, return empty teams
    return { teams: [] }
  }

  const teams = await getUserTeams(user.machine_id)

  return {
    teams: teams.map(t => ({
      code: t.code,
      name: t.name,
      visibility: t.visibility,
      image_url: t.image_url
    }))
  }
})
