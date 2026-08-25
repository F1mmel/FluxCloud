import { EventEmitter } from 'events'
import fs from 'fs'
import path from 'path'
import { UPLOADS_DIR } from './storage'

export interface CloudEvent {
  type: 'upload' | 'delete' | 'rename' | 'folder' | 'move' | 'update' | 'file_change'
  username: string
  path?: string
  targetPath?: string
  timestamp: number
  details?: Record<string, any>
}

type EventListener = (event: CloudEvent) => void

const emitter = new EventEmitter()
emitter.setMaxListeners(500)

let watcherInitialized = false

/**
 * Broadcasts a file event to all connected listeners
 */
export function broadcastFileEvent(
  username: string,
  type: CloudEvent['type'],
  data: { path?: string; targetPath?: string; details?: Record<string, any> } = {}
) {
  const event: CloudEvent = {
    type,
    username: username || 'all',
    path: data.path,
    targetPath: data.targetPath,
    timestamp: Date.now(),
    details: data.details
  }

  // Emit to specific user channel, wildcard/all channel, and global channel
  if (username) {
    emitter.emit(`user:${username.toLowerCase()}`, event)
  }
  emitter.emit('user:all', event)
  emitter.emit('file_change_global', event)
}

/**
 * Subscribes to events for a specific user (or all)
 * Returns an unsubscribe cleanup function
 */
export function subscribeFileEvents(username: string, listener: EventListener): () => void {
  const userChannel = `user:${(username || 'all').toLowerCase()}`
  
  const handler: EventListener = (ev) => {
    listener(ev)
  }

  emitter.on(userChannel, handler)
  if (userChannel !== 'user:all') {
    emitter.on('user:all', handler)
  }
  emitter.on('file_change_global', handler)
  
  // Also initialize directory watcher if not already active
  initFilesystemWatcher()

  return () => {
    emitter.off(userChannel, handler)
    if (userChannel !== 'user:all') {
      emitter.off('user:all', handler)
    }
    emitter.off('file_change_global', handler)
  }
}

/**
 * Optional filesystem watcher on uploads directory to capture external file changes
 */
function initFilesystemWatcher() {
  if (watcherInitialized) return
  watcherInitialized = true

  try {
    const usersDir = path.join(UPLOADS_DIR, 'users')
    if (!fs.existsSync(usersDir)) {
      fs.mkdirSync(usersDir, { recursive: true })
    }

    let debounceTimer: NodeJS.Timeout | null = null

    fs.watch(usersDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return
      
      // Debounce events to prevent spamming
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const normalized = String(filename).replace(/\\/g, '/')
        const parts = normalized.split('/')
        const user = parts[0] || 'all'
        const relPath = parts.slice(1).join('/')

        broadcastFileEvent(user, 'file_change', { path: relPath })
      }, 300)
    })
  } catch (err) {
    // fs.watch might not be supported on all environments, non-fatal
    console.warn('[FluxCloud Events] Filesystem watcher fallback warning:', err)
  }
}
