import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { 
  getOrCreateDirectToken, 
  resolveUploadPath, 
  sanitizeRelativePath, 
  getMimeType,
  getShares,
  saveShares,
  ShareRecord
} from '../utils/storage'
import { getAuthenticatedUser, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthenticatedUser(event)
  const username = user?.username

  const body = await readBody(event)
  const relativePath = sanitizeRelativePath(body?.path || '')

  if (!relativePath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path is required'
    })
  }

  let fullPath: string | null = null
  let canonicalPath = relativePath

  if (username && !relativePath.startsWith('users/')) {
    const userPath = resolveUserUploadPath(username, relativePath)
    if (fs.existsSync(userPath)) {
      fullPath = userPath
      canonicalPath = `users/${username}/${relativePath}`
    }
  }

  if (!fullPath) {
    const uploadPath = resolveUploadPath(relativePath)
    if (fs.existsSync(uploadPath)) {
      fullPath = uploadPath
      canonicalPath = relativePath
    }
  }

  if (!fullPath || !fs.existsSync(fullPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File or folder not found'
    })
  }

  const stat = fs.statSync(fullPath)
  const isDirectory = stat.isDirectory()
  const baseName = path.basename(fullPath)

  // 1. Direct CDN Token
  const token = getOrCreateDirectToken(canonicalPath)
  const directFileName = isDirectory ? `${baseName}.zip` : baseName
  const directUrl = `/d/${token}/${encodeURIComponent(directFileName)}`
  const directDownloadUrl = `/d/${token}/${encodeURIComponent(directFileName)}?download=1`

  // 2. Public Share Landing Page Token
  const shares = getShares()
  let share = shares.find(s => s.targetPath === canonicalPath && (!s.username || s.username.toLowerCase() === username?.toLowerCase()))
  if (!share) {
    let shareId = crypto.randomBytes(6).toString('hex')
    while (shares.some(s => s.id === shareId)) {
      shareId = crypto.randomBytes(6).toString('hex')
    }
    const newShare: ShareRecord = {
      id: shareId,
      targetPath: canonicalPath,
      isDirectory,
      fileName: baseName,
      passwordHash: null,
      expiresAt: null,
      maxDownloads: null,
      downloadCount: 0,
      viewCount: 0,
      viewOnly: false,
      allowUploads: false,
      hideContents: false,
      sharedWithUser: null,
      permission: 'read',
      createdAt: new Date().toISOString(),
      username: username || null
    }
    shares.unshift(newShare)
    saveShares(shares)
    share = newShare
  }

  const publicShareUrl = `/s/${share.id}`

  return {
    success: true,
    token,
    shareId: share.id,
    publicShareUrl,
    fileName: baseName,
    isDirectory,
    directUrl,
    directDownloadUrl,
    mimeType: isDirectory ? 'application/zip' : getMimeType(baseName)
  }
})
