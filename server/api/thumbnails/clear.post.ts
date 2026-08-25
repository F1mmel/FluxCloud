import { defineEventHandler, createError } from 'h3'
import { clearThumbnailCache, getThumbnailCacheStats } from '../../utils/storage'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'admin') {
    // Regular users can only clear their own thumbnails; admins can clear all
    const stats = clearThumbnailCache(user.username)
    return { success: true, ...stats }
  }

  // Admin: Clear all thumbnails
  const stats = clearThumbnailCache()
  return { success: true, ...stats }
})
