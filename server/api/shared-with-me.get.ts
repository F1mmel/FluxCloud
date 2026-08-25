import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler } from 'h3'
import { getShares, resolveShareFullPath, getMimeType } from '../utils/storage'
import { requireAuth } from '../utils/auth'

export default defineEventHandler((event) => {
  const user = requireAuth(event)
  const username = user.username.toLowerCase()
  const shares = getShares()
  const now = new Date()

  const sharedWithMe = shares.filter(s => {
    // Check if designated for this user
    if (!s.sharedWithUser || s.sharedWithUser.toLowerCase() !== username) {
      return false
    }

    // Check expiration
    if (s.expiresAt && new Date(s.expiresAt) <= now) {
      return false
    }

    // Check disk presence
    const fullPath = resolveShareFullPath(s)
    if (!fullPath || !fs.existsSync(fullPath)) {
      return false
    }

    return true
  })

  return sharedWithMe.map(s => {
    const fullPath = resolveShareFullPath(s)!
    let stat: fs.Stats | null = null
    try {
      stat = fs.statSync(fullPath)
    } catch {}

    const isDir = s.isDirectory
    const size = stat ? stat.size : 0
    const url = `/uploads/${encodeURI(s.targetPath)}`
    const isMedia = !isDir && /\.(jpg|jpeg|png|webp|gif|svg|mp4|webm|mov|mkv)$/i.test(s.fileName)

    return {
      id: s.id,
      name: s.fileName,
      targetPath: s.targetPath,
      isDirectory: isDir,
      size,
      mimeType: isDir ? 'directory' : getMimeType(s.fileName),
      owner: s.username || 'System',
      permission: s.permission || 'read', // 'read' | 'write'
      url,
      thumbnailUrl: isMedia ? `/api/thumbnail?path=${encodeURIComponent(s.targetPath)}` : null,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      shareUrl: `/s/${s.id}`
    }
  })
})
