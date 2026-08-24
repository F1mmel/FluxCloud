import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { 
  TRASH_DIR, 
  sanitizeRelativePath, 
  getTrashIndex, 
  saveTrashIndex, 
  getShares, 
  saveShares, 
  getMetadata, 
  saveMetadata,
  isShareTargetAvailable
} from '../utils/storage'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const body = await readBody(event)
  const relativePaths = body?.paths as string[]
  const isPermanent = body?.permanent === true

  if (!relativePaths || !Array.isArray(relativePaths) || relativePaths.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Paths array is required',
    })
  }

  const errors: string[] = []
  const trashIndex = getTrashIndex()
  let currentShares = getShares()
  const currentMeta = getMetadata()
  let sharesModified = false

  for (const relativePath of relativePaths) {
    const safePath = sanitizeRelativePath(relativePath)
    const userRelPath = `users/${username}/${safePath}`
    const fullPath = resolveUserUploadPath(username, safePath)

    try {
      const stats = await fs.stat(fullPath)
      const isDirectory = stats.isDirectory()
      const fileName = path.basename(fullPath)

      if (isPermanent) {
        if (isDirectory) {
          await fs.rm(fullPath, { recursive: true, force: true })
        } else {
          await fs.unlink(fullPath)
        }
      } else {
        // Soft delete into data/trash
        const trashId = crypto.randomUUID()
        const trashFileName = `${trashId}_${fileName}`
        const trashFullPath = path.join(TRASH_DIR, trashFileName)

        await fs.rename(fullPath, trashFullPath)

        trashIndex.unshift({
          id: trashId,
          originalPath: safePath,
          fileName,
          isDirectory,
          size: isDirectory ? 0 : stats.size,
          deletedAt: new Date().toISOString(),
          trashFileName
        })
      }

      // Cleanup favorite if present
      if (currentMeta.favorites) {
        currentMeta.favorites = currentMeta.favorites.filter(p => 
          p !== safePath && 
          !p.startsWith(`${safePath}/`) &&
          p !== userRelPath &&
          !p.startsWith(`${userRelPath}/`)
        )
      }

      // Cleanup direct tokens if present
      if (currentMeta.directTokens) {
        for (const tokenPath of Object.keys(currentMeta.directTokens)) {
          if (
            tokenPath === safePath || 
            tokenPath.startsWith(`${safePath}/`) ||
            tokenPath === userRelPath ||
            tokenPath.startsWith(`${userRelPath}/`)
          ) {
            delete currentMeta.directTokens[tokenPath]
          }
        }
      }

      // Cleanup shares matching this path
      const initialShareCount = currentShares.length
      currentShares = currentShares.filter(s => {
        if (s.targetPath === safePath || s.targetPath === userRelPath) return false
        if (s.targetPath.startsWith(`${safePath}/`) || s.targetPath.startsWith(`${userRelPath}/`)) return false
        return true
      })
      if (currentShares.length !== initialShareCount) {
        sharesModified = true
      }

    } catch (error: any) {
      errors.push(`Failed to delete ${relativePath}: ${error.message}`)
    }
  }

  // Final check: prune any dead shares whose files no longer exist
  const liveShares = currentShares.filter(s => isShareTargetAvailable(s, username))
  if (liveShares.length !== currentShares.length) {
    currentShares = liveShares
    sharesModified = true
  }

  if (sharesModified) {
    saveShares(currentShares)
  }

  if (!isPermanent) {
    saveTrashIndex(trashIndex)
  }
  saveMetadata(currentMeta)

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { 
    success: true, 
    message: isPermanent ? 'Items permanently deleted' : 'Items moved to trash' 
  }
})
