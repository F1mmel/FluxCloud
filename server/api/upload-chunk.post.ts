import fs from 'node:fs'
import { promises as fsPromises } from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getHeaders, getQuery, createError, readRawBody } from 'h3'
import { CHUNKS_DIR, sanitizeRelativePath, getMimeType, getShares, resolveShareFullPath } from '../utils/storage'
import { getAuthenticatedUser, resolveUserUploadPath } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const headers = getHeaders(event)
  const query = getQuery(event)

  const uploadId = (headers['x-upload-id'] as string) || (query.uploadId as string) || ''
  const chunkIndexStr = (headers['x-chunk-index'] as string) || (query.chunkIndex as string) || ''
  const totalChunksStr = (headers['x-total-chunks'] as string) || (query.totalChunks as string) || ''
  const rawFileName = (headers['x-file-name'] as string) || (query.fileName as string) || ''
  const targetPath = (headers['x-target-path'] as string) || (query.targetPath as string) || ''
  const shareId = (headers['x-share-id'] as string) || (query.shareId as string) || ''

  if (!uploadId || chunkIndexStr === '' || !totalChunksStr || !rawFileName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required chunk upload headers (x-upload-id, x-chunk-index, x-total-chunks, x-file-name)'
    })
  }

  const chunkIndex = parseInt(chunkIndexStr, 10)
  const totalChunks = parseInt(totalChunksStr, 10)

  if (isNaN(chunkIndex) || isNaN(totalChunks) || chunkIndex < 0 || totalChunks <= 0 || chunkIndex >= totalChunks) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid chunk index or total chunks parameter'
    })
  }

  // Security & Target Folder Resolution
  let user = getAuthenticatedUser(event)
  let targetFolder = ''
  let targetUsername = user ? user.username : 'public'

  if (shareId) {
    // Shared folder upload (Public or Internal)
    const shares = getShares()
    const share = shares.find(s => s.id === shareId)
    if (!share || !share.isDirectory || (!share.allowUploads && share.permission !== 'write')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Uploads not allowed on this share'
      })
    }
    const fullSharePath = resolveShareFullPath(share)
    if (!fullSharePath || !fs.existsSync(fullSharePath)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Share directory not found'
      })
    }
    targetFolder = targetPath ? path.join(fullSharePath, sanitizeRelativePath(targetPath)) : fullSharePath
    targetUsername = share.username || 'public'
  } else {
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required for chunk upload'
      })
    }
    targetFolder = resolveUserUploadPath(user.username, targetPath)
  }

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true })
  }

  // Temporary chunk storage directory: data/chunks/{uploadId}
  const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
  const chunkDir = path.join(CHUNKS_DIR, safeUploadId)
  if (!fs.existsSync(chunkDir)) {
    fs.mkdirSync(chunkDir, { recursive: true })
  }

  const chunkFile = path.join(chunkDir, `chunk_${chunkIndex}`)

  // Write incoming chunk to disk using H3 readRawBody
  const chunkBuffer = await readRawBody(event, false)
  if (!chunkBuffer || chunkBuffer.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Empty chunk data received'
    })
  }

  await fsPromises.writeFile(chunkFile, chunkBuffer)

  // Check if all chunks (0 to totalChunks - 1) have been received
  let allChunksReady = true
  for (let i = 0; i < totalChunks; i++) {
    const p = path.join(chunkDir, `chunk_${i}`)
    if (!fs.existsSync(p)) {
      allChunksReady = false
      break
    }
  }

  if (!allChunksReady) {
    return {
      success: true,
      completed: false,
      chunkIndex,
      totalChunks
    }
  }

  // All chunks received -> Assemble into final file
  const decodedFileName = decodeURIComponent(rawFileName)
  const safeFileName = path.basename(decodedFileName).replace(/[\\/:\*\?"<>\|]/g, '_')
  const finalFilePath = path.join(targetFolder, safeFileName)

  const finalWriteStream = fs.createWriteStream(finalFilePath)

  for (let i = 0; i < totalChunks; i++) {
    const curChunkPath = path.join(chunkDir, `chunk_${i}`)
    const chunkData = await fsPromises.readFile(curChunkPath)
    await new Promise<void>((resolve, reject) => {
      const canWrite = finalWriteStream.write(chunkData)
      if (!canWrite) {
        finalWriteStream.once('drain', () => resolve())
      } else {
        resolve()
      }
    })
  }

  await new Promise<void>((resolve, reject) => {
    finalWriteStream.end(() => resolve())
    finalWriteStream.on('error', (err) => reject(err))
  })

  // Clean up temporary chunks directory
  try {
    fs.rmSync(chunkDir, { recursive: true, force: true })
  } catch (e) {
    console.error('Error cleaning up chunks directory:', e)
  }

  const stat = fs.statSync(finalFilePath)
  const safeRel = sanitizeRelativePath(targetPath ? `${targetPath}/${safeFileName}` : safeFileName)
  const urlPath = `users/${targetUsername}/${safeRel}`

  return {
    success: true,
    completed: true,
    file: {
      name: safeFileName,
      relativePath: safeRel,
      size: stat.size,
      url: `/uploads/${encodeURI(urlPath)}`,
      thumbnailUrl: `/api/thumbnail?path=${encodeURIComponent(urlPath)}`,
      mimeType: getMimeType(safeFileName),
      createdAt: stat.birthtime.toISOString(),
      modifiedAt: stat.mtime.toISOString()
    }
  }
})
