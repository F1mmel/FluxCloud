import { defineEventHandler, readBody, createError } from 'h3'
import { requireAuth } from '../utils/auth'
import { sanitizeRelativePath } from '../utils/storage'
import { restoreFileVersion } from '../utils/versions'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const username = user.username

  const body = await readBody(event)
  const relativePath = sanitizeRelativePath((body?.path as string) || '')
  const versionId = (body?.versionId as string) || ''

  if (!relativePath || !versionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path and versionId parameters are required'
    })
  }

  try {
    const result = await restoreFileVersion(username, relativePath, versionId)
    return result
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to restore version'
    })
  }
})
