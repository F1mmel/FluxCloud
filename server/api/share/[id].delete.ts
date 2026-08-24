import { defineEventHandler, getRouterParams, createError } from 'h3'
import { getShares, saveShares } from '../../utils/storage'

export default defineEventHandler((event) => {
  const params = getRouterParams(event)
  const id = params.id

  const shares = getShares()
  const initialLength = shares.length
  const filtered = shares.filter(s => s.id !== id)

  if (filtered.length === initialLength) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Share link not found'
    })
  }

  saveShares(filtered)
  return { success: true, message: 'Share link revoked successfully' }
})
