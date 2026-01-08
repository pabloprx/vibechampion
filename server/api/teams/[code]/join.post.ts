import { joinTeam, getTeamByCode, type Visibility } from '../../../utils/db'

interface JoinTeamBody {
  machine_id: string
  display_name: string
  visibility?: Visibility
  // Legacy support
  user_name?: string
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

  // Support both new (machine_id) and legacy (user_name) formats
  const machineId = body.machine_id || body.user_name
  const displayName = body.display_name || body.user_name || 'Unknown'

  if (!machineId) {
    throw createError({
      statusCode: 400,
      message: 'machine_id is required'
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
  const result = await joinTeam(machineId, displayName, code, visibility)

  return {
    success: true,
    team: result.team,
    user: result.user,
    visibility: result.visibility
  }
})
