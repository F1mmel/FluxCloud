import { defineEventHandler, readBody } from 'h3'
import { getConfig } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const username = (body?.username || '').trim()

  if (!username) {
    return { exists: false, requiresPasswordSetup: false }
  }

  const config = getConfig()
  const users = config.users || []

  const found = users.find(u => u.username.toLowerCase() === username.toLowerCase())
  if (!found) {
    return { exists: false, requiresPasswordSetup: false }
  }

  return {
    exists: true,
    requiresPasswordSetup: found.passwordHash === null,
    username: found.username
  }
})
