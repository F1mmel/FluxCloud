import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getRouterParams, createError } from 'h3'
import { 
  getShares, 
  saveShares, 
  resolveShareFullPath, 
  getMimeType, 
  getConfig 
} from '../../utils/storage'

export default defineEventHandler((event) => {
  const params = getRouterParams(event)
  const id = params.id

  const shares = getShares()
  const share = shares.find(s => s.id === id)

  if (!share) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Share link not found or expired'
    })
  }

  // Check expiration
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    throw createError({
      statusCode: 410,
      statusMessage: 'This share link has expired'
    })
  }

  // Check download limits
  if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
    throw createError({
      statusCode: 410,
      statusMessage: 'Download limit reached for this share link'
    })
  }

  const targetFullPath = resolveShareFullPath(share)
  if (!targetFullPath || !fs.existsSync(targetFullPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Target file or folder no longer exists'
    })
  }

  const stat = fs.statSync(targetFullPath)
  const isDirectory = stat.isDirectory()
  const mimeType = isDirectory ? 'directory' : getMimeType(share.fileName)
  const ext = isDirectory ? '' : path.extname(share.fileName).toLowerCase()

  // Increment view count
  share.viewCount = (share.viewCount || 0) + 1
  saveShares(shares)

  const config = getConfig()

  return {
    id: share.id,
    fileName: share.fileName,
    isDirectory,
    size: isDirectory ? 0 : stat.size,
    mimeType,
    extension: ext,
    hasPassword: !!share.passwordHash,
    expiresAt: share.expiresAt,
    maxDownloads: share.maxDownloads,
    downloadCount: share.downloadCount,
    viewOnly: share.viewOnly,
    allowUploads: !!share.allowUploads,
    hideContents: !!share.hideContents,
    createdAt: share.createdAt,
    serverBranding: {
      siteName: config.siteName,
      color: config.color,
      logo: config.logo,
      backgroundImage: config.sharePageBackgroundEnabled ? (config.backgroundImage || '') : '',
      backgroundBlur: config.backgroundBlur ?? 2,
      backgroundBrightness: config.backgroundBrightness ?? 100,
      sharePageBackgroundEnabled: !!config.sharePageBackgroundEnabled
    }
  }
})
