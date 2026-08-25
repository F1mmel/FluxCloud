<template>
  <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden select-none bg-transparent">
    <!-- Top Header -->
    <header class="relative z-30 h-16 border-b border-black/5 dark:border-white/10 px-6 flex items-center justify-between glass-header shrink-0 transition-all duration-200">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl accent-bg-alpha border border-[var(--accent-color)]/30">
          <UsersIcon class="w-5 h-5 accent-text" />
        </div>
        <div>
          <h2 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
            <span>Shared with me</span>
            <span v-if="shares.length > 0" class="text-xs px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 accent-text font-semibold">
              {{ shares.length }}
            </span>
          </h2>
          <p class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Files and folders shared directly with your account by other users</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="loadSharedWithMe" 
          :disabled="loading"
          class="p-2 border border-black/10 dark:border-white/10 rounded-xl text-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-all active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
          title="Refresh"
        >
          <RefreshCwIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>

      <!-- Concave Inner Corner -->
      <div class="absolute top-full left-0 w-5 h-5 pointer-events-none z-30 overflow-hidden">
        <div class="w-full h-full glass-header concave-glass-corner"></div>
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 20 20" fill="none">
          <path d="M20,0 A20,20 0 0,0 0,20" fill="none" stroke="currentColor" class="text-black/5 dark:text-white/10" stroke-width="1.2" />
        </svg>
      </div>
    </header>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto p-6 select-none">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2Icon class="w-8 h-8 animate-spin accent-text" />
        <span class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Loading shared items...</span>
      </div>

      <!-- Items Grid -->
      <div v-else-if="shares.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div 
          v-for="item in shares" 
          :key="item.id"
          @dblclick="handleOpen(item)"
          class="glass-card group p-4 rounded-2xl border border-black/10 dark:border-white/10 hover:border-[var(--accent-color)]/50 bg-white/70 dark:bg-white/5 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer"
        >
          <!-- Thumbnail / Icon Area -->
          <div class="w-full h-28 mb-3 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center relative">
            <template v-if="item.thumbnailUrl">
              <img 
                :src="item.thumbnailUrl" 
                :alt="item.name" 
                loading="lazy"
                class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
              />
              <div v-if="isVideo(item.name)" class="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white backdrop-blur-md">
                <PlayIcon class="w-3 h-3 fill-white" />
              </div>
            </template>
            <div v-else class="p-4 transition-transform duration-200 group-hover:scale-110">
              <FolderIcon v-if="item.isDirectory" class="w-12 h-12 accent-text" :style="'fill: var(--accent-color); fill-opacity: 0.15'" />
              <VideoIcon v-else-if="isVideo(item.name)" class="w-12 h-12 text-purple-500" />
              <MusicIcon v-else-if="isAudio(item.name)" class="w-12 h-12 text-emerald-500" />
              <FileTextIcon v-else-if="isPdf(item.name) || isCodeOrText(item.name)" class="w-12 h-12 text-blue-500" />
              <FileIcon v-else class="w-12 h-12 text-slate-500" />
            </div>

            <!-- Permission Badge -->
            <div class="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md shadow-sm" :class="item.permission === 'write' ? 'bg-emerald-500/90 text-white' : 'bg-blue-500/90 text-white'">
              {{ item.permission === 'write' ? 'Read & Write' : 'Read Only' }}
            </div>
          </div>

          <!-- Title & Meta -->
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-xs text-[#0f172a] dark:text-[#fafafa] truncate mb-1" :title="item.name">
              {{ item.name }}
            </h4>
            
            <div class="flex items-center gap-1.5 text-[11px] text-[#64748b] dark:text-[#cbd5e1] mb-1">
              <UserIcon class="w-3 h-3 shrink-0 accent-text" />
              <span class="truncate">Shared by <strong>{{ item.owner }}</strong></span>
            </div>

            <div class="flex items-center justify-between text-[10px] text-[#64748b] dark:text-[#cbd5e1] pt-2 border-t border-black/5 dark:border-white/5">
              <span>{{ item.isDirectory ? 'Folder' : formatBytes(item.size) }}</span>
              <span>{{ formatDate(item.createdAt) }}</span>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="mt-3 pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
            <button 
              @click.stop="handleOpen(item)"
              class="flex-1 py-1.5 px-2.5 rounded-xl accent-bg-alpha hover:brightness-95 accent-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <EyeIcon class="w-3.5 h-3.5" />
              <span>{{ item.isDirectory ? 'Open Folder' : 'Preview' }}</span>
            </button>

            <a 
              :href="item.url" 
              :download="item.name"
              @click.stop
              class="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#0f172a] dark:text-[#fafafa] transition-colors cursor-pointer"
              title="Direct Download"
            >
              <DownloadIcon class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="border border-dashed border-[#cbd5e1] dark:border-[#27272a] rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto mt-12 glass-card shadow-sm">
        <div class="p-4 rounded-2xl accent-bg-alpha border border-[var(--accent-color)]/20 mb-4">
          <UsersIcon class="w-12 h-12 accent-text" />
        </div>
        <h3 class="text-base font-semibold text-[#0f172a] dark:text-[#fafafa] mb-1">No shared files yet</h3>
        <p class="text-xs text-[#64748b] dark:text-[#cbd5e1] mb-4 max-w-xs">When other users on this cloud share folders or files with you, they will appear here.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  Users as UsersIcon,
  RefreshCw as RefreshCwIcon,
  Loader2 as Loader2Icon,
  Folder as FolderIcon,
  File as FileIcon,
  FileText as FileTextIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Play as PlayIcon,
  Eye as EyeIcon,
  Download as DownloadIcon,
  User as UserIcon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'

const emit = defineEmits(['open-preview', 'navigate-to-share'])

const { formatBytes, formatDate, isImage, isVideo, isAudio, isPdf, isCodeOrText } = useFileHelpers()

const shares = ref([])
const loading = ref(false)

const loadSharedWithMe = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/shared-with-me')
    shares.value = res || []
  } catch {
    shares.value = []
  } finally {
    loading.value = false
  }
}

const handleOpen = (item) => {
  if (item.isDirectory) {
    if (item.shareUrl) {
      window.open(item.shareUrl, '_blank')
    }
  } else {
    emit('open-preview', item)
  }
}

onMounted(() => {
  loadSharedWithMe()
})

defineExpose({ loadSharedWithMe })
</script>
