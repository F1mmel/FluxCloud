import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, readBody, createError } from 'h3'
import { sanitizeRelativePath, getShares, resolveShareFullPath } from '../utils/storage'
import { getAuthenticatedUser, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const targetPath = (body?.targetPath as string) || ''
  const fileName = (body?.fileName as string) || ''
  const shareId = (body?.shareId as string) || ''

  if (!fileName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'fileName is required'
    })
  }

  const user = getAuthenticatedUser(event)
  let targetFolder = ''

  if (shareId) {
    const shares = getShares()
    const share = shares.find(s => s.id === shareId)
    if (!share) {
      throw createError({ statusCode: 404, statusMessage: 'Share not found' })
    }
    const shareRoot = resolveShareFullPath(share)
    const safeRel = sanitizeRelativePath(targetPath)
    targetFolder = path.join(shareRoot, safeRel)
  } else {
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    targetFolder = resolveUserUploadPath(user.username, targetPath)
  }

  const safeFileName = path.basename(fileName).replace(/[\\/:\*\?"<>\|]/g, '_')
  const targetFilePath = path.join(targetFolder, safeFileName)

  if (!fs.existsSync(targetFilePath)) {
    return {
      exists: false
    }
  }

  try {
    const stats = fs.statSync(targetFilePath)
    return {
      exists: true,
      existingFile: {
        name: safeFileName,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
        isDirectory: stats.isDirectory()
      }
    }
  } catch {
    return {
      exists: false
    }
  }
})
