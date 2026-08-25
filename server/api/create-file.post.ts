import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, readBody, createError } from 'h3'
import { sanitizeRelativePath } from '../utils/storage'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const body = await readBody(event)
  const folder = sanitizeRelativePath((body?.folder as string) || '')
  let fileName = ((body?.name as string) || '').trim() || 'New Text Document.txt'
  const content = typeof body?.content === 'string' ? body.content : ''

  // Sanitize filename
  fileName = fileName.replace(/[\\/:\*\?"<>\|]/g, '_')
  if (!path.extname(fileName)) {
    fileName += '.txt'
  }

  const targetDir = resolveUserUploadPath(username, folder)
  if (!fs.existsSync(targetDir)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Folder not found on server'
    })
  }

  // Handle unique name incrementing
  let targetFilePath = path.join(targetDir, fileName)
  const parsed = path.parse(fileName)
  let counter = 1
  while (fs.existsSync(targetFilePath)) {
    fileName = `${parsed.name} (${counter})${parsed.ext}`
    targetFilePath = path.join(targetDir, fileName)
    counter++
  }

  fs.writeFileSync(targetFilePath, content, 'utf-8')
  const stat = fs.statSync(targetFilePath)

  const relativePath = folder ? `${folder}/${fileName}` : fileName

  return {
    success: true,
    fileName,
    relativePath: sanitizeRelativePath(relativePath),
    size: stat.size,
    modifiedAt: stat.mtime.toISOString()
  }
})
