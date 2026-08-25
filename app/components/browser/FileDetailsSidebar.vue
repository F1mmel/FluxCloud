<template>
  <aside 
    v-if="item" 
    class="w-80 border-l border-[#e2e8f0]/80 dark:border-[#27272a]/80 glass-sidebar flex flex-col shrink-0 h-full overflow-y-auto select-none p-5 text-sm transition-colors duration-200"
  >
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0] dark:border-[#27272a]">
      <h3 class="font-semibold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
        <InfoIcon class="w-4 h-4 text-indigo-500" />
        <span>Details</span>
      </h3>
      <button @click="$emit('close')" class="text-[#64748b] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa] p-1 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] transition-colors">
        <XIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Preview / Icon Box -->
    <div class="my-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#f8fafc] dark:bg-[#18181b]/60 border border-[#e2e8f0] dark:border-[#27272a]">
      <img 
        v-if="(isImage(item.name) || isVideo(item.name)) && (item.thumbnailUrl || secureDirectUrl || item.url)" 
        :src="item.thumbnailUrl || secureDirectUrl || item.url" 
        :alt="item.name" 
        class="max-h-36 max-w-full rounded-xl object-contain shadow-md"
      />
      <div v-else class="p-4 rounded-2xl bg-[#f1f5f9] dark:bg-[#1f2029]">
        <FolderIcon v-if="item.isDirectory" class="w-16 h-16 accent-text folder-item-icon" :style="'fill: var(--accent-color); fill-opacity: 0.1'" />
        <FileIcon v-else class="w-16 h-16 text-slate-700 dark:text-white file-item-icon" />
      </div>
      <span class="font-semibold text-[#0f172a] dark:text-[#fafafa] text-center mt-3 break-all px-2">{{ item.name }}</span>
      <span class="text-xs text-[#64748b] dark:text-[#71717a] mt-1">{{ item.isDirectory ? '--' : formatBytes(item.size) }}</span>
    </div>

    <!-- Quick Action Bar -->
    <div class="grid grid-cols-3 gap-2 mb-6">
      <button 
        @click="$emit('action', { action: 'open', item })" 
        class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#18181b] hover:bg-[#f1f5f9] dark:hover:bg-[#27272a] border border-[#e2e8f0] dark:border-[#27272a] text-xs font-medium text-[#0f172a] dark:text-[#fafafa] transition-all active:scale-95 shadow-sm"
      >
        <EyeIcon class="w-4 h-4 text-indigo-500 mb-1" />
        <span>{{ item.isDirectory ? 'Open' : 'Preview' }}</span>
      </button>
      <button 
        @click="$emit('action', { action: 'share', item })" 
        class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#18181b] hover:bg-[#f1f5f9] dark:hover:bg-[#27272a] border border-[#e2e8f0] dark:border-[#27272a] text-xs font-medium text-[#0f172a] dark:text-[#fafafa] transition-all active:scale-95 shadow-sm"
      >
        <Share2Icon class="w-4 h-4 text-emerald-500 mb-1" />
        <span>Share</span>
      </button>
      <button 
        @click="$emit('action', { action: 'download', item })" 
        class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#18181b] hover:bg-[#f1f5f9] dark:hover:bg-[#27272a] border border-[#e2e8f0] dark:border-[#27272a] text-xs font-medium text-[#0f172a] dark:text-[#fafafa] transition-all active:scale-95 shadow-sm"
      >
        <DownloadIcon class="w-4 h-4 text-blue-500 mb-1" />
        <span>Download</span>
      </button>
    </div>

    <!-- Metadata Attributes -->
    <div class="space-y-3.5 text-xs text-[#64748b] dark:text-[#a1a1aa] border-t border-[#e2e8f0] dark:border-[#27272a] pt-4">
      <div>
        <span class="text-[#94a3b8] dark:text-[#71717a] block mb-0.5">Location</span>
        <span class="text-[#0f172a] dark:text-[#fafafa] font-mono break-all">/{{ item.relativePath || item.name }}</span>
      </div>

      <div v-if="!item.isDirectory">
        <span class="text-[#94a3b8] dark:text-[#71717a] block mb-0.5">File Size</span>
        <span class="text-[#0f172a] dark:text-[#fafafa] font-medium">{{ formatBytes(item.size) }} ({{ item.size.toLocaleString() }} bytes)</span>
      </div>

      <div v-if="!item.isDirectory">
        <span class="text-[#94a3b8] dark:text-[#71717a] block mb-0.5">MIME Type</span>
        <span class="text-[#0f172a] dark:text-[#fafafa] font-mono">{{ item.mimeType || 'unknown' }}</span>
      </div>

      <div>
        <span class="text-[#94a3b8] dark:text-[#71717a] block mb-0.5">Created</span>
        <span class="text-[#0f172a] dark:text-[#fafafa]">{{ formatDate(item.createdAt) }}</span>
      </div>

      <div>
        <span class="text-[#94a3b8] dark:text-[#71717a] block mb-0.5">Modified</span>
        <span class="text-[#0f172a] dark:text-[#fafafa]">{{ formatDate(item.modifiedAt) }}</span>
      </div>
      <!-- Version History Quick Button -->
      <button 
        v-if="!item.isDirectory"
        @click="$emit('action', { action: 'versions', item })" 
        class="w-full py-2 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
      >
        <HistoryIcon class="w-3.5 h-3.5" />
        <span>View Version History</span>
      </button>

      <!-- Share / Direct CDN Link -->
      <div class="border-t border-[#e2e8f0] dark:border-[#27272a] pt-4 mt-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-1.5">
            <component :is="isItemShared ? GlobeIcon : LinkIcon" class="w-3.5 h-3.5" :class="isItemShared ? 'text-indigo-500' : 'text-cyan-500'" />
            <span>{{ isItemShared ? 'Public Share Link' : 'Secure Direct CDN Link' }}</span>
          </span>
          <span class="text-[10px] font-mono" :class="isItemShared ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'">
            {{ isItemShared ? 'Web Landing Page' : 'Unguessable 128-bit' }}
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <input 
            type="text" 
            :value="displayDirectUrl" 
            readonly 
            class="flex-1 px-2.5 py-1.5 bg-[#f8fafc] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] rounded-xl text-xs text-[#0f172a] dark:text-[#fafafa] font-mono focus:outline-none"
          />
          <button 
            @click="copyDirectLink" 
            class="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all shrink-0 active:scale-95 shadow-sm cursor-pointer"
            title="Copy Secure Direct URL"
          >
            <CopyIcon class="w-3.5 h-3.5" />
          </button>
        </div>

        <button 
          @click="$emit('action', { action: 'direct-link', item })" 
          class="w-full py-1.5 px-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <LinkIcon class="w-3.5 h-3.5" />
          <span>Direct &amp; Auto-Download Links...</span>
        </button>

        <!-- QR Code -->
        <div class="pt-2 flex flex-col items-center justify-center p-3 bg-[#f8fafc] dark:bg-[#18181b] rounded-2xl border border-[#e2e8f0] dark:border-[#27272a]">
          <img 
            :src="getQrCodeUrl(displayDirectUrl, 160)" 
            alt="QR Code" 
            class="w-28 h-28 rounded-xl bg-white p-1.5 shadow-sm border border-[#e2e8f0] dark:border-transparent"
          />
          <span class="text-[10px] text-[#64748b] dark:text-[#71717a] mt-2">Scan to open on mobile</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  Info as InfoIcon, 
  X as XIcon, 
  Folder as FolderIcon, 
  File as FileIcon, 
  Eye as EyeIcon, 
  Share2 as Share2Icon, 
  Download as DownloadIcon, 
  Link as LinkIcon, 
  Copy as CopyIcon,
  History as HistoryIcon,
  Globe as GlobeIcon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  item: { type: Object, default: null }
})

const emit = defineEmits(['close', 'action'])

const { formatBytes, formatDate, isImage, isVideo, copyToClipboard, getQrCodeUrl } = useFileHelpers()
const { isShared } = useShares()
const { success } = useToast()
const publicShareLandingUrl = ref('')
const secureDirectUrl = ref('')

watch(() => props.item, async (newItem) => {
  if (newItem) {
    try {
      const res = await $fetch('/api/direct-token', {
        method: 'POST',
        body: { path: newItem.relativePath || newItem.name }
      })
      if (typeof window !== 'undefined') {
        publicShareLandingUrl.value = res.publicShareUrl ? `${window.location.origin}${res.publicShareUrl}` : ''
        secureDirectUrl.value = `${window.location.origin}${res.directUrl}`
      }
    } catch {
      if (typeof window !== 'undefined') {
        publicShareLandingUrl.value = ''
        secureDirectUrl.value = `${window.location.origin}${newItem.url || ''}`
      }
    }
  } else {
    publicShareLandingUrl.value = ''
    secureDirectUrl.value = ''
  }
}, { immediate: true })

const isItemShared = computed(() => {
  return props.item && (isShared(props.item) || !!publicShareLandingUrl.value)
})

const displayDirectUrl = computed(() => {
  if (isItemShared.value && publicShareLandingUrl.value) return publicShareLandingUrl.value
  if (secureDirectUrl.value) return secureDirectUrl.value
  if (typeof window === 'undefined' || !props.item?.url) return ''
  return `${window.location.origin}${props.item.url}`
})

const copyDirectLink = async () => {
  if (await copyToClipboard(displayDirectUrl.value)) {
    const msg = isItemShared.value ? 'Public share link copied to clipboard' : 'Direct CDN link copied to clipboard'
    success('Link copied', msg)
  }
}
</script>
