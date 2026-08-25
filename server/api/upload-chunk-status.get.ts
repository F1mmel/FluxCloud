import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getQuery, createError } from 'h3'
import { CHUNKS_DIR } from '../utils/storage'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const uploadId = (query.uploadId as string) || ''

  if (!uploadId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'uploadId is required'
    })
  }

  const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
  const chunkDir = path.join(CHUNKS_DIR, safeUploadId)

  if (!fs.existsSync(chunkDir)) {
    return { uploadedChunks: [] }
  }

  try {
    const files = fs.readdirSync(chunkDir)
    const uploadedChunks: number[] = []

    for (const f of files) {
      if (f.startsWith('chunk_')) {
        const idx = parseInt(f.replace('chunk_', ''), 10)
        if (!isNaN(idx)) {
          uploadedChunks.push(idx)
        }
      }
    }

    uploadedChunks.sort((a, b) => a - b)
    return { uploadedChunks }
  } catch {
    return { uploadedChunks: [] }
  }
})
