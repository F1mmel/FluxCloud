import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, readBody, getMethod, createError } from 'h3'
import { 
  TRASH_DIR, 
  getTrashIndex, 
  saveTrashIndex, 
  resolveUploadPath, 
  sanitizeRelativePath,
  getShares,
  saveShares,
  isShareTargetAvailable
} from '../utils/storage'
import { getAuthenticatedUser, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const trash = getTrashIndex()
  const user = getAuthenticatedUser(event)
  const username = user?.username

  if (method === 'GET') {
    // Return all items in trash that still physically exist in TRASH_DIR
    const validTrash = []
    for (const item of trash) {
      const itemFullPath = path.join(TRASH_DIR, item.trashFileName)
      if (fs.existsSync(itemFullPath)) {
        validTrash.push(item)
      }
    }
    if (validTrash.length !== trash.length) {
      saveTrashIndex(validTrash)
    }
    return validTrash
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const action = body?.action as 'restore' | 'empty' | 'delete'
    const id = body?.id as string

    if (action === 'restore') {
      const itemIndex = trash.findIndex(t => t.id === id)
      if (itemIndex === -1) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Trash item not found'
        })
      }

      const item = trash[itemIndex]
      const trashFullPath = path.join(TRASH_DIR, item.trashFileName)

      if (!fs.existsSync(trashFullPath)) {
        trash.splice(itemIndex, 1)
        saveTrashIndex(trash)
        throw createError({
          statusCode: 404,
          statusMessage: 'Item file missing in trash'
        })
      }

      let targetFullPath = (username && !item.originalPath.startsWith('users/'))
        ? resolveUserUploadPath(username, item.originalPath)
        : resolveUploadPath(item.originalPath)
      
      // If target path already exists, find non-conflicting name
      if (fs.existsSync(targetFullPath)) {
        const dir = path.dirname(targetFullPath)
        const ext = path.extname(item.fileName)
        const base = path.basename(item.fileName, ext)
        let counter = 1
        while (fs.existsSync(path.join(dir, `${base} (Restored ${counter})${ext}`))) {
          counter++
        }
        targetFullPath = path.join(dir, `${base} (Restored ${counter})${ext}`)
      }

      const targetDir = path.dirname(targetFullPath)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      fs.renameSync(trashFullPath, targetFullPath)
      trash.splice(itemIndex, 1)
      saveTrashIndex(trash)

      return { success: true, message: 'Item restored successfully' }
    }

    if (action === 'empty') {
      for (const item of trash) {
        const itemFullPath = path.join(TRASH_DIR, item.trashFileName)
        if (fs.existsSync(itemFullPath)) {
          const stat = fs.statSync(itemFullPath)
          if (stat.isDirectory()) {
            fs.rmSync(itemFullPath, { recursive: true, force: true })
          } else {
            fs.unlinkSync(itemFullPath)
          }
        }
      }
      saveTrashIndex([])

      // Prune dead shares
      const shares = getShares()
      const liveShares = shares.filter(s => isShareTargetAvailable(s, username))
      if (liveShares.length !== shares.length) {
        saveShares(liveShares)
      }

      return { success: true, message: 'Trash emptied successfully' }
    }

    if (action === 'delete') {
      const itemIndex = trash.findIndex(t => t.id === id)
      if (itemIndex === -1) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Trash item not found'
        })
      }

      const item = trash[itemIndex]
      const trashFullPath = path.join(TRASH_DIR, item.trashFileName)

      if (fs.existsSync(trashFullPath)) {
        const stat = fs.statSync(trashFullPath)
        if (stat.isDirectory()) {
          fs.rmSync(trashFullPath, { recursive: true, force: true })
        } else {
          fs.unlinkSync(trashFullPath)
        }
      }

      trash.splice(itemIndex, 1)
      saveTrashIndex(trash)

      // Prune dead shares
      const shares = getShares()
      const liveShares = shares.filter(s => isShareTargetAvailable(s, username))
      if (liveShares.length !== shares.length) {
        saveShares(liveShares)
      }

      return { success: true, message: 'Item permanently deleted' }
    }

    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid action. Supported: restore, empty, delete'
    })
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
