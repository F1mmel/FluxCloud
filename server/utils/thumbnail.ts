import fs from 'node:fs'
import path from 'node:path'
import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { getConfig, getThumbnailDiskPath } from './storage'

const execFileAsync = promisify(execFile)

let ffmpegCache: { checkedAt: number; available: boolean; version: string | null } | null = null
const activeJobPromises = new Map<string, Promise<boolean>>()

/**
 * Checks whether ffmpeg is installed and accessible on the host machine
 */
export async function checkFfmpegInstalled(forceRefresh = false): Promise<{ available: boolean; version: string | null }> {
  const now = Date.now()
  if (!forceRefresh && ffmpegCache && (now - ffmpegCache.checkedAt < 30000)) {
    return { available: ffmpegCache.available, version: ffmpegCache.version }
  }

  try {
    const { stdout } = await execFileAsync('ffmpeg', ['-version'], { timeout: 3000 })
    const firstLine = stdout.split('\n')[0] || ''
    const versionMatch = firstLine.match(/ffmpeg\s+version\s+([^\s]+)/i)
    const version = versionMatch ? versionMatch[1] : firstLine.trim()

    ffmpegCache = {
      checkedAt: now,
      available: true,
      version: version || 'Installed'
    }
    return { available: true, version: ffmpegCache.version }
  } catch (err) {
    ffmpegCache = {
      checkedAt: now,
      available: false,
      version: null
    }
    return { available: false, version: null }
  }
}

/**
 * Simple Async Worker Queue with strict concurrency limiting
 */
class ThumbnailQueue {
  private queue: Array<() => Promise<void>> = []
  private activeCount = 0

  public async run<T>(fn: () => Promise<T>): Promise<T> {
    const maxWorkers = Math.max(1, Math.min(16, getConfig().thumbnailWorkers || 4))

    if (this.activeCount >= maxWorkers) {
      await new Promise<void>((resolve) => {
        this.queue.push(async () => {
          resolve()
        })
      })
    }

    this.activeCount++
    try {
      return await fn()
    } finally {
      this.activeCount--
      if (this.queue.length > 0) {
        const next = this.queue.shift()
        if (next) next()
      }
    }
  }

  public get pendingCount(): number {
    return this.queue.length
  }

  public get runningCount(): number {
    return this.activeCount
  }
}

export const thumbnailQueue = new ThumbnailQueue()

/**
 * Executes ffmpeg command with arguments and a timeout
 */
function runFfmpeg(args: string[], timeoutMs = 20000): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false
    const finish = (success: boolean) => {
      if (!resolved) {
        resolved = true
        resolve(success)
      }
    }

    try {
      const proc = spawn('ffmpeg', args, {
        stdio: ['ignore', 'ignore', 'pipe'],
        windowsHide: true
      })

      const timer = setTimeout(() => {
        try {
          proc.kill('SIGKILL')
        } catch {}
        finish(false)
      }, timeoutMs)

      let stderrOutput = ''
      proc.stderr?.on('data', (chunk) => {
        stderrOutput += chunk.toString()
      })

      proc.on('error', (err) => {
        clearTimeout(timer)
        finish(false)
      })

      proc.on('close', (code) => {
        clearTimeout(timer)
        finish(code === 0)
      })
    } catch (e) {
      finish(false)
    }
  })
}

/**
 * Generates a thumbnail for an image or video file
 */
export async function generateThumbnailFile(
  sourcePath: string,
  destThumbPath: string,
  isVideo: boolean,
  logLabel = ''
): Promise<boolean> {
  if (!fs.existsSync(sourcePath)) return false

  const destDir = path.dirname(destThumbPath)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  const { available } = await checkFfmpegInstalled()
  if (!available) {
    console.warn(`[Thumbnail] FFmpeg is not installed on host. Cannot generate thumbnail for: ${logLabel || path.basename(sourcePath)}`)
    return false
  }

  const startTime = Date.now()
  const tempDest = `${destThumbPath}.tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.webp`

  console.log(`[Thumbnail] [Worker Queue] Generating ${isVideo ? 'VIDEO' : 'IMAGE'} thumbnail: ${logLabel || path.basename(sourcePath)}`)

  let success = false

  if (isVideo) {
    // 1. Try extracting frame at 1.0 second
    success = await runFfmpeg([
      '-y',
      '-ss', '00:00:01',
      '-i', sourcePath,
      '-vframes', '1',
      '-vf', "scale='min(320,iw)':-2",
      '-c:v', 'libwebp',
      '-q:v', '75',
      tempDest
    ])

    // 2. If failed (e.g. video shorter than 1s), retry from start (0s)
    if (!success || !fs.existsSync(tempDest)) {
      success = await runFfmpeg([
        '-y',
        '-ss', '00:00:00.100',
        '-i', sourcePath,
        '-vframes', '1',
        '-vf', "scale='min(320,iw)':-2",
        '-c:v', 'libwebp',
        '-q:v', '75',
        tempDest
      ])
    }
  } else {
    // Image thumbnail generation
    success = await runFfmpeg([
      '-y',
      '-i', sourcePath,
      '-vframes', '1',
      '-vf', "scale='min(320,iw)':-2",
      '-c:v', 'libwebp',
      '-q:v', '75',
      tempDest
    ])
  }

  const elapsedMs = Date.now() - startTime

  if (success && fs.existsSync(tempDest)) {
    try {
      fs.renameSync(tempDest, destThumbPath)
      const size = fs.statSync(destThumbPath).size
      console.log(`[Thumbnail] Generated thumbnail in ${elapsedMs}ms (${(size / 1024).toFixed(1)} KB): ${logLabel || path.basename(sourcePath)}`)
      return true
    } catch {
      try {
        fs.copyFileSync(tempDest, destThumbPath)
        fs.unlinkSync(tempDest)
        const size = fs.statSync(destThumbPath).size
        console.log(`[Thumbnail] Generated thumbnail in ${elapsedMs}ms (${(size / 1024).toFixed(1)} KB): ${logLabel || path.basename(sourcePath)}`)
        return true
      } catch (e) {
        console.error(`[Thumbnail] Error moving generated thumbnail:`, e)
      }
    }
  }

  if (fs.existsSync(tempDest)) {
    try {
      fs.unlinkSync(tempDest)
    } catch {}
  }

  console.warn(`[Thumbnail] Generation failed after ${elapsedMs}ms for: ${logLabel || path.basename(sourcePath)}`)
  return false
}

/**
 * Queued & Deduplicated thumbnail generation
 */
export async function getOrGenerateThumbnail(
  username: string,
  relativePath: string,
  sourceFullPath: string,
  isVideo: boolean
): Promise<{ thumbPath: string | null; wasGenerated: boolean }> {
  const config = getConfig()
  if (config.thumbnailsEnabled === false) {
    return { thumbPath: null, wasGenerated: false }
  }

  if (!fs.existsSync(sourceFullPath)) {
    return { thumbPath: null, wasGenerated: false }
  }

  let stat: fs.Stats
  try {
    stat = fs.statSync(sourceFullPath)
    if (stat.isDirectory()) return { thumbPath: null, wasGenerated: false }
  } catch {
    return { thumbPath: null, wasGenerated: false }
  }

  const { fullPath: thumbPath, thumbId } = getThumbnailDiskPath(username, relativePath, stat.mtimeMs, stat.size)

  // If already cached on disk, return immediately
  if (fs.existsSync(thumbPath)) {
    return { thumbPath, wasGenerated: false }
  }

  // Deduplicate in-flight requests for the same thumbnail ID
  if (activeJobPromises.has(thumbId)) {
    const ok = await activeJobPromises.get(thumbId)!
    return { thumbPath: ok && fs.existsSync(thumbPath) ? thumbPath : null, wasGenerated: ok }
  }

  const logLabel = `${username}/${relativePath}`
  const jobPromise = thumbnailQueue.run(async () => {
    return await generateThumbnailFile(sourceFullPath, thumbPath, isVideo, logLabel)
  })

  activeJobPromises.set(thumbId, jobPromise)

  try {
    const success = await jobPromise
    return {
      thumbPath: success && fs.existsSync(thumbPath) ? thumbPath : null,
      wasGenerated: success
    }
  } finally {
    activeJobPromises.delete(thumbId)
  }
}
