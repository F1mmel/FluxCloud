import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler } from 'h3'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'
import { extractExifFromFile, PhotoExif } from '../utils/exif'
import { sanitizeRelativePath, getMimeType } from '../utils/storage'

export interface PhotoItem {
  id: string
  name: string
  relativePath: string
  url: string
  thumbnailUrl: string
  size: number
  isVideo: boolean
  mimeType: string
  dateTaken: string // ISO string
  monthGroup: string // "August 2026"
  exif: PhotoExif
}

const MEDIA_REGEX = /\.(jpg|jpeg|png|webp|gif|bmp|heic|mp4|webm|mov|mkv|avi)$/i
const VIDEO_REGEX = /\.(mp4|webm|mov|mkv|avi)$/i

export default defineEventHandler((event) => {
  const user = requireAuth(event)
  const username = user.username
  const userRoot = resolveUserUploadPath(username, '')

  if (!fs.existsSync(userRoot)) {
    return []
  }

  const mediaItems: PhotoItem[] = []

  const scanDir = (currentDir: string, currentRel: string) => {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })

      for (const entry of entries) {
        // Skip hidden/system files and trash
        if (entry.name.startsWith('.') || entry.name === 'trash') continue

        const fullPath = path.join(currentDir, entry.name)
        const relPath = currentRel ? `${currentRel}/${entry.name}` : entry.name

        if (entry.isDirectory()) {
          scanDir(fullPath, relPath)
        } else if (MEDIA_REGEX.test(entry.name)) {
          let stat: fs.Stats
          try {
            stat = fs.statSync(fullPath)
          } catch {
            continue
          }

          const isVideo = VIDEO_REGEX.test(entry.name)
          let exif: PhotoExif = {}
          let dateTaken = stat.birthtime && stat.birthtime.getTime() > 0 ? stat.birthtime.toISOString() : stat.mtime.toISOString()

          if (!isVideo && /\.(jpg|jpeg|webp|tiff)$/i.test(entry.name)) {
            exif = extractExifFromFile(fullPath)
            if (exif.dateTaken) {
              dateTaken = exif.dateTaken
            }
          }

          const d = new Date(dateTaken)
          const monthGroup = isNaN(d.getTime()) 
            ? 'Unknown Date'
            : d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

          const safeRel = sanitizeRelativePath(relPath)
          const urlPath = `users/${username}/${safeRel}`

          mediaItems.push({
            id: `photo_${safeRel.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: entry.name,
            relativePath: safeRel,
            url: `/uploads/${encodeURI(urlPath)}`,
            thumbnailUrl: `/api/thumbnail?path=${encodeURIComponent(urlPath)}`,
            size: stat.size,
            isVideo,
            mimeType: getMimeType(entry.name),
            dateTaken,
            monthGroup,
            exif
          })
        }
      }
    } catch {}
  }

  scanDir(userRoot, '')

  // Sort newest first
  mediaItems.sort((a, b) => {
    const timeA = new Date(a.dateTaken).getTime() || 0
    const timeB = new Date(b.dateTaken).getTime() || 0
    return timeB - timeA
  })

  // Group by Month/Year
  const groupMap = new Map<string, PhotoItem[]>()
  for (const item of mediaItems) {
    if (!groupMap.has(item.monthGroup)) {
      groupMap.set(item.monthGroup, [])
    }
    groupMap.get(item.monthGroup)!.push(item)
  }

  const timeline = Array.from(groupMap.entries()).map(([monthTitle, items]) => ({
    monthTitle,
    items
  }))

  return timeline
})
