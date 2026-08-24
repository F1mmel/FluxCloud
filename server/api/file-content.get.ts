import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getQuery, createError } from 'h3'
import { sanitizeRelativePath, getMimeType } from '../utils/storage'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler((event) => {
  const user = requireAuth(event)
  const username = user.username

  const query = getQuery(event)
  const relativePath = sanitizeRelativePath((query.path as string) || '')

  if (!relativePath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path parameter is required'
    })
  }

  const fullPath = resolveUserUploadPath(username, relativePath)

  if (!fs.existsSync(fullPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found'
    })
  }

  const stat = fs.statSync(fullPath)
  if (stat.isDirectory()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot read directory content as text'
    })
  }

  // Max 5MB for preview
  if (stat.size > 5 * 1024 * 1024) {
    throw createError({
      statusCode: 413,
      statusMessage: 'File is too large for inline text preview (>5MB)'
    })
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf-8')
    const fileName = path.basename(fullPath)
    const ext = path.extname(fileName).toLowerCase()
    
    return {
      fileName,
      relativePath,
      size: stat.size,
      mimeType: getMimeType(fileName),
      extension: ext,
      content
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read file content: ${err.message}`
    })
  }
})
