<template>
  <Transition name="modal-fade">
    <div 
      v-if="show" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      @click.self="$emit('close')"
    >
      <div 
        class="w-full max-w-xl glass-modal rounded-2xl shadow-2xl border border-black/10 dark:border-white/15 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0 glass-header">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl accent-bg-alpha border border-[var(--accent-color)]/30">
              <HistoryIcon class="w-5 h-5 accent-text" />
            </div>
            <div>
              <h3 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
                <span>Version History</span>
                <span v-if="versions.length > 0" class="text-xs px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 accent-text font-semibold">
                  {{ versions.length }} {{ versions.length === 1 ? 'version' : 'versions' }}
                </span>
              </h3>
              <p class="text-xs text-[#64748b] dark:text-[#cbd5e1] truncate max-w-sm">{{ item?.name }}</p>
            </div>
          </div>

          <button 
            @click="$emit('close')" 
            class="p-2 rounded-xl text-[#94a3b8] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body (Scrollable Timeline) -->
        <div class="p-6 overflow-y-auto flex-1 space-y-4 select-none">
          <!-- Loading State -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-12 text-[#64748b] dark:text-[#71717a] gap-3">
            <Loader2Icon class="w-8 h-8 animate-spin accent-text" />
            <span class="text-sm">Loading version history...</span>
          </div>

          <template v-else>
            <!-- Current Active Version Card -->
            <div class="p-4 rounded-xl border border-[var(--accent-color)]/40 bg-[var(--accent-color)]/5 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg accent-bg flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  Active
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-xs text-[#0f172a] dark:text-[#fafafa]">Current Version</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold">Live</span>
                  </div>
                  <div class="text-[11px] text-[#64748b] dark:text-[#cbd5e1] mt-0.5 flex items-center gap-2">
                    <span>{{ formatBytes(currentFile?.size ?? item?.size ?? 0) }}</span>
                    <span>•</span>
                    <span>{{ formatDate(currentFile?.modifiedAt ?? item?.modifiedAt ?? new Date()) }}</span>
                  </div>
                </div>
              </div>

              <div class="text-xs text-[#64748b] dark:text-[#cbd5e1] font-medium">
                Active on disk
              </div>
            </div>

            <!-- Timeline of Historical Versions -->
            <div v-if="versions.length > 0" class="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-black/10 dark:before:bg-white/10">
              <div 
                v-for="version in versions" 
                :key="version.id"
                class="relative group"
              >
                <!-- Timeline Dot -->
                <div class="absolute -left-6 top-4 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-[#18181b] bg-[#94a3b8] dark:bg-[#52525b] group-hover:accent-bg transition-colors"></div>

                <!-- Version Card -->
                <div class="p-4 rounded-xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:border-[var(--accent-color)]/30 hover:bg-white/60 dark:hover:bg-white/10 transition-all flex items-center justify-between shadow-xs">
                  <div class="flex items-start gap-3">
                    <div class="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 font-bold text-xs text-[#0f172a] dark:text-[#fafafa] shrink-0 border border-black/5 dark:border-white/10">
                      v{{ version.versionNumber }}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-xs text-[#0f172a] dark:text-[#fafafa]">{{ formatDate(version.createdAt) }}</span>
                        <span class="text-[10px] text-[#94a3b8] dark:text-[#71717a]">({{ timeAgo(version.createdAt) }})</span>
                      </div>
                      <div class="flex items-center gap-2 mt-1 text-[11px] text-[#64748b] dark:text-[#cbd5e1]">
                        <span>{{ formatBytes(version.size) }}</span>
                        <span v-if="version.comment">•</span>
                        <span v-if="version.comment" class="italic text-[#94a3b8] dark:text-[#71717a] truncate max-w-[200px]">
                          {{ version.comment }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Actions for this Version -->
                  <div class="flex items-center gap-1.5 shrink-0">
                    <!-- Restore Button -->
                    <button 
                      @click="handleRestore(version)" 
                      :disabled="isRestoringId === version.id"
                      class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:accent-bg hover:text-white text-[#0f172a] dark:text-[#fafafa] text-xs font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      title="Restore this version"
                    >
                      <Loader2Icon v-if="isRestoringId === version.id" class="w-3.5 h-3.5 animate-spin" />
                      <RotateCcwIcon v-else class="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>

                    <!-- Download Button -->
                    <button 
                      @click="handleDownload(version)" 
                      class="p-1.5 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Download this version"
                    >
                      <DownloadIcon class="w-4 h-4" />
                    </button>

                    <!-- Delete Button -->
                    <button 
                      @click="handleDelete(version)" 
                      class="p-1.5 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Delete version snapshot"
                    >
                      <Trash2Icon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty History State -->
            <div v-else class="py-8 text-center border border-dashed border-black/10 dark:border-white/10 rounded-xl">
              <ClockIcon class="w-8 h-8 mx-auto text-[#94a3b8] dark:text-[#52525b] mb-2" />
              <p class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa]">No previous versions yet</p>
              <p class="text-[11px] text-[#64748b] dark:text-[#cbd5e1] mt-1 max-w-xs mx-auto">
                Versions are automatically created when you edit or replace this file.
              </p>
            </div>
          </template>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between shrink-0 glass-header">
          <button 
            v-if="versions.length > 0"
            @click="handlePurgeAll" 
            class="text-xs text-red-500 hover:text-red-600 font-semibold cursor-pointer"
          >
            Purge all versions
          </button>
          <div v-else></div>

          <button 
            @click="$emit('close')" 
            class="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[#0f172a] dark:text-[#fafafa] text-xs font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { 
  History as HistoryIcon, 
  X as XIcon, 
  Loader2 as Loader2Icon, 
  RotateCcw as RotateCcwIcon, 
  Download as DownloadIcon, 
  Trash2 as Trash2Icon,
  Clock as ClockIcon 
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useConfirm } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null }
})

const emit = defineEmits(['close', 'restored'])

const { formatBytes } = useFileHelpers()
const { askConfirm } = useConfirm()
const { success, error } = useToast()

const versions = ref([])
const currentFile = ref(null)
const isLoading = ref(false)
const isRestoringId = ref(null)

const loadVersions = async () => {
  if (!props.item) return
  const relPath = props.item.relativePath || props.item.name
  if (!relPath) return

  isLoading.value = true
  try {
    const res = await $fetch(`/api/versions?path=${encodeURIComponent(relPath)}`)
    versions.value = res.versions || []
    currentFile.value = res.currentFile
  } catch (err) {
    console.error('Failed to load versions:', err)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.show, (showing) => {
  if (showing && props.item) {
    loadVersions()
  }
})

const formatDate = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const timeAgo = (isoString) => {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const handleRestore = async (version) => {
  const relPath = props.item.relativePath || props.item.name
  const confirmed = await askConfirm({
    title: `Restore Version v${version.versionNumber}?`,
    message: `Are you sure you want to restore "${props.item.name}" to version v${version.versionNumber}? Your current version will be saved as a new backup automatically.`,
    confirmText: 'Restore Version',
    type: 'warning',
    icon: 'rotate-ccw'
  })
  if (!confirmed) return

  isRestoringId.value = version.id
  try {
    await $fetch('/api/version-restore', {
      method: 'POST',
      body: {
        path: relPath,
        versionId: version.id
      }
    })
    success('Version Restored', `Restored "${props.item.name}" to version v${version.versionNumber}`)
    await loadVersions()
    emit('restored')
  } catch (err) {
    error('Restore Failed', err?.data?.statusMessage || 'Could not restore version')
  } finally {
    isRestoringId.value = null
  }
}

const handleDownload = (version) => {
  const relPath = props.item.relativePath || props.item.name
  const url = `/api/version-download?path=${encodeURIComponent(relPath)}&versionId=${encodeURIComponent(version.id)}`
  window.open(url, '_blank')
}

const handleDelete = async (version) => {
  const relPath = props.item.relativePath || props.item.name
  const confirmed = await askConfirm({
    title: `Delete Version v${version.versionNumber}?`,
    message: `Are you sure you want to delete this historical version snapshot? This cannot be undone.`,
    confirmText: 'Delete Version',
    type: 'danger',
    icon: 'trash'
  })
  if (!confirmed) return

  try {
    await $fetch('/api/version-delete', {
      method: 'POST',
      body: {
        path: relPath,
        versionId: version.id
      }
    })
    success('Version Deleted', `Deleted version v${version.versionNumber}`)
    await loadVersions()
  } catch (err) {
    error('Delete Failed', err?.data?.statusMessage || 'Could not delete version')
  }
}

const handlePurgeAll = async () => {
  const relPath = props.item.relativePath || props.item.name
  const confirmed = await askConfirm({
    title: `Purge all versions?`,
    message: `Are you sure you want to delete all historical versions for "${props.item.name}"? Only the active live version will remain.`,
    confirmText: 'Purge All',
    type: 'danger',
    icon: 'flame'
  })
  if (!confirmed) return

  try {
    await $fetch('/api/version-delete', {
      method: 'POST',
      body: {
        path: relPath,
        all: true
      }
    })
    success('History Purged', `Deleted all version snapshots for "${props.item.name}"`)
    await loadVersions()
  } catch (err) {
    error('Purge Failed', err?.data?.statusMessage || 'Could not purge versions')
  }
}
</script>
