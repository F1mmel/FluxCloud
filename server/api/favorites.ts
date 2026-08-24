import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, readBody, getMethod, createError } from 'h3'
import { 
  getMetadata, 
  saveMetadata, 
  sanitizeRelativePath, 
  resolveUploadPath, 
  getMimeType 
} from '../utils/storage'
import { getAuthenticatedUser, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const user = getAuthenticatedUser(event)
  const username = user?.username
  const meta = getMetadata()
  meta.favorites = meta.favorites || []

  if (method === 'GET') {
    // Return full items that exist and are favorited
    const results = []
    const validFavorites = []

    for (const relPath of meta.favorites) {
      let fullPath: string | null = null
      let urlPath = relPath

      if (username && !relPath.startsWith('users/')) {
        const candidate = resolveUserUploadPath(username, relPath)
        if (fs.existsSync(candidate)) {
          fullPath = candidate
          urlPath = `users/${username}/${relPath}`
        }
      }

      if (!fullPath) {
        const candidate = resolveUploadPath(relPath)
        if (fs.existsSync(candidate)) {
          fullPath = candidate
          urlPath = relPath
        }
      }

      if (fullPath && fs.existsSync(fullPath)) {
        validFavorites.push(relPath)
        const stat = fs.statSync(fullPath)
        const isDirectory = stat.isDirectory()
        const ext = isDirectory ? '' : path.extname(relPath).toLowerCase()

        results.push({
          name: path.basename(relPath),
          relativePath: relPath,
          isDirectory,
          size: isDirectory ? 0 : stat.size,
          createdAt: stat.birthtime.toISOString(),
          modifiedAt: stat.mtime.toISOString(),
          url: isDirectory ? null : `/uploads/${encodeURI(urlPath)}`,
          mimeType: isDirectory ? 'directory' : getMimeType(relPath),
          extension: ext,
          isFavorite: true
        })
      }
    }

    if (validFavorites.length !== meta.favorites.length) {
      meta.favorites = validFavorites
      saveMetadata(meta)
    }

    return results
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const relPath = sanitizeRelativePath(body?.path || '')

    if (!relPath) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Path is required'
      })
    }

    const index = meta.favorites.indexOf(relPath)
    let isFav = false

    if (index >= 0) {
      meta.favorites.splice(index, 1)
      isFav = false
    } else {
      meta.favorites.push(relPath)
      isFav = true
    }

    saveMetadata(meta)
    return { success: true, isFavorite: isFav, path: relPath }
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
