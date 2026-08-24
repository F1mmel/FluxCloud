import { defineEventHandler, readBody, createError } from 'h3'
import { getConfig, saveConfig } from '../../utils/storage'
import { verifyUserPassword, createSessionToken, setAuthCookie, getUserUploadsDir } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const username = (body?.username || '').trim()
  const password = body?.password || ''

  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'Username is required' })
  }

  const config = getConfig()
  const users = config.users || []

  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase())
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid username or password' })
  }

  // Check if user has not set a password yet (first-time login)
  if (!user.passwordHash) {
    return {
      success: true,
      requiresPasswordSetup: true,
      username: user.username
    }
  }

  // Verify password
  if (!password || !verifyUserPassword(password, user.salt, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid username or password' })
  }

  // Update lastLoginAt
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
