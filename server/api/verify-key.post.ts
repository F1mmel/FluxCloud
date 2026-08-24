import { defineEventHandler, readBody, createError } from 'h3'
import { getConfig } from '../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body || typeof body.key !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request. "key" parameter is required and must be a string.'
    })
  }

  const config = getConfig()
  const serverKey = config.apiKey || ''

  // If server has no key configured, we accept everything.
  // Otherwise, the key must match exactly.
  const isValid = serverKey === '' || body.key === serverKey

  return { valid: isValid }
})
