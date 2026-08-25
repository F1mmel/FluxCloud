import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, readBody, createError } from 'h3'
import { sanitizeRelativePath } from '../utils/storage'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const body = await readBody(event)
  const relativePath = sanitizeRelativePath(body?.path || '')
  let folderName = (body?.name || 'New Folder').trim() || 'New Folder'

  // Prevent directory traversal and invalid chars
  let safeFolderName = folderName.replace(/[\\/:\*\?"<>\|]/g, '_')
  
  const parentDir = resolveUserUploadPath(username, relativePath)
  if (!fs.existsSync(parentDir)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Parent directory not found',
    })
  }

  // Handle unique folder incrementing
  let targetFolderDir = path.join(parentDir, safeFolderName)
  let counter = 1
  const baseName = safeFolderName
  while (fs.existsSync(targetFolderDir)) {
    safeFolderName = `${baseName} (${counter})`
    targetFolderDir = path.join(parentDir, safeFolderName)
    counter++
  }

  try {
    fs.mkdirSync(targetFolderDir, { recursive: true })
    const newFolderRelative = relativePath ? `${relativePath}/${safeFolderName}` : safeFolderName
    return { 
      success: true, 
      folderName: safeFolderName,
      message: 'Folder created successfully',
      path: sanitizeRelativePath(newFolderRelative)
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error creating folder',
    })
  }
})
