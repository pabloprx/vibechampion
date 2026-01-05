import { getAllUsers } from '../../utils/db'

export default defineEventHandler(async () => {
  return await getAllUsers()
})
