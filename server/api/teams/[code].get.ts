import { getTeamByCode, getTeamMembers } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Team code is required'
    })
  }

  const team = await getTeamByCode(code)

  if (!team) {
    throw createError({
      statusCode: 404,
      message: 'Team not found'
    })
  }

  const members = await getTeamMembers(code)

  return {
    ...team,
    members,
    member_count: members.length
  }
})
