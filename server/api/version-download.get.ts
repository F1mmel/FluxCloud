import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getQuery, createError, setResponseHeaders, sendStream } from 'h3'
import { requireAuth } from '../utils/auth'
import { sanitizeRelativePath, VERSIONS_DIR } from '../utils/storage'
import { getFileVersions } from '../utils/versions'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const query = getQuery(event)
  const relativePath = sanitizeRelativePath((query?.path as string) || '')
  const versionId = (query?.versionId as string) || ''

  if (!relativePath || !versionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path and versionId parameters are required'
    })
  }

  const versions = getFileVersions(username, relativePath)
  const version = versions.find(v => v.id === versionId)

  if (!version) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Version not found'
    })
  }

  const storedFullPath = path.join(VERSIONS_DIR, username, version.storedFileName)
  if (!fs.existsSync(storedFullPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Version file is missing on disk'
    })
  }

  const stat = fs.statSync(storedFullPath)
  const parsed = path.parse(version.fileName)
  const downloadName = `${parsed.name}_v${version.versionNumber}${parsed.ext}`

  setResponseHeaders(event, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
    'Content-Length': stat.size.toString()
  })

  return sendStream(event, fs.createReadStream(storedFullPath))
})
