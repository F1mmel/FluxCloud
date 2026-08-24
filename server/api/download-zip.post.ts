import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { defineEventHandler, readBody, getHeader, setResponseHeaders, sendStream, createError } from 'h3'
import { resolveUploadPath, sanitizeRelativePath } from '../utils/storage'
import { getAuthenticatedUser, resolveUserUploadPath } from '../utils/auth'

const require = createRequire(import.meta.url)
const archiver = require('archiver')

export default defineEventHandler(async (event) => {
  const user = getAuthenticatedUser(event)
  const username = user?.username

  let relativePaths: string[] = []
  let archiveName = 'fluxcloud_download'

  const contentType = getHeader(event, 'content-type') || ''
  const body = await readBody(event)

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    archiveName = (body?.zipName || 'fluxcloud_download').replace(/[\\/:\*\?"<>\|]/g, '_')
    if (typeof body?.paths === 'string') {
      try {
        const parsed = JSON.parse(body.paths)
        if (Array.isArray(parsed)) relativePaths = parsed
        else relativePaths = [body.paths]
      } catch {
        relativePaths = [body.paths]
      }
    } else if (Array.isArray(body?.paths)) {
      relativePaths = body.paths
    }
  } else {
    archiveName = (body?.zipName || 'fluxcloud_download').replace(/[\\/:\*\?"<>\|]/g, '_')
    relativePaths = Array.isArray(body?.paths) ? body.paths : []
  }

  if (!relativePaths || relativePaths.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Paths array is required'
    })
  }

  // Fast level 1 compression starts streaming chunks instantly in <10ms
  const archive = archiver('zip', {
    zlib: { level: 1 }
  })

  archive.on('warning', (err: any) => {
    console.warn('[Archiver Warning]', err)
  })

  archive.on('error', (err: any) => {
    console.error('[Archiver Error]', err)
  })

  const filename = `${archiveName.endsWith('.zip') ? archiveName : archiveName + '.zip'}`

  setResponseHeaders(event, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    'Cache-Control': 'no-cache, no-transform',
    'X-Content-Type-Options': 'nosniff'
  })

  // Append files/directories
  for (const relPath of relativePaths) {
    const safeRel = sanitizeRelativePath(relPath)
    let fullPath: string | null = null

    if (username && !safeRel.startsWith('users/')) {
      const userPath = resolveUserUploadPath(username, safeRel)
      if (fs.existsSync(userPath)) {
        fullPath = userPath
      }
    }

    if (!fullPath) {
      const uploadPath = resolveUploadPath(safeRel)
      if (fs.existsSync(uploadPath)) {
        fullPath = uploadPath
      }
    }

    if (!fullPath || !fs.existsSync(fullPath)) continue

    const stat = fs.statSync(fullPath)
    const baseName = path.basename(fullPath)

    if (stat.isDirectory()) {
      archive.directory(fullPath, baseName)
    } else {
      archive.file(fullPath, { name: baseName })
    }
  }

  archive.finalize()

  return sendStream(event, archive)
})
