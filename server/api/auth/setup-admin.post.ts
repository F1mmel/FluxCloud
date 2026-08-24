import crypto from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { getConfig, saveConfig, type UserRecord } from '../../utils/storage'
import { generateSalt, hashUserPassword, createSessionToken, setAuthCookie, getUserUploadsDir } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const users = config.users || []

  // Only allow initial setup if no users exist
  if (users.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Administrator account already exists. Please log in.'
    })
  }

  const body = await readBody(event)
  const username = (body?.username || '').trim()
  const password = body?.password || ''

  if (!username || username.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Username must be at least 2 characters long' })
  }
  if (!password || password.length < 4) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 4 characters long' })
  }

  const salt = generateSalt()
  const passwordHash = hashUserPassword(password, salt)

  const adminUser: UserRecord = {
    id: crypto.randomUUID(),
    username,
    role: 'admin',
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  }

  saveConfig({
    users: [adminUser]
  })

  // Ensure user folder exists
  getUserUploadsDir(username)

  // Set session cookie
  const token = createSessionToken(adminUser)
  setAuthCookie(event, token)

  return {
    success: true,
    user: {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role
    }
  }
})
