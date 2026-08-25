import fs from 'node:fs'
import path from 'node:path'
import { 
  defineEventHandler, 
  getRouterParams, 
  getQuery, 
  getHeader, 
  setResponseHeaders, 
  setResponseStatus, 
  sendStream, 
  createError 
} from 'h3'
import { resolveUploadPath, getMimeType, getConfig } from '../../utils/storage'
import { getAuthenticatedUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const method = event.method.toUpperCase()
  const config = getConfig()

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    if (config.corsAllowed) {
      setResponseHeaders(event, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      })
    }
    setResponseStatus(event, 204)
    return ''
  }

  if (method !== 'GET' && method !== 'HEAD') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  const params = getRouterParams(event)
  const rawSlug = params.slug || ''
  const relativePath = Array.isArray(rawSlug) ? rawSlug.join('/') : rawSlug

  if (!relativePath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path parameter is required'
    })
  }

  const query = getQuery(event)
  const clientKey = (getHeader(event, 'x-api-key') as string) || (query.key as string) || ''
  const user = getAuthenticatedUser(event)

  if (!user && (!clientKey || clientKey !== config.apiKey)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Direct plaintext filename access is blocked for security. Please use a secure direct token (/d/...) or share link (/s/...).'
    })
  }

  const filePath = resolveUploadPath(relativePath)

  if (!fs.existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found'
    })
  }

  const stat = fs.statSync(filePath)
  if (stat.isDirectory()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot serve directory directly'
    })
  }

  const mimeType = getMimeType(filePath)
  const fileName = path.basename(filePath)
  const isDownload = query.download === '1' || query.download === 'true'

  const headers: Record<string, string> = {
    'Content-Type': mimeType,
    'Last-Modified': stat.mtime.toUTCString(),
    'ETag': `"${stat.size.toString(16)}-${stat.mtime.getTime().toString(16)}"`,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes'
  }

  if (isDownload) {
    headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
  } else {
    headers['Content-Disposition'] = `inline; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
  }

  if (config.corsAllowed) {
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
    headers['Access-Control-Allow-Headers'] = '*'
  }

  // Handle Range requests (HTTP 206 Partial Content) for streaming & download managers
  const rangeHeader = getHeader(event, 'range')
  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    const rangeStr = rangeHeader.replace(/^bytes=/, '').trim()
    const [startStr, endStr] = rangeStr.split('-')
    const start = parseInt(startStr, 10)
    let end = endStr ? parseInt(endStr, 10) : stat.size - 1

    if (isNaN(start) || start < 0 || start >= stat.size || end >= stat.size || start > end) {
      setResponseHeaders(event, {
        ...headers,
        'Content-Range': `bytes */${stat.size}`
      })
      throw createError({
        statusCode: 416,
        statusMessage: 'Requested Range Not Satisfiable'
      })
    }

    const chunkSize = end - start + 1
    headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`
    headers['Content-Length'] = chunkSize.toString()
    setResponseHeaders(event, headers)
    setResponseStatus(event, 206)

    if (method === 'HEAD') {
      return ''
    }

    const stream = fs.createReadStream(filePath, { start, end })
    return sendStream(event, stream)
  }

  headers['Content-Length'] = stat.size.toString()
  setResponseHeaders(event, headers)
  setResponseStatus(event, 200)

  if (method === 'HEAD') {
    return ''
  }

  const stream = fs.createReadStream(filePath)
  return sendStream(event, stream)
})
