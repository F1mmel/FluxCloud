import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getQuery, createError } from 'h3'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'
import { sanitizeRelativePath } from '../utils/storage'
import { getFileVersions } from '../utils/versions'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const query = getQuery(event)
  const relativePath = sanitizeRelativePath((query?.path as string) || '')

  if (!relativePath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path parameter is required'
    })
  }

  const fullPath = resolveUserUploadPath(username, relativePath)
  let currentFile = null

  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath)
    if (!stat.isDirectory()) {
      currentFile = {
        name: path.basename(fullPath),
        size: stat.size,
        modifiedAt: stat.mtime.toISOString()
      }
    }
  }

  const versions = getFileVersions(username, relativePath)

  return {
    success: true,
    relativePath,
    currentFile,
    versions
  }
})
