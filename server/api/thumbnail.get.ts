import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getQuery, getHeader, setResponseHeaders, setResponseStatus, sendStream, createError } from 'h3'
import { resolveUploadPath, getFileCategory, getMimeType, getConfig } from '../utils/storage'
import { getAuthenticatedUser, getUserUploadsDir } from '../utils/auth'
import { getOrGenerateThumbnail } from '../utils/thumbnail'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawPath = (query.path as string) || ''

  if (!rawPath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path query parameter is required'
    })
  }

  const config = getConfig()
  const apiKeyHeader = getHeader(event, 'x-api-key') || ''
  const apiKeyQuery = (query.key as string) || ''
  const clientKey = apiKeyHeader || apiKeyQuery

  const user = getAuthenticatedUser(event)

  // Determine user context and physical file path
  let relativePath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '')
  let targetUser = user ? user.username : 'global'
  let filePath = resolveUploadPath(relativePath)

  // If path doesn't start with users/ and we have an authenticated user, check user folder
  if (!relativePath.startsWith('users/') && user) {
    const userDir = getUserUploadsDir(user.username)
    const cand = path.join(userDir, relativePath)
    if (fs.existsSync(cand)) {
      filePath = cand
      targetUser = user.username
    }
  } else if (relativePath.startsWith('users/')) {
    const parts = relativePath.split('/')
    if (parts.length > 1) {
      targetUser = parts[1]
    }
  }

  // Security check: If not logged in and no valid API key, check if path is protected
  if (!user && (!clientKey || clientKey !== config.apiKey)) {
    // For direct security, allow if valid token is provided or check shares if needed
    // Default: block unauthorized access
    throw createError({
      statusCode: 403,
      statusMessage: 'Unauthorized thumbnail access'
    })
  }

  if (!fs.existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Source file not found'
    })
  }

  let stat: fs.Stats
  try {
    stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot generate thumbnail for a directory'
      })
    }
  } catch {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not accessible'
    })
  }

  const category = getFileCategory(path.basename(filePath))
  const isVideo = category === 'video'
  const isImage = category === 'image'

  if (!isImage && !isVideo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thumbnails are only supported for images and videos'
    })
  }

  // Generate or retrieve cached thumbnail
  const { thumbPath } = await getOrGenerateThumbnail(targetUser, relativePath, filePath, isVideo)

  if (thumbPath && fs.existsSync(thumbPath)) {
    const thumbStat = fs.statSync(thumbPath)
    const headers: Record<string, string> = {
      'Content-Type': 'image/webp',
      'Content-Length': thumbStat.size.toString(),
      'Last-Modified': thumbStat.mtime.toUTCString(),
      'ETag': `"${thumbStat.size.toString(16)}-${thumbStat.mtime.getTime().toString(16)}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes'
    }

    if (config.corsAllowed) {
      headers['Access-Control-Allow-Origin'] = '*'
      headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
      headers['Access-Control-Allow-Headers'] = '*'
    }

    setResponseHeaders(event, headers)
    const stream = fs.createReadStream(thumbPath)
    return sendStream(event, stream)
  }

  // Fallback: If it's an image and thumbnail generation failed (e.g. ffmpeg not installed), serve original image
  if (isImage) {
    const mimeType = getMimeType(filePath)
    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Content-Length': stat.size.toString(),
      'Last-Modified': stat.mtime.toUTCString(),
      'ETag': `"${stat.size.toString(16)}-${stat.mtime.getTime().toString(16)}"`,
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes'
    }

    if (config.corsAllowed) {
      headers['Access-Control-Allow-Origin'] = '*'
    }

    setResponseHeaders(event, headers)
    const stream = fs.createReadStream(filePath)
    return sendStream(event, stream)
  }

  // If video and thumbnail generation is not available (no ffmpeg), return 404 so frontend displays video icon
  throw createError({
    statusCode: 404,
    statusMessage: 'Thumbnail unavailable'
  })
})
