import fs from 'node:fs'
import { promises as fsPromises } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

function getAppRootDir() {
  // When running as a compiled standalone binary, always use the executable's directory
  if (process.execPath && !process.execPath.toLowerCase().endsWith('node.exe') && !process.execPath.toLowerCase().endsWith('bun.exe') && !process.execPath.endsWith('node') && !process.execPath.endsWith('bun')) {
    return path.dirname(process.execPath)
  }
  return process.cwd()
}

export const ROOT_DIR = getAppRootDir()
export const DATA_DIR = path.resolve(ROOT_DIR, 'data')
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')
export const TRASH_DIR = path.join(DATA_DIR, 'trash')
export const THUMBNAILS_DIR = path.join(DATA_DIR, 'thumbnails')
export const CHUNKS_DIR = path.join(DATA_DIR, 'chunks')
export const VERSIONS_DIR = path.join(DATA_DIR, 'versions')
export const CONFIG_PATH = path.join(DATA_DIR, 'config.json')
export const SHARES_PATH = path.join(DATA_DIR, 'shares.json')
export const META_PATH = path.join(DATA_DIR, 'meta.json')
export const TRASH_INDEX_PATH = path.join(DATA_DIR, 'trash_index.json')
export const VERSIONS_INDEX_PATH = path.join(DATA_DIR, 'versions_index.json')

const DEFAULT_ICON_PATH = path.resolve(ROOT_DIR, 'public/fluxcloud_icon.png')
const LEGACY_CONFIG_PATH = path.resolve(ROOT_DIR, 'config.json')
const LEGACY_UPLOADS_DIR = path.resolve(ROOT_DIR, 'public/uploads')

/**
 * Initializes data folders and migrates legacy data if needed
 */
export function ensureDataStructure() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
  if (!fs.existsSync(TRASH_DIR)) {
    fs.mkdirSync(TRASH_DIR, { recursive: true })
  }
  if (!fs.existsSync(THUMBNAILS_DIR)) {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true })
  }
  if (!fs.existsSync(CHUNKS_DIR)) {
    fs.mkdirSync(CHUNKS_DIR, { recursive: true })
  }
  if (!fs.existsSync(VERSIONS_DIR)) {
    fs.mkdirSync(VERSIONS_DIR, { recursive: true })
  }

  // 1. Migrate legacy config.json if needed
  if (!fs.existsSync(CONFIG_PATH)) {
    if (fs.existsSync(LEGACY_CONFIG_PATH)) {
      try {
        const legacyData = fs.readFileSync(LEGACY_CONFIG_PATH, 'utf-8')
        fs.writeFileSync(CONFIG_PATH, legacyData, 'utf-8')
      } catch (e) {
        console.error('Failed to migrate legacy config.json:', e)
      }
    }
  }

  // 2. Migrate legacy public/uploads if needed
  if (fs.existsSync(LEGACY_UPLOADS_DIR)) {
    try {
      const legacyItems = fs.readdirSync(LEGACY_UPLOADS_DIR)
      for (const item of legacyItems) {
        const legacyItemPath = path.join(LEGACY_UPLOADS_DIR, item)
        const targetItemPath = path.join(UPLOADS_DIR, item)
        if (!fs.existsSync(targetItemPath)) {
          // Copy over
          fs.cpSync(legacyItemPath, targetItemPath, { recursive: true })
        }
      }
    } catch (e) {
      console.error('Failed to migrate legacy uploads:', e)
    }
  }
}

// Ensure directory structure upon module import
ensureDataStructure()

export interface UserRecord {
  id: string
  username: string
  role: 'admin' | 'user'
  passwordHash: string | null // null when created by admin, initialized by user on first login
  salt: string
  createdAt: string
  lastLoginAt?: string
}

export interface ServerConfig {
  color: string
  logo: string
  apiKey: string
  siteName?: string
  corsAllowed?: boolean
  maxUploadSizeMB?: number
  publicUploadsEnabled?: boolean
  webdavEnabled?: boolean
  webdavUsername?: string
  users: UserRecord[]
  backgroundImage?: string
  backgroundBlur?: number
  backgroundBrightness?: number
  backgroundOpacity?: number
  sharePageBackgroundEnabled?: boolean
  thumbnailsEnabled?: boolean
  thumbnailWorkers?: number
  maxVersionCopies?: number
}

export function getConfig(): ServerConfig {
  ensureDataStructure()
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8')
      const parsed = JSON.parse(data)
      return {
        color: parsed.color || '#818CF8',
        logo: parsed.logo || '',
        apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
        siteName: parsed.siteName || 'FluxCloud',
        corsAllowed: parsed.corsAllowed ?? true,
        maxUploadSizeMB: parsed.maxUploadSizeMB || 1024,
        publicUploadsEnabled: parsed.publicUploadsEnabled ?? true,
        webdavEnabled: parsed.webdavEnabled ?? true,
        webdavUsername: parsed.webdavUsername || 'admin',
        users: Array.isArray(parsed.users) ? parsed.users : [],
        backgroundImage: typeof parsed.backgroundImage === 'string' ? parsed.backgroundImage : '',
        backgroundBlur: typeof parsed.backgroundBlur === 'number' ? parsed.backgroundBlur : 2,
        backgroundBrightness: typeof parsed.backgroundBrightness === 'number' ? parsed.backgroundBrightness : (typeof parsed.backgroundOpacity === 'number' ? parsed.backgroundOpacity : 100),
        backgroundOpacity: typeof parsed.backgroundBrightness === 'number' ? parsed.backgroundBrightness : (typeof parsed.backgroundOpacity === 'number' ? parsed.backgroundOpacity : 100),
        sharePageBackgroundEnabled: parsed.sharePageBackgroundEnabled ?? false,
        thumbnailsEnabled: parsed.thumbnailsEnabled !== undefined ? !!parsed.thumbnailsEnabled : true,
        thumbnailWorkers: typeof parsed.thumbnailWorkers === 'number' && parsed.thumbnailWorkers >= 1 ? Math.min(16, parsed.thumbnailWorkers) : 4,
        maxVersionCopies: typeof parsed.maxVersionCopies === 'number' ? parsed.maxVersionCopies : 20
      }
    } catch (e) {
      console.error('Error reading config:', e)
    }
  }

  let defaultLogoBase64 = ''
  if (fs.existsSync(DEFAULT_ICON_PATH)) {
    try {
      const iconData = fs.readFileSync(DEFAULT_ICON_PATH)
      defaultLogoBase64 = `data:image/png;base64,${iconData.toString('base64')}`
    } catch {}
  }

  const defaultConfig: ServerConfig = {
    color: '#818CF8',
    logo: defaultLogoBase64,
    apiKey: '',
    siteName: 'FluxCloud',
    corsAllowed: true,
    maxUploadSizeMB: 1024,
    publicUploadsEnabled: true,
    webdavEnabled: true,
    webdavUsername: 'admin',
    users: [],
    backgroundImage: '',
    backgroundBlur: 2,
    backgroundBrightness: 100,
    backgroundOpacity: 100,
    sharePageBackgroundEnabled: false,
    thumbnailsEnabled: true,
    thumbnailWorkers: 4
  }

  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8')
  } catch (e) {
    console.error('Could not write default config:', e)
  }

  return defaultConfig
}

export function saveConfig(config: Partial<ServerConfig>): ServerConfig {
  ensureDataStructure()
  const current = getConfig()
  const updated: ServerConfig = {
    ...current,
    ...config
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8')
  return updated
}

export interface ShareRecord {
  id: string
  targetPath: string
  isDirectory: boolean
  fileName: string
  passwordHash?: string | null
  expiresAt?: string | null // ISO string or null for never
  maxDownloads?: number | null
  downloadCount: number
  viewCount: number
  viewOnly: boolean
  allowUploads?: boolean
  hideContents?: boolean
  sharedWithUser?: string | null
  permission?: 'read' | 'write'
  createdAt: string
  username?: string | null
}

export function getShares(): ShareRecord[] {
  ensureDataStructure()
  if (!fs.existsSync(SHARES_PATH)) return []
  try {
    const data = fs.readFileSync(SHARES_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveShares(shares: ShareRecord[]) {
  ensureDataStructure()
  fs.writeFileSync(SHARES_PATH, JSON.stringify(shares, null, 2), 'utf-8')
}

export interface AppMetadata {
  favorites: string[] // List of relative paths
  tags?: Record<string, string[]> // path -> tags
  directTokens?: Record<string, string> // relativePath -> unguessable token
}

export function getMetadata(): AppMetadata {
  ensureDataStructure()
  if (!fs.existsSync(META_PATH)) return { favorites: [], directTokens: {} }
  try {
    const data = fs.readFileSync(META_PATH, 'utf-8')
    const parsed = JSON.parse(data)
    if (!parsed.directTokens) parsed.directTokens = {}
    return parsed
  } catch {
    return { favorites: [], directTokens: {} }
  }
}

export function saveMetadata(meta: AppMetadata) {
  ensureDataStructure()
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf-8')
}

/**
 * Gets or generates a cryptographically unguessable direct CDN token for a file
 */
export function getOrCreateDirectToken(relativePath: string): string {
  const safe = sanitizeRelativePath(relativePath)
  const meta = getMetadata()
  meta.directTokens = meta.directTokens || {}

  if (meta.directTokens[safe]) {
    return meta.directTokens[safe]
  }

  // Generate 128-bit (32 hex characters) unguessable cryptographic token
  const token = crypto.randomBytes(16).toString('hex')
  meta.directTokens[safe] = token
  saveMetadata(meta)
  return token
}

/**
 * Resolves a direct token to its relative file path
 */
export function resolveDirectToken(token: string): string | null {
  if (!token) return null
  const meta = getMetadata()
  if (!meta.directTokens) return null

  for (const [pathKey, tokenVal] of Object.entries(meta.directTokens)) {
    if (tokenVal === token) {
      return pathKey
    }
  }
  return null
}

export function updateDirectTokenPath(oldPath: string, newPath: string) {
  const safeOld = sanitizeRelativePath(oldPath)
  const safeNew = sanitizeRelativePath(newPath)
  const meta = getMetadata()
  if (!meta.directTokens) return

  if (meta.directTokens[safeOld]) {
    meta.directTokens[safeNew] = meta.directTokens[safeOld]
    delete meta.directTokens[safeOld]
    saveMetadata(meta)
  }
}

export interface TrashRecord {
  id: string
  originalPath: string
  fileName: string
  isDirectory: boolean
  size: number
  deletedAt: string
  trashFileName: string
}

export function getTrashIndex(): TrashRecord[] {
  ensureDataStructure()
  if (!fs.existsSync(TRASH_INDEX_PATH)) return []
  try {
    const data = fs.readFileSync(TRASH_INDEX_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveTrashIndex(trash: TrashRecord[]) {
  ensureDataStructure()
  fs.writeFileSync(TRASH_INDEX_PATH, JSON.stringify(trash, null, 2), 'utf-8')
}

/**
 * Sanitizes relative paths to prevent directory traversal
 */
export function sanitizeRelativePath(relativePath: string): string {
  if (!relativePath) return ''
  const decoded = decodeURIComponent(relativePath)
  return path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^[\/\\]+/, '')
}

/**
 * Resolves safe absolute path inside uploads directory
 */
export function resolveUploadPath(relativePath: string): string {
  const safe = sanitizeRelativePath(relativePath)
  return path.join(UPLOADS_DIR, safe)
}

/**
 * Checks whether the physical file or directory for a share record still exists on disk
 */
export function isShareTargetAvailable(share: ShareRecord, username?: string): boolean {
  return resolveShareFullPath(share, username) !== null
}

/**
 * Resolves the physical path of a share record, checking user subdirectories if needed
 */
export function resolveShareFullPath(share: ShareRecord, username?: string): string | null {
  if (!share || !share.targetPath) return null

  // 1. Direct path under UPLOADS_DIR (e.g. data/uploads/users/Fimmel/... or data/uploads/...)
  const directFullPath = resolveUploadPath(share.targetPath)
  if (fs.existsSync(directFullPath)) return directFullPath

  // 2. If share has a creator username, check user uploads folder
  const targetUser = share.username || username
  if (targetUser && !share.targetPath.startsWith('users/')) {
    const safeUser = targetUser.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    const userPath = path.join(UPLOADS_DIR, 'users', safeUser, sanitizeRelativePath(share.targetPath))
    if (fs.existsSync(userPath)) return userPath
  }

  // 3. If targetPath is not prefixed with users/, check across users directories if needed
  if (!share.targetPath.startsWith('users/')) {
    const usersRoot = path.join(UPLOADS_DIR, 'users')
    if (fs.existsSync(usersRoot)) {
      try {
        const userDirs = fs.readdirSync(usersRoot)
        for (const uDir of userDirs) {
          const candidate = path.join(usersRoot, uDir, sanitizeRelativePath(share.targetPath))
          if (fs.existsSync(candidate)) return candidate
        }
      } catch {}
    }
  }

  return null
}

/**
 * Basic MIME type lookup for standard file extensions
 */
export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogv': 'video/ogg',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    '.m4a': 'audio/mp4',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.log': 'text/plain; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.yaml': 'text/yaml; charset=utf-8',
    '.yml': 'text/yaml; charset=utf-8',
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.7z': 'application/x-7z-compressed',
    '.rar': 'application/x-rar-compressed',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }

  return mimeMap[ext] || 'application/octet-stream'
}

/**
 * Fast SHA-256 hashing for password verification
 */
export function hashPassword(pwd: string): string {
  return crypto.createHash('sha256').update(pwd).digest('hex')
}

/**
 * Returns broad category for file
 */
export function getFileCategory(name: string, isDirectory = false): 'folder' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other' {
  if (isDirectory) return 'folder'
  const ext = name.includes('.') ? `.${name.split('.').pop()?.toLowerCase()}` : ''

  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff']
  const videoExts = ['.mp4', '.webm', '.ogv', '.mov', '.mkv', '.avi']
  const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']
  const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.csv']
  const codeExts = ['.js', '.ts', '.vue', '.json', '.html', '.css', '.scss', '.py', '.c', '.cpp', '.cs', '.go', '.rs', '.java', '.php', '.sh', '.yml', '.yaml', '.xml', '.sql', '.md', '.env', '.ini']
  const archiveExts = ['.zip', '.tar', '.gz', '.7z', '.rar']

  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  if (audioExts.includes(ext)) return 'audio'
  if (docExts.includes(ext)) return 'document'
  if (codeExts.includes(ext)) return 'code'
  if (archiveExts.includes(ext)) return 'archive'
  return 'other'
}

/**
 * Resolves or computes the thumbnail file location: data/thumbnails/{user}/{id}.webp
 */
export function getThumbnailDiskPath(username: string, relativePath: string, mtimeMs: number, size: number): { userDir: string; fullPath: string; thumbId: string } {
  const safeUser = (username || 'global').trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_')
  const userDir = path.join(THUMBNAILS_DIR, safeUser)
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true })
  }
  const hash = crypto.createHash('md5').update(`${relativePath}:${mtimeMs}:${size}`).digest('hex')
  const thumbId = `${hash}.webp`
  const fullPath = path.join(userDir, thumbId)
  return { userDir, fullPath, thumbId }
}

/**
 * Returns thumbnail cache statistics
 */
export function getThumbnailCacheStats(username?: string): { count: number; totalBytes: number } {
  ensureDataStructure()
  let count = 0
  let totalBytes = 0

  const targetDir = username 
    ? path.join(THUMBNAILS_DIR, username.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_'))
    : THUMBNAILS_DIR

  if (!fs.existsSync(targetDir)) return { count: 0, totalBytes: 0 }

  function scan(dir: string) {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true })
      for (const item of items) {
        const full = path.join(dir, item.name)
        if (item.isDirectory()) {
          scan(full)
        } else if (item.isFile()) {
          count++
          try {
            const stat = fs.statSync(full)
            totalBytes += stat.size
          } catch {}
        }
      }
    } catch {}
  }

  scan(targetDir)
  return { count, totalBytes }
}

/**
 * Purges the thumbnail cache
 */
export function clearThumbnailCache(username?: string): { clearedCount: number; freedBytes: number } {
  ensureDataStructure()
  const stats = getThumbnailCacheStats(username)
  
  if (username) {
    const userDir = path.join(THUMBNAILS_DIR, username.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_'))
    if (fs.existsSync(userDir)) {
      try {
        fs.rmSync(userDir, { recursive: true, force: true })
      } catch (e) {
        console.error('Error clearing user thumbnail cache:', e)
      }
    }
  } else {
    if (fs.existsSync(THUMBNAILS_DIR)) {
      try {
        fs.rmSync(THUMBNAILS_DIR, { recursive: true, force: true })
        fs.mkdirSync(THUMBNAILS_DIR, { recursive: true })
      } catch (e) {
        console.error('Error clearing thumbnail cache:', e)
      }
    }
  }

  return { clearedCount: stats.count, freedBytes: stats.totalBytes }
}

