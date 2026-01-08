import { getUser, getUserTeams } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')

  if (!name) {
    throw createError({
      statusCode: 400,
      message: 'Username is required'
    })
  }

  const user = await getUser(name)
  if (!user) {
    // User doesn't exist yet, return empty teams
    return { teams: [] }
  }

  const teams = await getUserTeams(name)

  return {
    teams: teams.map(t => ({
      code: t.code,
      name: t.name,
      visibility: t.visibility,
      image_url: t.image_url
    }))
  }
})
