<template>
  <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
    <!-- Top Header -->
    <header class="relative z-30 h-16 border-b border-black/5 dark:border-white/10 px-6 flex items-center justify-between glass-card bg-white/40 dark:bg-white/10 shrink-0 transition-all duration-200">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
          <Share2Icon class="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h2 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa]">Shared Links Manager</h2>
          <p class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Manage active public shares, track downloads, and revoke links</p>
        </div>
      </div>

      <button 
        @click="loadShares" 
        class="p-2 border border-black/10 dark:border-white/10 rounded-xl text-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#64748b] dark:text-[#e2e8f0] hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-all active:scale-95 shadow-sm"
        title="Refresh Shares"
      >
        <RefreshCwIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
      </button>

      <!-- Concave Inner Corner -->
      <div class="absolute top-full left-0 w-5 h-5 pointer-events-none z-30 overflow-hidden">
        <div class="w-full h-full glass-card bg-white/40 dark:bg-white/10 concave-glass-corner"></div>
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 20 20" fill="none">
          <path d="M20,0 A20,20 0 0,0 0,20" fill="none" stroke="currentColor" class="text-black/5 dark:text-white/10" stroke-width="1.2" />
        </svg>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-6 select-none">
      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center h-64 text-[#64748b] dark:text-[#cbd5e1] gap-3">
        <Loader2Icon class="w-8 h-8 animate-spin accent-text" />
        <span class="text-sm">Loading shares...</span>
      </div>

      <!-- Shares Table -->
      <div v-else-if="shares && shares.length > 0" class="border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden glass-card shadow-xl transition-all duration-200">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/10 text-[#475569] dark:text-[#cbd5e1] font-semibold text-xs">
              <th class="py-3 px-4 align-middle">Name</th>
              <th class="py-3 px-4 w-36 align-middle">Security</th>
              <th class="py-3 px-4 w-48 align-middle">Downloads / Views</th>
              <th class="py-3 px-4 w-44 align-middle">Expires</th>
              <th class="py-3 px-4 text-right w-28 align-middle">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="share in shares" 
              :key="share.id"
              class="border-b border-[#e2e8f0] dark:border-[#27272a] last:border-0 hover:bg-[#f1f5f9]/80 dark:hover:bg-[#18181b]/60 transition-colors select-none group cursor-pointer"
            >
              <!-- Name & Icon -->
              <td class="py-3 px-4 align-middle font-medium">
                <div class="flex items-center gap-3 min-w-0 py-0.5">
                  <FolderIcon v-if="share.isDirectory" class="w-5 h-5 accent-text shrink-0 folder-item-icon" :style="'fill: var(--accent-color); fill-opacity: 0.15'" />
                  <VideoIcon v-else-if="isVideo(share.fileName)" class="w-5 h-5 text-slate-700 dark:text-white shrink-0 file-item-icon" />
                  <MusicIcon v-else-if="isAudio(share.fileName)" class="w-5 h-5 text-slate-700 dark:text-white shrink-0 file-item-icon" />
                  <FileTextIcon v-else-if="isPdf(share.fileName) || isCodeOrText(share.fileName)" class="w-5 h-5 text-slate-700 dark:text-white shrink-0 file-item-icon" />
                  <ArchiveIcon v-else-if="getFileCategory(share.fileName, false) === 'archive'" class="w-5 h-5 text-slate-700 dark:text-white shrink-0 file-item-icon" />
                  <FileIcon v-else class="w-5 h-5 text-slate-700 dark:text-white shrink-0 file-item-icon" />

                  <div class="flex items-center gap-2 min-w-0">
                    <span class="truncate font-medium text-[#0f172a] dark:text-[#fafafa] text-sm leading-normal py-0.5 max-w-[340px]" :title="share.fileName">{{ share.fileName }}</span>
                    <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] font-mono truncate max-w-[220px] hidden md:inline">/{{ share.displayPath || share.targetPath }}</span>
                  </div>
                </div>
              </td>

              <!-- Security -->
              <td class="py-3 px-4 text-xs align-middle">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span v-if="share.hasPassword" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[10px] font-semibold border border-amber-500/30 shadow-xs">
                    <LockIcon class="w-2.5 h-2.5" />
                    <span>Protected</span>
                  </span>
                  <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 shadow-xs">
                    <span>Public</span>
                  </span>
                  <span v-if="share.viewOnly" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-300 text-[10px] font-semibold border border-blue-500/30 shadow-xs">
                    <span>View-only</span>
                  </span>
                </div>
              </td>

              <!-- Downloads / Views -->
              <td class="py-3 px-4 text-xs text-[#475569] dark:text-[#cbd5e1] align-middle">
                <div class="flex items-center gap-2">
                  <span>{{ share.downloadCount || 0 }}{{ share.maxDownloads ? `/${share.maxDownloads}` : '' }} dl</span>
                  <span>•</span>
                  <span>{{ share.viewCount || 0 }} views</span>
                </div>
              </td>

              <!-- Expiry -->
              <td class="py-3 px-4 text-xs text-[#64748b] dark:text-[#cbd5e1] align-middle">
                {{ share.expiresAt ? formatDate(share.expiresAt) : 'Never' }}
              </td>

              <!-- Actions -->
              <td class="py-3 px-4 text-right w-32 align-middle" @click.stop>
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button 
                    @click="$emit('edit-share', share)" 
                    class="p-1.5 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
                    title="Configure / Edit Share"
                  >
                    <Settings2Icon class="w-4 h-4" />
                  </button>

                  <button 
                    @click="copyShareLink(share.id)" 
                    class="p-1.5 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
                    title="Copy Share Link"
                  >
                    <CopyIcon class="w-4 h-4" />
                  </button>

                  <a 
                    :href="`/s/${share.id}`" 
                    target="_blank" 
                    class="p-1.5 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
                    title="Open Share Page"
                  >
                    <ExternalLinkIcon class="w-4 h-4" />
                  </a>

                  <button 
                    @click="revokeShare(share.id)" 
                    class="p-1.5 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                    title="Revoke Share"
                  >
                    <Trash2Icon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="border border-dashed border-[#cbd5e1] dark:border-[#27272a] rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto mt-12 glass-card shadow-sm">
        <div class="p-4 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 mb-4">
          <Share2Icon class="w-12 h-12 text-[#94a3b8] dark:text-[#cbd5e1]" />
        </div>
        <h3 class="text-base font-semibold text-[#0f172a] dark:text-[#fafafa] mb-1">No shared links yet</h3>
        <p class="text-xs text-[#64748b] dark:text-[#cbd5e1] mb-4 max-w-xs">You can share any file or folder with password protection, expiration, and download limits from the file browser.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  Share2 as Share2Icon, 
  Folder as FolderIcon, 
  File as FileIcon, 
  Video as VideoIcon,
  Music as MusicIcon,
  FileText as FileTextIcon,
  Archive as ArchiveIcon,
  Lock as LockIcon, 
  Copy as CopyIcon, 
  ExternalLink as ExternalLinkIcon, 
  Trash2 as Trash2Icon, 
  RefreshCw as RefreshCwIcon, 
  Loader2 as Loader2Icon,
  Settings2 as Settings2Icon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'
import { useShares } from '../../composables/useShares'
import { useConfirm } from '../../composables/useConfirm'

const emit = defineEmits(['edit-share'])

const { formatDate, formatBytes, isVideo, isAudio, isPdf, isCodeOrText, getFileCategory, copyToClipboard } = useFileHelpers()
const { success, error } = useToast()
const { unmarkAsShared } = useShares()
const { askConfirm } = useConfirm()

const shares = ref([])
const loading = ref(false)

const loadShares = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/shares')
    shares.value = res || []
  } catch (err) {
    shares.value = []
  } finally {
    loading.value = false
  }
}

const copyShareLink = async (shareId) => {
  const url = `${window.location.origin}/s/${shareId}`
  if (await copyToClipboard(url)) {
    success('Link copied', 'Public share link copied to clipboard')
  }
}

const revokeShare = async (shareId) => {
  const target = shares.value.find(s => s.id === shareId)
  const confirmed = await askConfirm({
    title: 'Revoke Share Link?',
    message: `Are you sure you want to deactivate the share link for "${target?.fileName || 'this item'}"?\nVisitors will immediately lose access.`,
    confirmText: 'Revoke Link',
    type: 'danger',
    icon: 'trash'
  })
  if (!confirmed) return

  try {
    await $fetch(`/api/share/${shareId}`, { method: 'DELETE' })
    if (target) {
      unmarkAsShared(target.displayPath || target.targetPath, shareId)
    } else {
      unmarkAsShared(null, shareId)
    }
    shares.value = shares.value.filter(s => s.id !== shareId)
    success('Share revoked', 'The link has been deactivated')
  } catch (err) {
    error('Revoke failed', 'Could not delete share link')
  }
}

onMounted(() => {
  loadShares()
})

defineExpose({ loadShares })
</script>
