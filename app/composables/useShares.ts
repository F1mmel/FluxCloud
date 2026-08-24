import { ref } from 'vue'

export interface ShareItem {
  id: string
  targetPath: string
  displayPath: string
  isDirectory: boolean
  fileName: string
  hasPassword: boolean
  expiresAt: string | null
  maxDownloads: number | null
  downloadsCount: number
  viewOnly: boolean
  shareUrl: string
}

// Global reactive state
const sharedPaths = ref<Set<string>>(new Set())
const activeShares = ref<ShareItem[]>([])
const isLoaded = ref(false)

export function useShares() {
  const syncSharesFromFiles = (files: any[]) => {
    if (!files) return
    const nextSet = new Set(sharedPaths.value)
    for (const f of files) {
      if (f.isShared && f.relativePath) {
        nextSet.add(f.relativePath)
        nextSet.add(f.name)
      }
    }
    sharedPaths.value = nextSet
  }

  const loadShares = async () => {
    try {
      const data = await $fetch<ShareItem[]>('/api/shares')
      activeShares.value = data || []
      const nextSet = new Set<string>()
      for (const s of activeShares.value) {
        if (s.displayPath) nextSet.add(s.displayPath)
        if (s.targetPath) nextSet.add(s.targetPath)
        if (s.fileName) nextSet.add(s.fileName)
      }
      sharedPaths.value = nextSet
      isLoaded.value = true
    } catch {
      activeShares.value = []
    }
  }

  const isShared = (item: any): boolean => {
    if (!item) return false
    if (item.isShared) return true
    const path = item.relativePath || item.name
    return sharedPaths.value.has(path) || sharedPaths.value.has(item.name)
  }

  const markAsShared = (itemOrPath: any, shareRecord?: any) => {
    const path = typeof itemOrPath === 'string' ? itemOrPath : (itemOrPath?.relativePath || itemOrPath?.name)
    if (!path) return
    const nextSet = new Set(sharedPaths.value)
    nextSet.add(path)
    if (typeof itemOrPath === 'object' && itemOrPath?.name) {
      nextSet.add(itemOrPath.name)
    }
    sharedPaths.value = nextSet

    if (shareRecord) {
      activeShares.value = [shareRecord, ...activeShares.value.filter(s => s.id !== shareRecord.id)]
    }
  }

  const unmarkAsShared = (itemOrPath: any, shareId?: string) => {
    const path = typeof itemOrPath === 'string' ? itemOrPath : (itemOrPath?.relativePath || itemOrPath?.name)
    if (path) {
      const nextSet = new Set(sharedPaths.value)
      nextSet.delete(path)
      if (typeof itemOrPath === 'object' && itemOrPath?.name) {
        nextSet.delete(itemOrPath.name)
      }
      sharedPaths.value = nextSet
    }

    if (shareId) {
      activeShares.value = activeShares.value.filter(s => s.id !== shareId)
    }
  }

  return {
    sharedPaths,
    activeShares,
    isLoaded,
    syncSharesFromFiles,
    loadShares,
    isShared,
    markAsShared,
    unmarkAsShared
  }
}
