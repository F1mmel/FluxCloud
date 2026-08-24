import { defineEventHandler } from 'h3'
import { getConfig } from '../../utils/storage'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler((event) => {
  requireAdmin(event)
  const config = getConfig()
  const users = config.users || []

  const userList = users.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
    hasPassword: !!u.passwordHash
  }))

  return { users: userList }
})
