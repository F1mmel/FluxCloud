import { promises as fs } from 'fs'
import fsClassic from 'fs'
import path from 'path'
import { defineEventHandler, getQuery, getHeaders, readMultipartFormData, createError } from 'h3'
import { sanitizeRelativePath, getMimeType } from '../utils/storage'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'
import { createFileVersionSnapshot } from '../utils/versions'
import { broadcastFileEvent } from '../utils/events'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const query = getQuery(event)
  const relativePath = (query.path as string) || ''
  const uploadDir = resolveUserUploadPath(username, relativePath)

  // Ensure directory exists
  try {
    await fs.access(uploadDir)
  } catch {
    await fs.mkdir(uploadDir, { recursive: true })
  }

  const headers = getHeaders(event)
  const fileNameHeader = headers['x-file-name'] as string

  try {
    // 1. Raw Stream Upload (C# Sync Client & high-speed streaming)
    if (fileNameHeader) {
      const decodedFilename = decodeURIComponent(fileNameHeader)
      const safeFilename = path.basename(decodedFilename).replace(/[\\/:\*\?"<>\|]/g, '_')
      const filePath = path.join(uploadDir, safeFilename)
      const safeRel = sanitizeRelativePath(relativePath ? `${relativePath}/${safeFilename}` : safeFilename)

      if (fsClassic.existsSync(filePath)) {
        try {
          await createFileVersionSnapshot(username, safeRel, 'Replaced via Upload')
        } catch {}
      }

      const writeStream = fsClassic.createWriteStream(filePath)
      
      await new Promise<void>((resolve, reject) => {
        event.node.req.pipe(writeStream)
        event.node.req.on('end', () => resolve())
        event.node.req.on('error', (err) => reject(err))
        writeStream.on('error', (err) => reject(err))
      })

      const urlPath = `users/${user.username}/${safeRel}`

      broadcastFileEvent(username, 'upload', { path: safeRel })

      return {
        success: true,
        files: [{
          name: safeFilename,
          relativePath: safeRel,
          url: `/uploads/${encodeURI(urlPath)}`,
          mimeType: getMimeType(safeFilename)
        }]
      }
    }

    // 2. Multipart Form Upload (Web UI)
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No files provided for upload',
      })
    }

    const uploadedFiles = []

    for (const file of formData) {
      if (file.name === 'file' || file.filename) {
        const filename = file.filename || 'uploaded_file'
        const safeFilename = path.basename(filename).replace(/[\\/:\*\?"<>\|]/g, '_')
        const filePath = path.join(uploadDir, safeFilename)
        const safeRel = sanitizeRelativePath(relativePath ? `${relativePath}/${safeFilename}` : safeFilename)

        if (fsClassic.existsSync(filePath)) {
          try {
            await createFileVersionSnapshot(username, safeRel, 'Replaced via Upload')
          } catch {}
        }

        await fs.writeFile(filePath, file.data)
        const urlPath = `users/${user.username}/${safeRel}`

        uploadedFiles.push({
          name: safeFilename,
          relativePath: safeRel,
          url: `/uploads/${encodeURI(urlPath)}`,
          mimeType: getMimeType(safeFilename)
        })
      }
    }

    broadcastFileEvent(username, 'upload', { path: relativePath })

    return { success: true, files: uploadedFiles }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Error uploading file',
    })
  }
})
