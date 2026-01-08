import { createTeam, getTeamByCode } from '../../utils/db'

interface CreateTeamBody {
  code: string
  name: string
  image_url?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateTeamBody>(event)

  if (!body.code || !body.name) {
    throw createError({
      statusCode: 400,
      message: 'code and name are required'
    })
  }

  // Validate code format: alphanumeric, hyphens, 3-20 chars
  const codeRegex = /^[a-zA-Z0-9-]{3,20}$/
  if (!codeRegex.test(body.code)) {
    throw createError({
      statusCode: 400,
      message: 'code must be 3-20 alphanumeric characters or hyphens'
    })
  }

  // Check if team already exists
  const existing = await getTeamByCode(body.code)
  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Team with this code already exists'
    })
  }

  const team = await createTeam(body.code, body.name, body.image_url)
  return team
})
