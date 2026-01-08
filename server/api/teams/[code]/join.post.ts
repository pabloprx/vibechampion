import { joinTeam, getTeamByCode, type Visibility } from '../../../utils/db'

interface JoinTeamBody {
  user_name: string
  visibility?: Visibility
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody<JoinTeamBody>(event)

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Team code is required'
    })
  }

  if (!body.user_name) {
    throw createError({
      statusCode: 400,
      message: 'user_name is required'
    })
  }

  const team = await getTeamByCode(code)
  if (!team) {
    throw createError({
      statusCode: 404,
      message: 'Team not found'
    })
  }

  const visibility = body.visibility || 'both'
  const result = await joinTeam(body.user_name, code, visibility)

  return {
    success: true,
    team: result.team,
    user: result.user,
    visibility: result.visibility
  }
})
