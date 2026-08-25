import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, readBody, createError } from 'h3'
import { CHUNKS_DIR } from '../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const uploadId = body?.uploadId || ''

  if (!uploadId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'uploadId is required'
    })
  }

  const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
  const chunkDir = path.join(CHUNKS_DIR, safeUploadId)

  if (fs.existsSync(chunkDir)) {
    try {
      fs.rmSync(chunkDir, { recursive: true, force: true })
    } catch {}
  }

  return { success: true }
})
