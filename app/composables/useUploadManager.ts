import { ref, computed } from 'vue'

export interface UploadItem {
  id: string
  file: File
  name: string
  size: number
  targetPath: string
  shareId?: string
  status: 'queued' | 'checking' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled'
  progress: number // 0 to 100
  uploadedBytes: number
  totalChunks: number
  uploadedChunks: number[]
  speed: number // bytes per sec
  etaSeconds: number // estimated remaining seconds
  errorMessage: string | null
  abortController?: AbortController | null
  startTime?: number
  lastBytes?: number
  lastSpeedSampleTime?: number
  conflictResolved?: boolean
}

export interface ConflictItem {
  uploadItem: UploadItem
  name: string
  size: number
  existingFile?: {
    name: string
    size: number
    modifiedAt: string
    isDirectory: boolean
  }
}

const CHUNK_SIZE = 5 * 1024 * 1024 // 5 MB per slice
const MAX_CONCURRENT_UPLOADS = 3

const uploadQueue = ref<UploadItem[]>([])
const isWidgetExpanded = ref(true)
const activeConflict = ref<ConflictItem | null>(null)
const pendingConflicts = ref<ConflictItem[]>([])
const defaultConflictAction = ref<'overwrite' | 'rename' | 'skip' | null>(null)
let isProcessingQueue = false
let autoDismissTimer: any = null

export function useUploadManager() {
  const activeUploads = computed(() => uploadQueue.value.filter(u => u.status === 'uploading' || u.status === 'checking'))
  const activeCount = computed(() => activeUploads.value.length)
  const queuedCount = computed(() => uploadQueue.value.filter(u => u.status === 'queued').length)
  const completedCount = computed(() => uploadQueue.value.filter(u => u.status === 'completed').length)
  const errorCount = computed(() => uploadQueue.value.filter(u => u.status === 'error').length)
  const totalCount = computed(() => uploadQueue.value.length)
  const hasActiveOrQueued = computed(() => activeCount.value > 0 || queuedCount.value > 0)

  const totalSpeed = computed(() => {
    return activeUploads.value.reduce((sum, item) => sum + (item.speed || 0), 0)
  })

  const overallProgress = computed(() => {
    if (uploadQueue.value.length === 0) return 0
    const totalBytes = uploadQueue.value.reduce((sum, item) => sum + item.size, 0)
    if (totalBytes === 0) return 100
    const uploadedBytes = uploadQueue.value.reduce((sum, item) => sum + (item.uploadedBytes || 0), 0)
    return Math.min(100, Math.round((uploadedBytes / totalBytes) * 100))
  })

  const generateUploadId = (file: File, targetPath: string): string => {
    return `up_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${encodeURIComponent(file.name).slice(0, 20)}`
  }

  const generateAutoRename = (originalName: string): string => {
    const dotIdx = originalName.lastIndexOf('.')
    if (dotIdx > 0) {
      const base = originalName.slice(0, dotIdx)
      const ext = originalName.slice(dotIdx)
      return `${base} (1)${ext}`
    }
    return `${originalName} (1)`
  }

  const enqueueFiles = (files: FileList | File[], targetPath = '', shareId = '') => {
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer)
      autoDismissTimer = null
    }

    // Reset remembered conflict action on fresh user drop
    defaultConflictAction.value = null

    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    for (const file of fileArray) {
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE))
      const uploadItem: UploadItem = {
        id: generateUploadId(file, targetPath),
        file,
        name: file.name,
        size: file.size,
        targetPath,
        shareId: shareId || undefined,
        status: 'queued',
        progress: 0,
        uploadedBytes: 0,
        totalChunks,
        uploadedChunks: [],
        speed: 0,
        etaSeconds: 0,
        errorMessage: null,
        abortController: null,
        conflictResolved: false
      }
      uploadQueue.value.unshift(uploadItem)
    }

    isWidgetExpanded.value = true
    processQueue()
  }

  const checkAutoDismiss = () => {
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer)
      autoDismissTimer = null
    }

    if (
      uploadQueue.value.length > 0 &&
      uploadQueue.value.every(u => u.status === 'completed')
    ) {
      autoDismissTimer = setTimeout(() => {
        clearCompleted()
        autoDismissTimer = null
      }, 1000)
    }
  }

  /**
   * Safe non-blocking queue processor
   */
  const processQueue = () => {
    if (isProcessingQueue) return
    isProcessingQueue = true

    try {
      const runningCount = uploadQueue.value.filter(u => u.status === 'uploading' || u.status === 'checking').length
      const availableSlots = MAX_CONCURRENT_UPLOADS - runningCount

      if (availableSlots <= 0) return

      const queuedItems = uploadQueue.value.filter(u => u.status === 'queued').slice(0, availableSlots)
      for (const item of queuedItems) {
        // Mark as checking immediately so it is not picked twice
        item.status = 'checking'
        uploadSingleItem(item)
      }
    } finally {
      isProcessingQueue = false
    }
  }

  const uploadSingleItem = async (item: UploadItem) => {
    // 1. Conflict check if not yet verified
    if (!item.conflictResolved) {
      try {
        const checkRes = await $fetch<{ exists: boolean; existingFile?: any }>('/api/upload-check-conflict', {
          method: 'POST',
          body: {
            targetPath: item.targetPath,
            fileName: item.name,
            shareId: item.shareId
          }
        })

        if (checkRes?.exists) {
          if (defaultConflictAction.value === 'overwrite') {
            item.conflictResolved = true
          } else if (defaultConflictAction.value === 'skip') {
            cancelUpload(item.id)
            return
          } else if (defaultConflictAction.value === 'rename') {
            item.name = generateAutoRename(item.name)
            item.conflictResolved = true
          } else {
            // Pause item and ask user
            item.status = 'paused'
            const conflictData: ConflictItem = {
              uploadItem: item,
              name: item.name,
              size: item.size,
              existingFile: checkRes.existingFile
            }
            pendingConflicts.value.push(conflictData)
            if (!activeConflict.value) {
              activeConflict.value = conflictData
            }
            // Allow next item in queue to process
            processQueue()
            return
          }
        } else {
          item.conflictResolved = true
        }
      } catch {
        item.conflictResolved = true
      }
    }

    item.status = 'uploading'
    item.errorMessage = null
    item.abortController = new AbortController()
    item.startTime = Date.now()
    item.lastBytes = item.uploadedBytes
    item.lastSpeedSampleTime = Date.now()

    // Check existing chunks on server if resuming
    try {
      const statusRes = await $fetch<{ uploadedChunks: number[] }>(`/api/upload-chunk-status?uploadId=${encodeURIComponent(item.id)}`)
      if (statusRes && Array.isArray(statusRes.uploadedChunks)) {
        item.uploadedChunks = statusRes.uploadedChunks
        item.uploadedBytes = Math.min(item.size, item.uploadedChunks.length * CHUNK_SIZE)
        item.progress = Math.min(100, Math.round((item.uploadedBytes / item.size) * 100))
      }
    } catch {}

    // Upload missing chunks sequentially
    for (let chunkIndex = 0; chunkIndex < item.totalChunks; chunkIndex++) {
      if (item.status !== 'uploading') {
        break // Paused or Cancelled
      }

      if (item.uploadedChunks.includes(chunkIndex)) {
        continue // Already uploaded
      }

      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(item.size, start + CHUNK_SIZE)
      const chunkBlob = item.file.slice(start, end)
      const chunkSize = end - start

      try {
        const headers: Record<string, string> = {
          'x-upload-id': item.id,
          'x-chunk-index': chunkIndex.toString(),
          'x-total-chunks': item.totalChunks.toString(),
          'x-file-name': encodeURIComponent(item.name),
          'x-file-size': item.size.toString(),
          'x-target-path': item.targetPath || '',
          'Content-Type': 'application/octet-stream'
        }

        if (item.shareId) {
          headers['x-share-id'] = item.shareId
        }

        const chunkStartTime = Date.now()

        const response = await fetch('/api/upload-chunk', {
          method: 'POST',
          headers,
          body: chunkBlob,
          signal: item.abortController?.signal
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.statusMessage || `Server responded with ${response.status}`)
        }

        // Chunk uploaded successfully
        item.uploadedChunks.push(chunkIndex)
        item.uploadedBytes = Math.min(item.size, item.uploadedBytes + chunkSize)
        item.progress = Math.min(100, Math.round((item.uploadedBytes / item.size) * 100))

        // Rolling speed calculation
        const now = Date.now()
        const timeDiff = (now - (item.lastSpeedSampleTime || item.startTime || now)) / 1000
        if (timeDiff >= 0.5) {
          const bytesDiff = item.uploadedBytes - (item.lastBytes || 0)
          const instantSpeed = bytesDiff / timeDiff
          item.speed = Math.round(item.speed ? (item.speed * 0.7 + instantSpeed * 0.3) : instantSpeed)
          item.lastBytes = item.uploadedBytes
          item.lastSpeedSampleTime = now

          // ETA calculation
          const remainingBytes = item.size - item.uploadedBytes
          if (item.speed > 0) {
            item.etaSeconds = Math.max(1, Math.round(remainingBytes / item.speed))
          }
        }
      } catch (err: any) {
        if (item.status === 'paused' || item.status === 'cancelled') {
          return // Controlled abort
        }
        item.status = 'error'
        item.errorMessage = err.message || 'Upload failed'
        item.speed = 0
        item.etaSeconds = 0
        processQueue()
        return
      }
    }

    if (item.status === 'uploading') {
      item.status = 'completed'
      item.progress = 100
      item.uploadedBytes = item.size
      item.speed = 0
      item.etaSeconds = 0
    }

    // Trigger next item in queue
    processQueue()
    checkAutoDismiss()
  }

  const resolveConflict = (payload: { action: 'overwrite' | 'rename' | 'skip'; applyToAll?: boolean }) => {
    if (!activeConflict.value) return

    const { action, applyToAll } = payload
    if (applyToAll) {
      defaultConflictAction.value = action
    }

    const currentConflict = activeConflict.value
    const item = currentConflict.uploadItem

    // Remove from pending conflicts list
    pendingConflicts.value = pendingConflicts.value.filter(c => c.uploadItem.id !== item.id)

    if (action === 'skip') {
      cancelUpload(item.id)
    } else if (action === 'overwrite') {
      item.conflictResolved = true
      item.status = 'queued'
      processQueue()
    } else if (action === 'rename') {
      item.name = generateAutoRename(item.name)
      item.conflictResolved = true
      item.status = 'queued'
      processQueue()
    }

    if (applyToAll && pendingConflicts.value.length > 0) {
      const remaining = [...pendingConflicts.value]
      pendingConflicts.value = []
      for (const c of remaining) {
        if (action === 'skip') {
          cancelUpload(c.uploadItem.id)
        } else if (action === 'overwrite') {
          c.uploadItem.conflictResolved = true
          c.uploadItem.status = 'queued'
        } else if (action === 'rename') {
          c.uploadItem.name = generateAutoRename(c.uploadItem.name)
          c.uploadItem.conflictResolved = true
          c.uploadItem.status = 'queued'
        }
      }
      activeConflict.value = null
      processQueue()
    } else {
      activeConflict.value = pendingConflicts.value.length > 0 ? pendingConflicts.value[0] : null
    }
  }

  const pauseUpload = (id: string) => {
    if (autoDismissTimer) clearTimeout(autoDismissTimer)
    const item = uploadQueue.value.find(u => u.id === id)
    if (item && (item.status === 'uploading' || item.status === 'checking')) {
      item.status = 'paused'
      item.speed = 0
      item.etaSeconds = 0
      if (item.abortController) {
        item.abortController.abort()
        item.abortController = null
      }
      processQueue()
    }
  }

  const resumeUpload = (id: string) => {
    if (autoDismissTimer) clearTimeout(autoDismissTimer)
    const item = uploadQueue.value.find(u => u.id === id)
    if (item && (item.status === 'paused' || item.status === 'error')) {
      item.status = 'queued'
      processQueue()
    }
  }

  const cancelUpload = async (id: string) => {
    if (autoDismissTimer) clearTimeout(autoDismissTimer)
    const itemIndex = uploadQueue.value.findIndex(u => u.id === id)
    if (itemIndex >= 0) {
      const item = uploadQueue.value[itemIndex]
      item.status = 'cancelled'
      if (item.abortController) {
        item.abortController.abort()
        item.abortController = null
      }
      try {
        await $fetch('/api/upload-cancel', { method: 'POST', body: { uploadId: item.id } })
      } catch {}

      uploadQueue.value.splice(itemIndex, 1)
      processQueue()
      checkAutoDismiss()
    }
  }

  const clearCompleted = () => {
    if (autoDismissTimer) clearTimeout(autoDismissTimer)
    uploadQueue.value = uploadQueue.value.filter(u => u.status === 'uploading' || u.status === 'checking' || u.status === 'queued' || u.status === 'paused')
  }

  return {
    uploadQueue,
    isWidgetExpanded,
    activeConflict,
    pendingConflicts,
    activeUploads,
    activeCount,
    queuedCount,
    completedCount,
    errorCount,
    totalCount,
    hasActiveOrQueued,
    totalSpeed,
    overallProgress,
    enqueueFiles,
    resolveConflict,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    clearCompleted
  }
}
