import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, readBody, createError } from 'h3'
import { getConfig, saveConfig, UPLOADS_DIR } from '../../utils/storage'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const currentAdmin = requireAdmin(event)
  const body = await readBody(event)
  const targetId = body?.id || body?.userId || ''
  const targetUsername = (body?.username || '').trim()

  const config = getConfig()
  let users = config.users || []

  const targetIndex = users.findIndex(u => (targetId && u.id === targetId) || (targetUsername && u.username.toLowerCase() === targetUsername.toLowerCase()))

  if (targetIndex === -1) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const targetUser = users[targetIndex]

  // Prevent admin from deleting themselves
  if (targetUser.id === currentAdmin.id || targetUser.username.toLowerCase() === currentAdmin.username.toLowerCase()) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot delete your own account' })
  }

  // Remove from users list
  users.splice(targetIndex, 1)
  saveConfig({ users })

  // Clean up user's storage folder
  try {
    const safeName = targetUser.username.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    const userDir = path.join(UPLOADS_DIR, 'users', safeName)
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true })
    }
  } catch (err) {
    console.error('Error removing deleted user folder:', err)
  }

  return { success: true, deletedUsername: targetUser.username }
})
