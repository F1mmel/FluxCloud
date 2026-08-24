import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, readBody, createError } from 'h3'
import { 
  getOrCreateDirectToken, 
  resolveUploadPath, 
  sanitizeRelativePath, 
  getMimeType 
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

  const token = getOrCreateDirectToken(canonicalPath)
  const baseName = path.basename(fullPath)
  const directFileName = isDirectory ? `${baseName}.zip` : baseName
  const directUrl = `/d/${token}/${encodeURIComponent(directFileName)}`
  const directDownloadUrl = `/d/${token}/${encodeURIComponent(directFileName)}?download=1`

  return {
    success: true,
    token,
    fileName: baseName,
    isDirectory,
    directUrl,
    directDownloadUrl,
    mimeType: isDirectory ? 'application/zip' : getMimeType(baseName)
  }
})
