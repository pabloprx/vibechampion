import { getAllUsers } from '../../utils/db'

export default defineEventHandler(() => {
  return getAllUsers()
})
