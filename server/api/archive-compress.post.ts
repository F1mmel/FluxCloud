import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { defineEventHandler, readBody, createError } from 'h3'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'
import { sanitizeRelativePath } from '../utils/storage'

const require = createRequire(import.meta.url)
const AdmZipLib = require('adm-zip')
const AdmZip = typeof AdmZipLib === 'function' ? AdmZipLib : (AdmZipLib.default || AdmZipLib)

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const body = await readBody(event)
  const folder = sanitizeRelativePath(body?.folder || '')
  const items = Array.isArray(body?.items) ? body.items.filter(Boolean) : []
  let archiveName = ((body?.archiveName as string) || '').trim()

  if (items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No items specified to compress'
    })
  }

  const currentDirPath = resolveUserUploadPath(username, folder)
  if (!fs.existsSync(currentDirPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Target directory not found'
    })
  }

  // Determine clean archive filename
  if (!archiveName) {
    if (items.length === 1) {
      const base = path.parse(items[0]).name || items[0]
      archiveName = `${base}.zip`
    } else {
      archiveName = 'Archive.zip'
    }
  }

  if (!archiveName.toLowerCase().endsWith('.zip')) {
    archiveName += '.zip'
  }

  // Resolve unique name if already exists
  let targetZipPath = path.join(currentDirPath, archiveName)
  let counter = 1
  const parsed = path.parse(archiveName)
  while (fs.existsSync(targetZipPath)) {
    archiveName = `${parsed.name} (${counter}).zip`
    targetZipPath = path.join(currentDirPath, archiveName)
    counter++
  }

  try {
    const zip = new AdmZip()

    for (const item of items) {
      const itemPath = path.join(currentDirPath, item)
      if (!fs.existsSync(itemPath)) continue

      const stat = fs.statSync(itemPath)
      if (stat.isDirectory()) {
        zip.addLocalFolder(itemPath, item)
      } else if (stat.isFile()) {
        zip.addLocalFile(itemPath)
      }
    }

    zip.writeZip(targetZipPath)

    const stat = fs.statSync(targetZipPath)

    return {
      success: true,
      archiveName,
      size: stat.size,
      itemCount: items.length
    }
  } catch (err: any) {
    if (fs.existsSync(targetZipPath)) {
      try { fs.unlinkSync(targetZipPath) } catch {}
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Compression failed: ${err.message || 'Error creating zip'}`
    })
  }
})
