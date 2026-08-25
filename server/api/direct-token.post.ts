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

  // 1. Direct CDN Token (stored in direct_tokens.json, completely independent of public shares)
  const token = getOrCreateDirectToken(canonicalPath)
  const directFileName = isDirectory ? `${baseName}.zip` : baseName
  const directUrl = `/d/${token}/${encodeURIComponent(directFileName)}`
  const directDownloadUrl = `/d/${token}/${encodeURIComponent(directFileName)}?download=1`
  const directPreviewPageUrl = `/s/d-${token}`

  // 2. Check if a public share already exists (do NOT auto-create one)
  const shares = getShares()
  const existingShare = shares.find(s => s.targetPath === canonicalPath && (!s.username || s.username.toLowerCase() === username?.toLowerCase()))

  return {
    success: true,
    token,
    directPreviewPageUrl,
    shareId: existingShare ? existingShare.id : null,
    publicShareUrl: existingShare ? `/s/${existingShare.id}` : null,
    fileName: baseName,
    isDirectory,
    directUrl,
    directDownloadUrl,
    mimeType: isDirectory ? 'application/zip' : getMimeType(baseName)
  }
})
