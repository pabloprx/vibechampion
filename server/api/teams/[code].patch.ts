import { updateTeam, getTeamByCode } from '../../utils/db'

interface UpdateTeamBody {
  name?: string
  image_url?: string
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody<UpdateTeamBody>(event)

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Team code is required'
    })
  }

  const existing = await getTeamByCode(code)
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Team not found'
    })
  }

  const team = await updateTeam(code, body)
  return team
})
