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
  const folder = sanitizeRelativePath(body.folder || '')
  const filename = (body.filename || '').trim()
  const createSubfolder = !!body.createSubfolder

  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required'
    })
  }

  const currentDirPath = resolveUserUploadPath(username, folder)
  const zipFilePath = path.join(currentDirPath, filename)

  if (!fs.existsSync(zipFilePath) || !fs.statSync(zipFilePath).isFile()) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Archive file not found'
    })
  }

  let targetExtractPath = currentDirPath
  if (createSubfolder) {
    const subfolderName = path.parse(filename).name || 'Extracted'
    targetExtractPath = path.join(currentDirPath, subfolderName)
    let counter = 1
    while (fs.existsSync(targetExtractPath)) {
      targetExtractPath = path.join(currentDirPath, `${subfolderName} (${counter})`)
      counter++
    }
    fs.mkdirSync(targetExtractPath, { recursive: true })
  }

  try {
    const zip = new AdmZip(zipFilePath)
    const zipEntries = zip.getEntries()

    let extractedCount = 0
    const normalizedTarget = path.resolve(targetExtractPath)

    for (const entry of zipEntries) {
      const entryName = entry.entryName

      // Prevent Zip Slip vulnerability
      const targetDestination = path.resolve(targetExtractPath, entryName)
      if (!targetDestination.startsWith(normalizedTarget)) {
        // Entry is trying to escape target directory! Skip for security.
        continue
      }

      if (entry.isDirectory) {
        fs.mkdirSync(targetDestination, { recursive: true })
      } else {
        const parentDir = path.dirname(targetDestination)
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true })
        }
        fs.writeFileSync(targetDestination, entry.getData())
        extractedCount++
      }
    }

    return {
      success: true,
      extractedCount,
      targetFolder: createSubfolder ? path.basename(targetExtractPath) : ''
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to extract archive: ${err.message || 'Corrupt or unsupported format'}`
    })
  }
})
