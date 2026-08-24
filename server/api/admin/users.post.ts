import crypto from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { getConfig, saveConfig, type UserRecord } from '../../utils/storage'
import { requireAdmin, getUserUploadsDir } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)

  const username = (body?.username || '').trim()
  const role = body?.role === 'admin' ? 'admin' : 'user'

  if (!username || username.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Username must be at least 2 characters long' })
  }

  // Restrict username to alphanumeric characters, dashes, and underscores
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(username)) {
    throw createError({ statusCode: 400, statusMessage: 'Username can only contain letters, numbers, dashes, and dots' })
  }

  const config = getConfig()
  const users = config.users || []

  // Check uniqueness
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw createError({ statusCode: 400, statusMessage: `User "${username}" already exists` })
  }

  const newUser: UserRecord = {
    id: crypto.randomUUID(),
    username,
    role,
    passwordHash: null, // Password will be chosen by the user on their first login!
    salt: '',
    createdAt: new Date().toISOString()
  }

  users.push(newUser)
  saveConfig({ users })

  // Initialize isolated user folder
  getUserUploadsDir(username)

  return {
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      createdAt: newUser.createdAt,
      hasPassword: false
    }
  }
})
