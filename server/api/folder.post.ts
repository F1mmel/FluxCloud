import { promises as fs } from 'fs'
import { defineEventHandler, readBody, createError } from 'h3'
import { sanitizeRelativePath } from '../utils/storage'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const body = await readBody(event)
  const relativePath = body?.path || ''
  const folderName = (body?.name || '').trim()

  if (!folderName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Folder name is required',
    })
  }

  // Prevent directory traversal and invalid chars
  const safeFolderName = folderName.replace(/[\\/:\*\?"<>\|]/g, '_')
  const newFolderRelative = relativePath ? `${relativePath}/${safeFolderName}` : safeFolderName
  const newFolderDir = resolveUserUploadPath(username, newFolderRelative)

  try {
    await fs.mkdir(newFolderDir, { recursive: true })
    return { 
      success: true, 
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
