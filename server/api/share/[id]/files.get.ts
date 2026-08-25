import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getRouterParams, getQuery, createError } from 'h3'
import { 
  getShares, 
  resolveShareFullPath, 
  getMimeType, 
  getFileCategory,
  sanitizeRelativePath, 
  hashPassword 
} from '../../../utils/storage'

export default defineEventHandler((event) => {
  const params = getRouterParams(event)
  const id = params.id
  const query = getQuery(event)
  const pwd = (query.pwd as string) || ''
  const subpath = sanitizeRelativePath((query.subpath as string) || '')

  const shares = getShares()
  const share = shares.find(s => s.id === id)

  if (!share) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Share link not found or expired'
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
      statusMessage: 'Share is not a directory'
    })
  }

  // Check password
  if (share.passwordHash) {
    if (!pwd || hashPassword(pwd) !== share.passwordHash) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Password required or incorrect'
      })
    }
  }

  // Check if blind upload / folder contents hidden
  if (share.hideContents) {
    return {
      success: true,
      currentPath: '',
      folderName: share.fileName,
      files: [],
      isBlindUpload: true
    }
  }

  const baseFullPath = resolveShareFullPath(share)
  if (!baseFullPath || !fs.existsSync(baseFullPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Shared folder no longer exists'
    })
  }

  const targetDir = subpath ? path.join(baseFullPath, subpath) : baseFullPath
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Folder path not found'
    })
  }

  const entries = fs.readdirSync(targetDir, { withFileTypes: true })
  const pwdParam = pwd ? `&pwd=${encodeURIComponent(pwd)}` : ''

  const files = entries.map(entry => {
    const itemFullPath = path.join(targetDir, entry.name)
    const itemRelPath = subpath ? `${subpath}/${entry.name}` : entry.name
    let stat: fs.Stats
    try {
      stat = fs.statSync(itemFullPath)
    } catch {
      return null
    }

    const isDirectory = entry.isDirectory()
    const mimeType = isDirectory ? 'directory' : getMimeType(entry.name)
    const category = getFileCategory(entry.name, isDirectory)
    const ext = isDirectory ? '' : path.extname(entry.name).toLowerCase()

    return {
      name: entry.name,
      relativePath: itemRelPath,
      isDirectory,
      size: isDirectory ? 0 : stat.size,
      modifiedAt: stat.mtime.toISOString(),
      mimeType,
      category,
      extension: ext,
      downloadUrl: `/api/share/${id}/download?subpath=${encodeURIComponent(itemRelPath)}${pwdParam}`,
      inlineUrl: `/api/share/${id}/download?subpath=${encodeURIComponent(itemRelPath)}&inline=1${pwdParam}`
    }
  }).filter(Boolean)

  // Sort folders first, then files alphabetically
  files.sort((a: any, b: any) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  })

  return {
    success: true,
    currentPath: subpath,
    folderName: share.fileName,
    files
  }
})
