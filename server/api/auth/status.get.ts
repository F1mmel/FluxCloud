import { defineEventHandler } from 'h3'
import { getConfig } from '../../utils/storage'
import { getAuthenticatedUser } from '../../utils/auth'

export default defineEventHandler((event) => {
  const config = getConfig()
  const users = config.users || []
  const hasUsers = users.length > 0

  const user = getAuthenticatedUser(event)

  return {
    hasUsers,
    currentUser: user ? {
      id: user.id,
      username: user.username,
      role: user.role
    } : null
  }
})
