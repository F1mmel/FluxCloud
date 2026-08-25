import { promises as fs } from 'fs'
import path from 'path'
import { defineEventHandler, getQuery, createError } from 'h3'
import { sanitizeRelativePath, getMetadata, getMimeType, getShares, isShareTargetAvailable } from '../utils/storage'
import { requireAuth, getUserUploadsDir } from '../utils/auth'

export interface FileItemInfo {
  name: string
  relativePath: string
  isDirectory: boolean
  size: number
  createdAt: string
  modifiedAt: string
  url: string | null
  thumbnailUrl: string | null
  mimeType: string
  extension: string
  isFavorite: boolean
  isShared: boolean
  shareId: string | null
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const baseDir = getUserUploadsDir(user.username)

  const query = getQuery(event)
  const relativePath = (query.path as string) || ''
  const recursive = query.recursive === 'true'
  const search = (query.search as string || '').toLowerCase().trim()
  const category = (query.category as string || 'all').toLowerCase()
  
  const safeRel = sanitizeRelativePath(relativePath)
  const uploadDir = path.join(baseDir, safeRel)

  const meta = getMetadata()
  const favoriteSet = new Set(meta.favorites || [])

  // Map active shares for current user
  const now = new Date()
  const allShares = getShares()
  const shareMap = new Map<string, string>()
  
  for (const s of allShares) {
    if (s.expiresAt && new Date(s.expiresAt) <= now) continue
    if (!isShareTargetAvailable(s, user.username)) continue
    
    let isUserMatch = false
    let rel = s.targetPath
    if (s.username && s.username.toLowerCase() === user.username.toLowerCase()) {
      isUserMatch = true
    }
    if (rel.startsWith(`users/${user.username}/`)) {
      isUserMatch = true
      rel = rel.slice(`users/${user.username}/`.length)
    }

    if (isUserMatch) {
      shareMap.set(rel, s.id)
    }
  }

  const getCategory = (ext: string, isDir: boolean): string => {
    if (isDir) return 'folder'
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff']
    const videoExts = ['.mp4', '.webm', '.ogv', '.mov', '.mkv', '.avi']
    const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']
    const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.rtf', '.csv']
    const codeExts = ['.js', '.ts', '.vue', '.json', '.html', '.css', '.scss', '.py', '.c', '.cpp', '.cs', '.go', '.rs', '.java', '.php', '.sh', '.yml', '.yaml', '.xml', '.sql']
    const archiveExts = ['.zip', '.tar', '.gz', '.7z', '.rar']

    if (imageExts.includes(ext)) return 'image'
    if (videoExts.includes(ext)) return 'video'
    if (audioExts.includes(ext)) return 'audio'
    if (docExts.includes(ext)) return 'document'
    if (codeExts.includes(ext)) return 'code'
    if (archiveExts.includes(ext)) return 'archive'
    return 'other'
  }

  try {
    if (recursive) {
      const allEntries: FileItemInfo[] = []
      
      async function scanDirectory(dir: string) {
        let entries
        try {
          entries = await fs.readdir(dir, { withFileTypes: true })
        } catch {
          return
        }

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          let stats
          try {
            stats = await fs.stat(fullPath)
          } catch {
            continue
          }

          const isDirectory = entry.isDirectory()
          const relativeToRoot = path.relative(baseDir, fullPath).replace(/\\/g, '/')
          const ext = isDirectory ? '' : path.extname(entry.name).toLowerCase()
          const itemCat = getCategory(ext, isDirectory)

          if (search && !entry.name.toLowerCase().includes(search) && !relativeToRoot.toLowerCase().includes(search)) {
            if (isDirectory) {
              await scanDirectory(fullPath)
            }
            continue
          }

          if (category !== 'all' && itemCat !== category && !(category === 'folder' && isDirectory)) {
            if (isDirectory) {
              await scanDirectory(fullPath)
            }
            continue
          }

          const urlPath = `users/${user.username}/${relativeToRoot}`
          const hasThumbnail = !isDirectory && (itemCat === 'image' || itemCat === 'video')

          allEntries.push({
            name: entry.name,
            relativePath: relativeToRoot,
            isDirectory,
            size: isDirectory ? 0 : stats.size,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
            url: isDirectory ? null : `/uploads/${encodeURI(urlPath)}`,
            thumbnailUrl: hasThumbnail ? `/api/thumbnail?path=${encodeURIComponent(urlPath)}` : null,
            mimeType: isDirectory ? 'directory' : getMimeType(entry.name),
            extension: ext,
            isFavorite: favoriteSet.has(relativeToRoot),
            isShared: shareMap.has(relativeToRoot),
            shareId: shareMap.get(relativeToRoot) || null
          })
          
          if (isDirectory) {
            await scanDirectory(fullPath)
          }
        }
      }
      
      await scanDirectory(uploadDir)
      return allEntries
    } else {
      let entries
      try {
        entries = await fs.readdir(uploadDir, { withFileTypes: true })
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          return []
        }
        throw err
      }

      const fileStats = await Promise.all(
        entries.map(async (entry) => {
          const entryPath = path.join(uploadDir, entry.name)
          try {
            const stats = await fs.stat(entryPath)
            const isDirectory = entry.isDirectory()
            const relativeToRoot = path.relative(baseDir, entryPath).replace(/\\/g, '/')
            const ext = isDirectory ? '' : path.extname(entry.name).toLowerCase()
            const itemCat = getCategory(ext, isDirectory)

            if (search && !entry.name.toLowerCase().includes(search)) {
              return null
            }

            if (category !== 'all' && itemCat !== category && !(category === 'folder' && isDirectory)) {
              return null
            }
            
            const urlPath = `users/${user.username}/${relativeToRoot}`
            const hasThumbnail = !isDirectory && (itemCat === 'image' || itemCat === 'video')

            return {
              name: entry.name,
              relativePath: relativeToRoot,
              isDirectory,
              size: isDirectory ? 0 : stats.size,
              createdAt: stats.birthtime.toISOString(),
              modifiedAt: stats.mtime.toISOString(),
              url: isDirectory ? null : `/uploads/${encodeURI(urlPath)}`,
              thumbnailUrl: hasThumbnail ? `/api/thumbnail?path=${encodeURIComponent(urlPath)}` : null,
              mimeType: isDirectory ? 'directory' : getMimeType(entry.name),
              extension: ext,
              isFavorite: favoriteSet.has(relativeToRoot),
              isShared: shareMap.has(relativeToRoot),
              shareId: shareMap.get(relativeToRoot) || null
            } as FileItemInfo
          } catch {
            return null
          }
        })
      )
      
      const filtered = fileStats.filter((f): f is FileItemInfo => f !== null)

      return filtered.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      })
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Error reading files: ${error.message}`,
    })
  }
})
