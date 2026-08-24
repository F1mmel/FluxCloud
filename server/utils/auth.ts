import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie, getHeader, createError } from 'h3'
import { getConfig, saveConfig, DATA_DIR, UPLOADS_DIR, type UserRecord } from './storage'

const SESSION_COOKIE_NAME = 'fc_session_token'
const SESSION_SECRET = 'fluxcloud_secure_session_secret_' + (process.env.SESSION_SECRET || 'default_key_2026')

/**
 * Generates a secure salt for password hashing
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Hashes a password with a unique per-user salt
 */
export function hashUserPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
}

/**
 * Verifies a plaintext password against a stored salt & hash
 */
export function verifyUserPassword(password: string, salt: string, storedHash: string): boolean {
  if (!storedHash || !salt) return false
  const computed = hashUserPassword(password, salt)
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(storedHash, 'hex'))
}

/**
 * Creates a signed session token
 */
export function createSessionToken(user: UserRecord): string {
  const payload = JSON.stringify({
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
  })
  const base64Payload = Buffer.from(payload).toString('base64url')
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(base64Payload).digest('base64url')
  return `${base64Payload}.${signature}`
}

/**
 * Validates a session token and returns the payload if valid
 */
export function verifySessionToken(token: string): { userId: string; username: string; role: string } | null {
  if (!token || !token.includes('.')) return null
  const [base64Payload, signature] = token.split('.')
  if (!base64Payload || !signature) return null

  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(base64Payload).digest('base64url')
  if (signature !== expectedSig) return null

  try {
    const jsonStr = Buffer.from(base64Payload, 'base64url').toString('utf-8')
    const data = JSON.parse(jsonStr)
    if (data.exp && data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

/**
 * Sets session cookie on HTTP response
 */
export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })
}

/**
 * Clears session cookie on logout
 */
export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/'
  })
}

/**
 * Gets the currently authenticated user from event (Cookie, Authorization Bearer or Basic header)
 */
export function getAuthenticatedUser(event: H3Event): UserRecord | null {
  const config = getConfig()
  const users = config.users || []

  // 1. Try Cookie
  const cookieToken = getCookie(event, SESSION_COOKIE_NAME)
  if (cookieToken) {
    const verified = verifySessionToken(cookieToken)
    if (verified) {
      const found = users.find(u => u.id === verified.userId && u.username.toLowerCase() === verified.username.toLowerCase())
      if (found) return found
    }
  }

  // 2. Try Authorization Header
  const authHeader = getHeader(event, 'authorization')
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim()
      // If matches master API Key and users exist, return admin user
      if (config.apiKey && token === config.apiKey) {
        const adminUser = users.find(u => u.role === 'admin') || users[0]
        if (adminUser) return adminUser
      }
      const verified = verifySessionToken(token)
      if (verified) {
        const found = users.find(u => u.id === verified.userId && u.username.toLowerCase() === verified.username.toLowerCase())
        if (found) return found
      }
    } else if (authHeader.startsWith('Basic ')) {
      try {
        const creds = Buffer.from(authHeader.slice(6).trim(), 'base64').toString('utf-8')
        const idx = creds.indexOf(':')
        if (idx !== -1) {
          const uName = creds.substring(0, idx).trim()
          const pwd = creds.substring(idx + 1)

          // Master API Key check
          if (config.apiKey && (pwd === config.apiKey || uName === config.apiKey)) {
            const adminUser = users.find(u => u.role === 'admin') || users[0]
            if (adminUser) return adminUser
          }

          // User password check
          const found = users.find(u => u.username.toLowerCase() === uName.toLowerCase())
          if (found && found.passwordHash && verifyUserPassword(pwd, found.salt, found.passwordHash)) {
            return found
          }
        }
      } catch {}
    }
  }

  return null
}

/**
 * Requires an authenticated user or throws 401
 */
export function requireAuth(event: H3Event): UserRecord {
  const user = getAuthenticatedUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Session expired or user account no longer exists. Please log in again.'
    })
  }
  return user
}

/**
 * Requires an admin user or throws 403
 */
export function requireAdmin(event: H3Event): UserRecord {
  const user = requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Administrator permissions required.'
    })
  }
  return user
}

/**
 * Returns the isolated root folder for a specific user: data/uploads/users/<username>
 */
export function getUserUploadsDir(username: string): string {
  if (!username || username.trim() === '' || username.trim().toLowerCase() === 'default') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. No valid user account specified.'
    })
  }
  const safeName = username.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_')
  const userDir = path.join(UPLOADS_DIR, 'users', safeName)
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true })
  }
  return userDir
}

/**
 * Resolves a safe absolute path inside a user's isolated directory
 */
export function resolveUserUploadPath(username: string, relativePath: string): string {
  const userBase = getUserUploadsDir(username)
  const decoded = decodeURIComponent(relativePath || '')
  const safeRel = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^[\/\\]+/, '')
  return path.join(userBase, safeRel)
}
