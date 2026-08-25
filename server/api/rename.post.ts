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
import { broadcastFileEvent } from '../utils/events'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const body = await readBody(event)
  const relativePath = sanitizeRelativePath(body?.path || '')
  const newName = (body?.newName || '').trim()

  if (!relativePath || !newName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path and newName are required',
    })
  }

  const safeNewName = path.basename(newName).replace(/[\\/:\*\?"<>\|]/g, '_')
  const parentDir = path.dirname(relativePath)
  const newRelativePath = parentDir === '.' ? safeNewName : `${parentDir}/${safeNewName}`

  const userOldPath = `users/${username}/${relativePath}`
  const userNewPath = `users/${username}/${newRelativePath}`

  const sourceFullPath = resolveUserUploadPath(username, relativePath)
  const targetFullPath = resolveUserUploadPath(username, newRelativePath)

  if (sourceFullPath === targetFullPath) {
    return { success: true, newPath: relativePath }
  }

  try {
    await fs.access(sourceFullPath)

    // Ensure target doesn't already exist
    try {
      await fs.access(targetFullPath)
      throw createError({
        statusCode: 409,
        statusMessage: 'An item with this name already exists'
      })
    } catch (err: any) {
      if (err.statusCode === 409) throw err
      // File doesn't exist, which is expected
    }

    await fs.rename(sourceFullPath, targetFullPath)

    // Update metadata favorites
    const meta = getMetadata()
    if (meta.favorites && meta.favorites.length > 0) {
      meta.favorites = meta.favorites.map(fav => {
        if (fav === relativePath) return newRelativePath
        if (fav.startsWith(`${relativePath}/`)) return fav.replace(`${relativePath}/`, `${newRelativePath}/`)
        if (fav === userOldPath) return userNewPath
        if (fav.startsWith(`${userOldPath}/`)) return fav.replace(`${userOldPath}/`, `${userNewPath}/`)
        return fav
      })
      saveMetadata(meta)
    }

    // Update direct tokens
    updateDirectTokenPath(relativePath, newRelativePath)
    updateDirectTokenPath(userOldPath, userNewPath)

    // Update shares
    const shares = getShares()
    let sharesUpdated = false
    for (const share of shares) {
      if (share.targetPath === relativePath) {
        share.targetPath = newRelativePath
        share.fileName = safeNewName
        sharesUpdated = true
      } else if (share.targetPath.startsWith(`${relativePath}/`)) {
        share.targetPath = share.targetPath.replace(`${relativePath}/`, `${newRelativePath}/`)
        sharesUpdated = true
      } else if (share.targetPath === userOldPath) {
        share.targetPath = userNewPath
        share.fileName = safeNewName
        sharesUpdated = true
      } else if (share.targetPath.startsWith(`${userOldPath}/`)) {
        share.targetPath = share.targetPath.replace(`${userOldPath}/`, `${userNewPath}/`)
        sharesUpdated = true
      }
    }
    if (sharesUpdated) {
      saveShares(shares)
    }

    broadcastFileEvent(username, 'rename', { path: relativePath, targetPath: newRelativePath })

    return { 
      success: true, 
      message: 'Item renamed successfully',
      newPath: newRelativePath,
      newName: safeNewName
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Error renaming item',
    })
  }
})
