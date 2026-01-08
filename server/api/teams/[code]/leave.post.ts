import { leaveTeam } from '../../../utils/db'

interface LeaveTeamBody {
  machine_id: string
  // Legacy support
  user_name?: string
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

  // Support both new (machine_id) and legacy (user_name) formats
  const machineId = body.machine_id || body.user_name

  if (!machineId) {
    throw createError({
      statusCode: 400,
      message: 'machine_id is required'
    })
  }

  const success = await leaveTeam(machineId, code)

  return { success }
})
