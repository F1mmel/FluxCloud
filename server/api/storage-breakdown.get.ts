import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler } from 'h3'
import { getFileCategory, sanitizeRelativePath, getConfig } from '../utils/storage'
import { requireAuth, resolveUserUploadPath } from '../utils/auth'

interface FileEntry {
  name: string
  relativePath: string
  size: number
  category: string
  modifiedAt: string
}

export default defineEventHandler((event) => {
  const user = requireAuth(event)
  const username = user.username
  const rootDir = resolveUserUploadPath(username, '')

  const categoriesMap: Record<string, { name: string; bytes: number; count: number; color: string }> = {
    image: { name: 'Images', bytes: 0, count: 0, color: '#10B981' },
    video: { name: 'Videos', bytes: 0, count: 0, color: '#8B5CF6' },
    audio: { name: 'Audio', bytes: 0, count: 0, color: '#F59E0B' },
    document: { name: 'Documents', bytes: 0, count: 0, color: '#3B82F6' },
    code: { name: 'Code & Text', bytes: 0, count: 0, color: '#EC4899' },
    archive: { name: 'Archives', bytes: 0, count: 0, color: '#6366F1' },
    other: { name: 'Other', bytes: 0, count: 0, color: '#94A3B8' }
  }

  let totalBytes = 0
  let totalFiles = 0
  let totalFolders = 0
  const allFiles: FileEntry[] = []

  function scanDir(currentDir: string, relBase = '') {
    if (!fs.existsSync(currentDir)) return
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      const relPath = relBase ? `${relBase}/${entry.name}` : entry.name

      try {
        const stat = fs.statSync(fullPath)
        if (entry.isDirectory()) {
          totalFolders++
          scanDir(fullPath, relPath)
        } else if (entry.isFile()) {
          totalFiles++
          totalBytes += stat.size
          const cat = getFileCategory(entry.name, false)
          if (categoriesMap[cat]) {
            categoriesMap[cat].bytes += stat.size
            categoriesMap[cat].count++
          } else {
            categoriesMap.other.bytes += stat.size
            categoriesMap.other.count++
          }

          allFiles.push({
            name: entry.name,
            relativePath: sanitizeRelativePath(relPath),
            size: stat.size,
            category: cat,
            modifiedAt: stat.mtime.toISOString()
          })
        }
      } catch (e) {
        // Skip inaccessible entries
      }
    }
  }

  scanDir(rootDir)

  // Sort top largest files
  allFiles.sort((a, b) => b.size - a.size)
  const largestFiles = allFiles.slice(0, 10)

  // Calculate percentages
  const categories = Object.entries(categoriesMap).map(([key, data]) => ({
    id: key,
    name: data.name,
    bytes: data.bytes,
    count: data.count,
    color: data.color,
    percentage: totalBytes > 0 ? parseFloat(((data.bytes / totalBytes) * 100).toFixed(1)) : 0
  })).filter(c => c.count > 0 || c.bytes > 0)

  const config = getConfig()
  const maxStorageMB = config.maxUploadSizeMB ? config.maxUploadSizeMB * 10 : 10240 // Default 10GB workspace quota
  const maxStorageBytes = maxStorageMB * 1024 * 1024
  const quotaUsedPercentage = maxStorageBytes > 0 ? parseFloat(((totalBytes / maxStorageBytes) * 100).toFixed(1)) : 0

  return {
    totalBytes,
    totalFiles,
    totalFolders,
    maxStorageBytes,
    quotaUsedPercentage: Math.min(100, quotaUsedPercentage),
    categories,
    largestFiles
  }
})
