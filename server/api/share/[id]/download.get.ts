import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { defineEventHandler, getRouterParams, getQuery, setResponseHeaders, sendStream, createError } from 'h3'
import { 
  getShares, 
  saveShares, 
  resolveShareFullPath, 
  getMimeType, 
  sanitizeRelativePath,
  hashPassword 
} from '../../../utils/storage'

const require = createRequire(import.meta.url)
const archiver = require('archiver')

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)
  const id = params.id
  const query = getQuery(event)
  const pwd = (query.pwd as string) || ''
  const subpath = sanitizeRelativePath((query.subpath as string) || '')
  const isInline = query.inline === '1' || query.inline === 'true'

  const shares = getShares()
  const share = shares.find(s => s.id === id)

  if (!share) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Share link not found'
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

  // Check password
  if (share.passwordHash) {
    if (!pwd || hashPassword(pwd) !== share.passwordHash) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Password required or incorrect'
      })
    }
  }

  // Check view-only
  if (share.viewOnly && !isInline) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Downloads are disabled for this view-only share'
    })
  }

  const baseFullPath = resolveShareFullPath(share)
  if (!baseFullPath || !fs.existsSync(baseFullPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File or folder no longer exists on server'
    })
  }

  const targetFullPath = subpath ? path.join(baseFullPath, subpath) : baseFullPath
  if (!fs.existsSync(targetFullPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Requested item not found'
    })
  }

  const stat = fs.statSync(targetFullPath)

  // Increment download count if downloading root
  if (!isInline && !subpath) {
    share.downloadCount = (share.downloadCount || 0) + 1
    saveShares(shares)
  }

  if (stat.isDirectory()) {
    // Stream folder as ZIP instantly with level 1 compression
    const archive = archiver('zip', { zlib: { level: 1 } })
    const baseName = path.basename(targetFullPath)
    const zipName = `${baseName}.zip`

    setResponseHeaders(event, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(zipName)}"`,
      'Cache-Control': 'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff'
    })

    archive.directory(targetFullPath, baseName)
    archive.finalize()
    return sendStream(event, archive)
  }

  // Single file streaming
  const fileName = path.basename(targetFullPath)
  const mimeType = getMimeType(fileName)
  const disposition = isInline ? 'inline' : 'attachment'

  setResponseHeaders(event, {
    'Content-Type': mimeType,
    'Content-Length': stat.size.toString(),
    'Content-Disposition': `${disposition}; filename="${encodeURIComponent(fileName)}"`,
    'Cache-Control': 'public, max-age=86400',
    'Accept-Ranges': 'bytes'
  })

  const stream = fs.createReadStream(targetFullPath)
  return sendStream(event, stream)
})
