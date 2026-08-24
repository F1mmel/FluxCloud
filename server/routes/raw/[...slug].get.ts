import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getRouterParams, setResponseHeaders, sendStream, createError } from 'h3'
import { resolveUploadPath, getMimeType, getConfig } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)
  const rawSlug = params.slug || ''
  const relativePath = Array.isArray(rawSlug) ? rawSlug.join('/') : rawSlug

  if (!relativePath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path parameter is required'
    })
  }

  const filePath = resolveUploadPath(relativePath)

  if (!fs.existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found'
    })
  }

  const stat = fs.statSync(filePath)
  if (stat.isDirectory()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot serve directory directly'
    })
  }

  const config = getConfig()
  const mimeType = getMimeType(filePath)
  const fileName = path.basename(filePath)

  const headers: Record<string, string> = {
    'Content-Type': mimeType,
    'Content-Length': stat.size.toString(),
    'Last-Modified': stat.mtime.toUTCString(),
    'ETag': `"${stat.size.toString(16)}-${stat.mtime.getTime().toString(16)}"`,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
    'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`
  }

  if (config.corsAllowed) {
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
    headers['Access-Control-Allow-Headers'] = '*'
  }

  setResponseHeaders(event, headers)

  const stream = fs.createReadStream(filePath)
  return sendStream(event, stream)
})
