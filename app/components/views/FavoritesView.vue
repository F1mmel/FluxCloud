<template>
  <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
    <!-- Top Header -->
    <header class="relative z-30 h-16 border-b border-black/5 dark:border-white/10 px-6 flex items-center justify-between glass-card bg-white/40 dark:bg-white/10 shrink-0 transition-all duration-200">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
          <StarIcon class="w-5 h-5 text-amber-500 fill-amber-500" />
        </div>
        <div>
          <h2 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa]">Favorites</h2>
          <p class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Quick access to your starred files and folders</p>
        </div>
      </div>

      <button 
        @click="loadFavorites" 
        class="p-2 border border-black/10 dark:border-white/10 rounded-xl text-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#64748b] dark:text-[#e2e8f0] hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-all active:scale-95 shadow-sm"
        title="Refresh Favorites"
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
      <div v-if="loading" class="flex flex-col items-center justify-center h-64 text-[#64748b] dark:text-[#cbd5e1] gap-3">
        <Loader2Icon class="w-8 h-8 animate-spin accent-text" />
        <span class="text-sm">Loading favorites...</span>
      </div>

      <!-- Favorites Grid / List -->
      <div v-else-if="favorites && favorites.length > 0" class="max-w-6xl mx-auto">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          <div 
            v-for="item in favorites" 
            :key="item.relativePath"
            class="group relative rounded-2xl p-3.5 flex flex-col items-center text-center cursor-pointer transition-all duration-200 glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 hover:border-indigo-400 dark:hover:border-white/30 hover:-translate-y-1 active:scale-[0.98] shadow-sm hover:shadow-lg"
            @dblclick="handleDoubleClick(item)"
          >
            <!-- Unfavorite button -->
            <button 
              @click.stop="toggleFavorite(item)" 
              class="absolute top-2.5 right-2.5 p-1 rounded-lg bg-black/5 dark:bg-white/10 text-amber-500 hover:text-red-500 transition-colors z-10 shadow-sm border border-black/5 dark:border-white/10"
              title="Remove from Favorites"
            >
              <StarIcon class="w-3.5 h-3.5 fill-amber-500" />
            </button>

            <!-- Thumbnail or Icon -->
            <div class="w-full h-24 my-2 flex items-center justify-center overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 relative">
              <template v-if="(isImage(item.name) || isVideo(item.name)) && (item.thumbnailUrl || (isImage(item.name) && item.url))">
                <img 
                  :src="item.thumbnailUrl || item.url" 
                  :alt="item.name" 
                  loading="lazy"
                  class="h-full w-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-105"
                />
                <div v-if="isVideo(item.name)" class="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white backdrop-blur-md shadow-sm flex items-center justify-center pointer-events-none">
                  <PlayIcon class="w-3 h-3 fill-white text-white" />
                </div>
              </template>
              <div v-else class="p-3 transition-transform duration-200 group-hover:scale-110 flex items-center justify-center">
                <FolderIcon v-if="item.isDirectory" class="w-12 h-12 accent-text folder-item-icon" :style="'fill: var(--accent-color); fill-opacity: 0.12'" />
                <VideoIcon v-else-if="isVideo(item.name)" class="w-12 h-12 text-slate-700 dark:text-white file-item-icon" />
                <FileIcon v-else class="w-12 h-12 text-slate-700 dark:text-white file-item-icon" />
              </div>
            </div>

            <span class="font-semibold text-xs text-[#0f172a] dark:text-[#fafafa] truncate w-full mt-1.5" :title="item.name">{{ item.name }}</span>
            <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] mt-0.5">{{ item.isDirectory ? '--' : formatBytes(item.size) }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="border border-dashed border-[#cbd5e1] dark:border-[#27272a] rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto mt-12 glass-card shadow-sm">
        <div class="p-4 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 mb-4">
          <StarIcon class="w-12 h-12 text-[#94a3b8] dark:text-[#cbd5e1]" />
        </div>
        <h3 class="text-base font-semibold text-[#0f172a] dark:text-[#fafafa] mb-1">No favorites starred</h3>
        <p class="text-xs text-[#64748b] dark:text-[#cbd5e1] mb-4 max-w-xs">Star your most important files and folders to access them quickly here.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  Star as StarIcon, 
  Folder as FolderIcon, 
  File as FileIcon, 
  RefreshCw as RefreshCwIcon, 
  Loader2 as Loader2Icon,
  Video as VideoIcon,
  Play as PlayIcon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'

const emit = defineEmits(['navigate-to-folder', 'open-preview'])

const { formatBytes, isImage, isVideo } = useFileHelpers()
const { success } = useToast()

const favorites = ref([])
const loading = ref(false)

const loadFavorites = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/favorites')
    favorites.value = res || []
  } catch {
    favorites.value = []
  } finally {
    loading.value = false
  }
}

const toggleFavorite = async (item) => {
  try {
    await $fetch('/api/favorites', {
      method: 'POST',
      body: { path: item.relativePath }
    })
    favorites.value = favorites.value.filter(f => f.relativePath !== item.relativePath)
    success('Removed', 'Removed from favorites')
  } catch {}
}

const handleDoubleClick = (item) => {
  if (item.isDirectory) {
    emit('navigate-to-folder', item.relativePath)
  } else {
    emit('open-preview', item)
  }
}

onMounted(() => {
  loadFavorites()
})

defineExpose({ loadFavorites })
</script>
