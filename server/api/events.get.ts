import { defineEventHandler, getQuery, setHeader, setResponseStatus, createError } from 'h3'
import { getAuthenticatedUser, verifySessionToken } from '../utils/auth'
import { getConfig } from '../utils/storage'
import { subscribeFileEvents } from '../utils/events'

export default defineEventHandler(async (event) => {
  // Support auth via Session Cookie, Authorization Header, or query param (?key=... or ?token=...)
  let user = getAuthenticatedUser(event)
  const query = getQuery(event)
  const queryToken = (query.token || query.key) as string | undefined

  if (!user && queryToken) {
    const config = getConfig()
    const users = config.users || []
    if (config.apiKey && queryToken === config.apiKey) {
      user = users.find(u => u.role === 'admin') || users[0] || { id: 'admin', username: 'admin', role: 'admin' }
    } else {
      const verified = verifySessionToken(queryToken)
      if (verified) {
        user = users.find(u => u.id === verified.userId) || null
      }
    }
  }

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Please provide valid authentication.'
    })
  }

  const res = event.node.res
  const username = user.username

  // Set SSE response headers
  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')
  setResponseStatus(event, 200)

  // Flush headers if method exists
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders()
  }

  // Send initial connection event
  const initPayload = JSON.stringify({ connected: true, user: username, time: Date.now() })
  res.write(`event: connected\ndata: ${initPayload}\n\n`)

  // Periodic heartbeat / ping every 25 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {"time":${Date.now()}}\n\n`)
    } catch {
      clearInterval(pingInterval)
    }
  }, 25000)

  // Subscribe to user events
  const unsubscribe = subscribeFileEvents(username, (cloudEvent) => {
    try {
      const dataStr = JSON.stringify(cloudEvent)
      res.write(`event: message\ndata: ${dataStr}\n\n`)
    } catch (err) {
      console.error('[SSE Event Write Error]', err)
    }
  })

  // Handle client disconnect
  const cleanup = () => {
    clearInterval(pingInterval)
    unsubscribe()
  }

  event.node.req.on('close', cleanup)
  event.node.req.on('end', cleanup)
  res.on('close', cleanup)
  res.on('finish', cleanup)

  // Return a promise that never resolves until connection closes to keep SSE stream open in Nitro
  return new Promise<void>((resolve) => {
    event.node.req.on('close', () => resolve())
    res.on('close', () => resolve())
  })
})
