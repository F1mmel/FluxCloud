import { defineEventHandler } from 'h3'
import { getUsers } from '../utils/auth'
import { requireAuth } from '../utils/auth'

export default defineEventHandler((event) => {
  const currentUser = requireAuth(event)
  const users = getUsers()

  return users
    .filter(u => u.username.toLowerCase() !== currentUser.username.toLowerCase())
    .map(u => ({
      username: u.username,
      role: u.role
    }))
})
