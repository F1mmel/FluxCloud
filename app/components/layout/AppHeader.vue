<template>
  <header class="h-16 border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 px-6 flex items-center justify-between glass-header shrink-0 gap-4 transition-all duration-200 z-10">
    <!-- Left: Search Bar -->
    <div class="flex items-center flex-1 max-w-md">
      <div class="relative w-full">
        <SearchIcon class="w-4 h-4 text-[#64748b] dark:text-[#cbd5e1] absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          :value="search" 
          @input="$emit('update:search', $event.target.value)"
          type="text" 
          placeholder="Search files and folders..." 
          class="w-full pl-9 pr-8 py-1.5 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 focus:border-indigo-500 rounded-xl text-sm text-[#0f172a] dark:text-[#fafafa] placeholder-[#64748b] dark:placeholder-[#cbd5e1] focus:outline-none transition-all shadow-sm"
        />
        <button 
          v-if="search" 
          @click="$emit('update:search', '')" 
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] p-0.5 transition-colors"
        >
          <XIcon class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-3 shrink-0">
      <!-- View Toggle -->
      <div class="bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 p-0.5 rounded-xl flex items-center shadow-sm">
        <button 
          @click="$emit('update:viewMode', 'list')" 
          class="p-1.5 rounded-lg transition-all"
          :class="viewMode === 'list' ? 'bg-white dark:bg-[#27272a] text-[#0f172a] dark:text-[#fafafa] shadow-sm' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa]'"
          title="List View"
        >
          <ListIcon class="w-4 h-4" />
        </button>
        <button 
          @click="$emit('update:viewMode', 'grid')" 
          class="p-1.5 rounded-lg transition-all"
          :class="viewMode === 'grid' ? 'bg-white dark:bg-[#27272a] text-[#0f172a] dark:text-[#fafafa] shadow-sm' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa]'"
          title="Grid View"
        >
          <GridIcon class="w-4 h-4" />
        </button>
      </div>

      <!-- Refresh Button -->
      <button 
        @click="$emit('refresh')" 
        class="p-2 border border-[#e2e8f0] dark:border-[#27272a] rounded-xl text-sm bg-white dark:bg-[#09090b] hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-all active:scale-95 shadow-sm"
        title="Refresh Files"
      >
        <RefreshCwIcon class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
      </button>

      <!-- Create Folder Button -->
      <button 
        @click="$emit('open-create-folder')" 
        class="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#e2e8f0] dark:border-[#27272a] rounded-xl text-sm bg-white dark:bg-[#09090b] hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] font-medium text-[#0f172a] dark:text-[#fafafa] transition-all active:scale-95 shadow-sm"
      >
        <FolderPlusIcon class="w-4 h-4 accent-text" />
        <span>New Folder</span>
      </button>

      <!-- Upload Button -->
      <button 
        @click="$emit('open-upload')" 
        class="flex items-center gap-1.5 px-4 py-1.5 accent-bg accent-bg-hover rounded-xl text-sm font-medium text-white transition-all shadow-md active:scale-95"
      >
        <UploadIcon class="w-4 h-4" />
        <span>Upload</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { 
  Search as SearchIcon, 
  X as XIcon, 
  List as ListIcon, 
  Grid as GridIcon, 
  RefreshCw as RefreshCwIcon, 
  FolderPlus as FolderPlusIcon, 
  Upload as UploadIcon
} from 'lucide-vue-next'

defineProps({
  search: { type: String, default: '' },
  viewMode: { type: String, default: 'list' },
  isRefreshing: { type: Boolean, default: false }
})

defineEmits([
  'update:search', 
  'update:viewMode', 
  'refresh', 
  'open-create-folder', 
  'open-upload'
])
</script>
