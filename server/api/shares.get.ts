import { defineEventHandler } from 'h3'
import { getShares, saveShares, isShareTargetAvailable } from '../utils/storage'
import { getAuthenticatedUser } from '../utils/auth'

export default defineEventHandler((event) => {
  const user = getAuthenticatedUser(event)
  const username = user?.username
  const shares = getShares()
  const now = new Date()

  // Filter out expired shares and shares whose underlying files/folders no longer exist
  const validShares = shares.filter(s => {
    // 1. Check expiration
    if (s.expiresAt && new Date(s.expiresAt) <= now) {
      return false
    }

    // 2. Check if file or directory physically exists on disk
    if (!isShareTargetAvailable(s, username)) {
      return false
    }

    return true
  })

  // Auto-prune dead/expired shares from shares.json if changed
  if (validShares.length !== shares.length) {
    saveShares(validShares)
  }

  // Filter by user if authenticated and not admin
  const userShares = validShares.filter(s => {
    if (!user || user.role === 'admin') return true
    if (s.username) return s.username.toLowerCase() === username?.toLowerCase()
    if (s.targetPath.startsWith(`users/${username}/`)) return true
    if (!s.targetPath.startsWith('users/')) return true
    return false
  })

  return userShares.map(s => {
    // Format display path (remove users/<username>/ prefix for clean UI)
    let displayPath = s.targetPath
    if (username && displayPath.startsWith(`users/${username}/`)) {
      displayPath = displayPath.slice(`users/${username}/`.length)
    } else if (displayPath.startsWith('users/')) {
      const parts = displayPath.split('/')
      if (parts.length > 2) {
        displayPath = parts.slice(2).join('/')
      }
    }

    return {
      id: s.id,
      shareUrl: `/s/${s.id}`,
      targetPath: s.targetPath,
      displayPath,
      isDirectory: s.isDirectory,
      fileName: s.fileName,
      hasPassword: !!s.passwordHash,
      expiresAt: s.expiresAt,
      maxDownloads: s.maxDownloads,
      downloadCount: s.downloadCount,
      viewCount: s.viewCount,
      viewOnly: s.viewOnly,
      allowUploads: !!s.allowUploads,
      hideContents: !!s.hideContents,
      sharedWithUser: s.sharedWithUser || null,
      permission: s.permission || 'read',
      createdAt: s.createdAt
    }
  })
})
