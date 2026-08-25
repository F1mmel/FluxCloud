import { defineEventHandler, getQuery, setHeader, setResponseStatus, createError } from 'h3'
import { getAuthenticatedUser, verifySessionToken, verifyUserPassword } from '../utils/auth'
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
    
    // 1. Check API Key
    if (config.apiKey && queryToken === config.apiKey) {
      user = users.find(u => u.role === 'admin') || users[0] || { id: 'admin', username: 'admin', role: 'admin' }
    } 
    // 2. Check Basic Auth in query
    else if (queryToken.startsWith('Basic ')) {
      try {
        const creds = Buffer.from(queryToken.slice(6).trim(), 'base64').toString('utf-8')
        const idx = creds.indexOf(':')
        if (idx !== -1) {
          const uName = creds.substring(0, idx).trim()
          const pwd = creds.substring(idx + 1)
          const found = users.find(u => u.username.toLowerCase() === uName.toLowerCase())
          if (found && found.passwordHash && verifyUserPassword(pwd, found.salt, found.passwordHash)) {
            user = found
          }
        }
      } catch {}
    } 
    // 3. Check Bearer Token in query
    else {
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
  setHeader(event, 'Cache-Control', 'no-cache, no-transform, must-revalidate')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')
  setResponseStatus(event, 200)

  // Configure socket
  if (res.socket) {
    res.socket.setKeepAlive(true, 10000)
    res.socket.setNoDelay(true)
  }

  // Flush headers
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders()
  }

  // Send initial connection event
  const initPayload = JSON.stringify({ connected: true, user: username, time: Date.now() })
  res.write(`data: ${initPayload}\n\n`)

  // Periodic heartbeat / ping every 15 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(`data: {"type":"ping","time":${Date.now()}}\n\n`)
    } catch {
      clearInterval(pingInterval)
    }
  }, 15000)

  // Subscribe to user events
  const unsubscribe = subscribeFileEvents(username, (cloudEvent) => {
    try {
      const dataStr = JSON.stringify(cloudEvent)
      res.write(`data: ${dataStr}\n\n`)
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

  return new Promise<void>((resolve) => {
    event.node.req.on('close', () => resolve())
    res.on('close', () => resolve())
  })
})
