import { defineEventHandler, getRouterParams, readBody, createError } from 'h3'
import { getShares, hashPassword } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)
  const id = params.id
  const body = await readBody(event)
  const password = typeof body?.password === 'string' ? body.password : ''

  const shares = getShares()
  const share = shares.find(s => s.id === id)

  if (!share) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Share link not found'
    })
  }

  if (!share.passwordHash) {
    return { valid: true }
  }

  const inputHash = hashPassword(password)
  const isValid = inputHash === share.passwordHash

  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Incorrect password'
    })
  }

  return { valid: true }
})
