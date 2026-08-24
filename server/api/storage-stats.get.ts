import { promises as fs } from 'fs'
import fsClassic from 'fs'
import path from 'path'
import { defineEventHandler } from 'h3'
import { TRASH_DIR, getConfig } from '../utils/storage'
import { getAuthenticatedUser, getUserUploadsDir } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthenticatedUser(event)
  if (!user) {
    return {
      totalBytes: 0,
      fileCount: 0,
      folderCount: 0,
      categoryBytes: { image: 0, video: 0, audio: 0, document: 0, code: 0, archive: 0, other: 0 },
      trashBytes: 0,
      trashCount: 0,
      maxQuotaBytes: 0,
      quotaUsedPercentage: 0
    }
  }

  const targetDir = getUserUploadsDir(user.username)

  let totalBytes = 0
  let fileCount = 0
  let folderCount = 0
  const categoryBytes: Record<string, number> = {
    image: 0,
    video: 0,
    audio: 0,
    document: 0,
    code: 0,
    archive: 0,
    other: 0
  }

  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff']
  const videoExts = ['.mp4', '.webm', '.ogv', '.mov', '.mkv', '.avi']
  const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']
  const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.rtf', '.csv']
  const codeExts = ['.js', '.ts', '.vue', '.json', '.html', '.css', '.scss', '.py', '.c', '.cpp', '.cs', '.go', '.rs', '.java', '.php', '.sh', '.yml', '.yaml', '.xml', '.sql']
  const archiveExts = ['.zip', '.tar', '.gz', '.7z', '.rar']

  async function calculateDir(dir: string) {
    if (!fsClassic.existsSync(dir)) return
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        try {
          const stat = await fs.stat(fullPath)
          if (entry.isDirectory()) {
            folderCount++
            await calculateDir(fullPath)
          } else {
            fileCount++
            totalBytes += stat.size
            const ext = path.extname(entry.name).toLowerCase()
            if (imageExts.includes(ext)) {
              categoryBytes.image += stat.size
            } else if (videoExts.includes(ext)) {
              categoryBytes.video += stat.size
            } else if (audioExts.includes(ext)) {
              categoryBytes.audio += stat.size
            } else if (docExts.includes(ext)) {
              categoryBytes.document += stat.size
            } else if (codeExts.includes(ext)) {
              categoryBytes.code += stat.size
            } else if (archiveExts.includes(ext)) {
              categoryBytes.archive += stat.size
            } else {
              categoryBytes.other += stat.size
            }
          }
        } catch {}
      }
    } catch {}
  }

  await calculateDir(targetDir)

  // Trash stats
  let trashBytes = 0
  let trashCount = 0
  if (fsClassic.existsSync(TRASH_DIR)) {
    try {
      const entries = await fs.readdir(TRASH_DIR, { withFileTypes: true })
      for (const entry of entries) {
        try {
          const stat = await fs.stat(path.join(TRASH_DIR, entry.name))
          trashBytes += stat.size
          trashCount++
        } catch {}
      }
    } catch {}
  }

  const config = getConfig()
  const maxQuotaBytes = (config.maxUploadSizeMB || 1024) * 1024 * 1024

  return {
    totalBytes,
    fileCount,
    folderCount,
    categoryBytes,
    trashBytes,
    trashCount,
    maxQuotaBytes,
    quotaUsedPercentage: maxQuotaBytes > 0 ? Math.min(100, Math.round((totalBytes / maxQuotaBytes) * 100)) : 0
  }
})
