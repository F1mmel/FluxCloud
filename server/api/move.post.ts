import { promises as fs } from 'fs'
import path from 'path'
import { defineEventHandler, readBody, createError } from 'h3'
import { 
  sanitizeRelativePath, 
  getMetadata, 
  saveMetadata, 
  getShares, 
  saveShares, 
  updateDirectTokenPath 
} from '../utils/storage'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const body = await readBody(event)
  const relativeFrom = sanitizeRelativePath(body?.from || '')
  const relativeTo = sanitizeRelativePath(body?.to || '')

  if (!relativeFrom || !relativeTo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Source and destination paths are required',
    })
  }

  const userFromPath = `users/${username}/${relativeFrom}`
  const userToPath = `users/${username}/${relativeTo}`

  const fullFrom = resolveUserUploadPath(username, relativeFrom)
  const fullTo = resolveUserUploadPath(username, relativeTo)

  try {
    // Check if source exists
    await fs.access(fullFrom)

    // Ensure parent destination directory exists
    const toDir = path.dirname(fullTo)
    try {
      await fs.access(toDir)
    } catch {
      await fs.mkdir(toDir, { recursive: true })
    }

    await fs.rename(fullFrom, fullTo)

    // Update metadata favorites if path moved
    const meta = getMetadata()
    if (meta.favorites && meta.favorites.length > 0) {
      let updated = false
      meta.favorites = meta.favorites.map(fav => {
        if (fav === relativeFrom) {
          updated = true
          return relativeTo
        }
        if (fav.startsWith(`${relativeFrom}/`)) {
          updated = true
          return fav.replace(`${relativeFrom}/`, `${relativeTo}/`)
        }
        if (fav === userFromPath) {
          updated = true
          return userToPath
        }
        if (fav.startsWith(`${userFromPath}/`)) {
          updated = true
          return fav.replace(`${userFromPath}/`, `${userToPath}/`)
        }
        return fav
      })
      if (updated) {
        saveMetadata(meta)
      }
    }

    // Update direct tokens
    updateDirectTokenPath(relativeFrom, relativeTo)
    updateDirectTokenPath(userFromPath, userToPath)

    // Update shares target paths
    const shares = getShares()
    let sharesUpdated = false
    for (const share of shares) {
      if (share.targetPath === relativeFrom) {
        share.targetPath = relativeTo
        share.fileName = path.basename(relativeTo)
        sharesUpdated = true
      } else if (share.targetPath.startsWith(`${relativeFrom}/`)) {
        share.targetPath = share.targetPath.replace(`${relativeFrom}/`, `${relativeTo}/`)
        sharesUpdated = true
      } else if (share.targetPath === userFromPath) {
        share.targetPath = userToPath
        share.fileName = path.basename(relativeTo)
        sharesUpdated = true
      } else if (share.targetPath.startsWith(`${userFromPath}/`)) {
        share.targetPath = share.targetPath.replace(`${userFromPath}/`, `${userToPath}/`)
        sharesUpdated = true
      }
    }
    if (sharesUpdated) {
      saveShares(shares)
    }

    return { success: true, message: 'Item moved successfully' }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error moving item',
    })
  }
})
