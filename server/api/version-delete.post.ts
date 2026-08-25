import { defineEventHandler, readBody, createError } from 'h3'
import { requireAuth } from '../utils/auth'
import { sanitizeRelativePath } from '../utils/storage'
import { deleteFileVersion, purgeFileVersions } from '../utils/versions'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const body = await readBody(event)
  const relativePath = sanitizeRelativePath((body?.path as string) || '')
  const versionId = (body?.versionId as string) || ''
  const purgeAll = body?.all === true

  if (purgeAll && relativePath) {
    purgeFileVersions(username, relativePath)
    return { success: true, message: 'All versions deleted' }
  }

  if (!versionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'versionId is required'
    })
  }

  const success = deleteFileVersion(username, versionId)
  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Version not found'
    })
  }

  return { success: true, message: 'Version deleted' }
})
