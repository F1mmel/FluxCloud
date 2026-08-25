import { defineEventHandler } from 'h3'
import { getThumbnailCacheStats } from '../../utils/storage'
import { getAuthenticatedUser } from '../../utils/auth'

export default defineEventHandler((event) => {
  const user = getAuthenticatedUser(event)
  if (!user) {
    return { count: 0, totalBytes: 0 }
  }

  if (user.role === 'admin') {
    return getThumbnailCacheStats()
  }

  return getThumbnailCacheStats(user.username)
})
