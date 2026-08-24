import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { defineEventHandler, getRouterParams, getQuery, setResponseHeaders, sendStream, createError } from 'h3'
import { resolveDirectToken, resolveUploadPath, getMimeType, getConfig } from '../../utils/storage'

const require = createRequire(import.meta.url)
const archiver = require('archiver')

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)
  const rawSlug = params.slug || ''
  const parts = Array.isArray(rawSlug) ? rawSlug : rawSlug.split('/')
  const token = parts[0] // e.g. /d/9f8e7d6c... or /d/9f8e7d6c.../filename.png

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token parameter is required'
    })
  }

  const relativePath = resolveDirectToken(token)
  if (!relativePath) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Direct CDN link not found or revoked'
    })
  }

  const filePath = resolveUploadPath(relativePath)

  if (!fs.existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found on server'
    })
  }

  const stat = fs.statSync(filePath)
  const config = getConfig()
  const query = getQuery(event)
  const isDownload = query.download === '1' || query.download === 'true'

  // If directory: Stream directly as fast zip archive
  if (stat.isDirectory()) {
    const archive = archiver('zip', { zlib: { level: 1 } })
    const baseName = path.basename(filePath)
    const zipName = baseName.endsWith('.zip') ? baseName : `${baseName}.zip`

    const headers: Record<string, string> = {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(zipName)}"`,
      'Cache-Control': 'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff'
    }

    if (config.corsAllowed) {
      headers['Access-Control-Allow-Origin'] = '*'
      headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
      headers['Access-Control-Allow-Headers'] = '*'
    }

    setResponseHeaders(event, headers)

    archive.directory(filePath, baseName)
    archive.finalize()

    return sendStream(event, archive)
  }

  const fileName = path.basename(filePath)
  const mimeType = getMimeType(fileName)

  const headers: Record<string, string> = {
    'Content-Type': mimeType,
    'Content-Length': stat.size.toString(),
    'Last-Modified': stat.mtime.toUTCString(),
    'ETag': `"${stat.size.toString(16)}-${stat.mtime.getTime().toString(16)}"`,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes'
  }

  if (config.corsAllowed) {
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
    headers['Access-Control-Allow-Headers'] = '*'
  }

  if (isDownload) {
    headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(fileName)}"`
  } else {
    headers['Content-Disposition'] = `inline; filename="${encodeURIComponent(fileName)}"`
  }

  setResponseHeaders(event, headers)

  const stream = fs.createReadStream(filePath)
  return sendStream(event, stream)
})
