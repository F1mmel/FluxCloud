import { promises as fs } from 'fs'
import fsClassic from 'fs'
import path from 'path'
import { defineEventHandler, getRouterParams, getQuery, getHeaders, readMultipartFormData, createError } from 'h3'
import { 
  getShares, 
  resolveShareFullPath, 
  getMimeType, 
  sanitizeRelativePath, 
  getConfig,
  hashPassword 
} from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)
  const id = params.id
  const query = getQuery(event)
  const subpath = sanitizeRelativePath((query.subpath as string) || '')

  const shares = getShares()
  const share = shares.find(s => s.id === id)

  if (!share) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Share link not found'
    })
  }

  // Check expiration
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    throw createError({
      statusCode: 410,
      statusMessage: 'This share link has expired'
    })
  }

  if (!share.isDirectory) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Uploads are only allowed for shared folders'
    })
  }

  if (!share.allowUploads) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Guest uploads are disabled for this shared folder'
    })
  }

  // Password verification if protected
  if (share.passwordHash) {
    const headers = getHeaders(event)
    const providedPassword = (headers['x-share-password'] as string) || ''
    if (!providedPassword || hashPassword(providedPassword) !== share.passwordHash) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Password required to upload to this folder'
      })
    }
  }

  const baseFullPath = resolveShareFullPath(share)
  if (!baseFullPath || !fsClassic.existsSync(baseFullPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Target folder no longer exists on server'
    })
  }

  const targetFullPath = subpath ? path.join(baseFullPath, subpath) : baseFullPath
  if (!fsClassic.existsSync(targetFullPath)) {
    await fs.mkdir(targetFullPath, { recursive: true })
  }

  const config = getConfig()
  const maxBytes = (config.maxUploadSizeMB || 1024) * 1024 * 1024

  const uploadedFiles: Array<{ name: string, size: number, mimeType: string }> = []
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No files provided for upload'
    })
  }

  for (const part of formData) {
    if (!part.filename || !part.data) continue

    const safeFilename = path.basename(part.filename).replace(/[\\/:\*\?"<>\|]/g, '_')
    if (!safeFilename) continue

    if (part.data.length > maxBytes) {
      throw createError({
        statusCode: 413,
        statusMessage: `File "${safeFilename}" exceeds max upload limit of ${config.maxUploadSizeMB}MB`
      })
    }

    const destPath = path.join(targetFullPath, safeFilename)
    await fs.writeFile(destPath, part.data)

    uploadedFiles.push({
      name: safeFilename,
      size: part.data.length,
      mimeType: part.type || getMimeType(safeFilename)
    })
  }

  return {
    success: true,
    count: uploadedFiles.length,
    files: uploadedFiles
  }
})
