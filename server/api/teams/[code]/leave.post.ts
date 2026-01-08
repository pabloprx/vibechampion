import { leaveTeam } from '../../../utils/db'

interface LeaveTeamBody {
  user_name: string
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody<LeaveTeamBody>(event)

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

  const success = await leaveTeam(body.user_name, code)

  return { success }
})
