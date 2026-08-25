import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, readBody, createError } from 'h3'
import { sanitizeRelativePath } from '../utils/storage'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'
import { createFileVersionSnapshot } from '../utils/versions'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const body = await readBody(event)
  const relativePath = sanitizeRelativePath((body?.path as string) || '')
  const content = body?.content

  if (!relativePath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path parameter is required'
    })
  }

  if (typeof content !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Content string is required'
    })
  }

  const fullPath = resolveUserUploadPath(username, relativePath)

  if (!fs.existsSync(fullPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found on server'
    })
  }

  const stat = fs.statSync(fullPath)
  if (stat.isDirectory()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot write content to a directory'
    })
  }

  // Create version snapshot of current content before overwriting
  await createFileVersionSnapshot(username, relativePath, 'Saved via Code Editor')

  fs.writeFileSync(fullPath, content, 'utf-8')

  const newStat = fs.statSync(fullPath)

  return {
    success: true,
    fileName: path.basename(fullPath),
    relativePath,
    size: newStat.size,
    modifiedAt: newStat.mtime.toISOString()
  }
})
