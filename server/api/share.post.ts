import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { 
  resolveUploadPath, 
  sanitizeRelativePath, 
  getShares, 
  saveShares, 
  hashPassword,
  ShareRecord 
} from '../utils/storage'
import { getAuthenticatedUser, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthenticatedUser(event)
  const username = user?.username

  const body = await readBody(event)
  const relativePath = sanitizeRelativePath(body?.path || '')
  
  if (!relativePath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path is required'
    })
  }

  // Resolve target path and verify existence
  let fullPath: string | null = null
  let canonicalTargetPath = relativePath

  if (username && !relativePath.startsWith('users/')) {
    const userPath = resolveUserUploadPath(username, relativePath)
    if (fs.existsSync(userPath)) {
      fullPath = userPath
      canonicalTargetPath = `users/${username}/${relativePath}`
    }
  }

  if (!fullPath) {
    const uploadPath = resolveUploadPath(relativePath)
    if (fs.existsSync(uploadPath)) {
      fullPath = uploadPath
      canonicalTargetPath = relativePath
    }
  }

  if (!fullPath || !fs.existsSync(fullPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item does not exist'
    })
  }

  const stat = fs.statSync(fullPath)
  const isDirectory = stat.isDirectory()
  const fileName = path.basename(fullPath)

  // Compute expiry
  let expiresAt: string | null = null
  const expiresIn = body?.expiresIn || 'never'
  const now = Date.now()

  if (expiresIn === '1h') {
    expiresAt = new Date(now + 60 * 60 * 1000).toISOString()
  } else if (expiresIn === '1d') {
    expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString()
  } else if (expiresIn === '7d') {
    expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
  } else if (expiresIn === '30d') {
    expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString()
  } else if (typeof expiresIn === 'string' && expiresIn.includes('-')) {
    // Custom date string
    expiresAt = new Date(expiresIn).toISOString()
  }

  const enablePassword = body?.enablePassword
  const password = typeof body?.password === 'string' && body.password.trim() ? body.password.trim() : null
  const maxDownloads = typeof body?.maxDownloads === 'number' && body.maxDownloads > 0 ? body.maxDownloads : null
  const viewOnly = body?.viewOnly === true

  const shares = getShares()

  const existingShareIndex = shares.findIndex(s => {
    if (body?.shareId && s.id === body.shareId) return true
    if (s.targetPath === canonicalTargetPath && (!s.username || s.username.toLowerCase() === username?.toLowerCase())) return true
    return false
  })

  let shareId = existingShareIndex >= 0 ? shares[existingShareIndex].id : crypto.randomBytes(6).toString('hex')
  while (existingShareIndex < 0 && shares.some(s => s.id === shareId)) {
    shareId = crypto.randomBytes(6).toString('hex')
  }

  const existing = existingShareIndex >= 0 ? shares[existingShareIndex] : null

  let finalPasswordHash: string | null = null
  if (enablePassword === false) {
    finalPasswordHash = null
  } else if (password) {
    finalPasswordHash = hashPassword(password)
  } else if (enablePassword === true && existing?.passwordHash) {
    finalPasswordHash = existing.passwordHash
  } else if (enablePassword === undefined) {
    finalPasswordHash = password ? hashPassword(password) : (existing?.passwordHash || null)
  }

  const allowUploads = isDirectory && body?.allowUploads === true
  const hideContents = isDirectory && body?.hideContents === true
  const sharedWithUser = typeof body?.sharedWithUser === 'string' && body.sharedWithUser.trim() ? body.sharedWithUser.trim() : null
  const permission = body?.permission === 'write' ? 'write' : 'read'

  const newShare: ShareRecord = {
    id: shareId,
    targetPath: canonicalTargetPath,
    isDirectory,
    fileName,
    passwordHash: finalPasswordHash,
    expiresAt,
    maxDownloads,
    downloadCount: existing ? existing.downloadCount : 0,
    viewCount: existing ? existing.viewCount : 0,
    viewOnly,
    allowUploads,
    hideContents,
    sharedWithUser,
    permission,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    username: username || null
  }

  if (existingShareIndex >= 0) {
    shares[existingShareIndex] = newShare
  } else {
    shares.unshift(newShare)
  }
  saveShares(shares)

  return {
    success: true,
    share: {
      id: newShare.id,
      targetPath: newShare.targetPath,
      isDirectory: newShare.isDirectory,
      fileName: newShare.fileName,
      hasPassword: !!finalPasswordHash,
      expiresAt: newShare.expiresAt,
      maxDownloads: newShare.maxDownloads,
      downloadCount: newShare.downloadCount,
      viewCount: newShare.viewCount,
      viewOnly: newShare.viewOnly,
      allowUploads: newShare.allowUploads,
      hideContents: newShare.hideContents,
      sharedWithUser: newShare.sharedWithUser,
      permission: newShare.permission,
      createdAt: newShare.createdAt,
      shareUrl: `/s/${newShare.id}`
    }
  }
})
