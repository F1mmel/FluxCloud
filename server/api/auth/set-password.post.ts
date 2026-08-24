import { defineEventHandler, readBody, createError } from 'h3'
import { getConfig, saveConfig } from '../../utils/storage'
import { 
  generateSalt, 
  hashUserPassword, 
  createSessionToken, 
  setAuthCookie, 
  getUserUploadsDir,
  getAuthenticatedUser
} from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const username = (body?.username || '').trim()
  const password = body?.password || ''

  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'Username is required' })
  }
  if (!password || password.length < 4) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 4 characters long' })
  }

  const config = getConfig()
  const users = config.users || []

  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase())
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  // If user already has a password, only self or admin can change it
  if (user.passwordHash) {
    const current = getAuthenticatedUser(event)
    if (!current || (current.username.toLowerCase() !== user.username.toLowerCase() && current.role !== 'admin')) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden. Cannot change password.' })
    }
  }

  // Generate new salt and hash
  const salt = generateSalt()
  const passwordHash = hashUserPassword(password, salt)

  user.salt = salt
  user.passwordHash = passwordHash
  user.lastLoginAt = new Date().toISOString()

  saveConfig({ users })

  // Ensure user directory
  getUserUploadsDir(user.username)

  // Set session cookie
  const token = createSessionToken(user)
  setAuthCookie(event, token)

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  }
})
