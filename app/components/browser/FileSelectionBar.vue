<template>
  <Transition name="floating-bar">
    <div 
      v-if="selectedCount > 0"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 glass-dropdown border border-[#cbd5e1]/80 dark:border-[#3f3f46]/80 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-4 text-sm select-none"
    >
      <!-- Left: Item Count -->
      <div class="flex items-center gap-2.5 pr-2 border-r border-[#e2e8f0] dark:border-[#27272a]">
        <span class="w-2.5 h-2.5 rounded-full accent-bg animate-pulse"></span>
        <span class="font-bold text-xs text-[#0f172a] dark:text-[#fafafa] whitespace-nowrap">
          {{ selectedCount }} {{ selectedCount === 1 ? 'item' : 'items' }} selected
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <!-- In-Place Compress to ZIP on Server -->
        <button 
          @click="$emit('compress-selected')" 
          class="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f5f9] dark:bg-[#18181b] hover:bg-[#e2e8f0] dark:hover:bg-[#27272a] border border-[#cbd5e1] dark:border-[#3f3f46] text-[#0f172a] dark:text-[#fafafa] rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
          title="Pack selected items into a ZIP archive here on the server"
        >
          <PackagePlusIcon class="w-3.5 h-3.5 text-purple-500" />
          <span>Compress to ZIP</span>
        </button>

        <!-- Download ZIP -->
        <button 
          @click="$emit('download-zip')" 
          class="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f5f9] dark:bg-[#18181b] hover:bg-[#e2e8f0] dark:hover:bg-[#27272a] border border-[#cbd5e1] dark:border-[#3f3f46] text-[#0f172a] dark:text-[#fafafa] rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
          title="Download selected items as ZIP"
        >
          <ArchiveIcon class="w-3.5 h-3.5 text-indigo-500" />
          <span>Download ZIP</span>
        </button>

        <!-- Move -->
        <button 
          @click="$emit('move-selected')" 
          class="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f5f9] dark:bg-[#18181b] hover:bg-[#e2e8f0] dark:hover:bg-[#27272a] border border-[#cbd5e1] dark:border-[#3f3f46] text-[#0f172a] dark:text-[#fafafa] rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
          title="Move selected items"
        >
          <FolderInputIcon class="w-3.5 h-3.5 text-amber-500" />
          <span>Move</span>
        </button>

        <!-- Move to Trash -->
        <button 
          @click="$emit('delete-selected')" 
          class="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f5f9] dark:bg-[#18181b] hover:bg-[#e2e8f0] dark:hover:bg-[#27272a] border border-[#cbd5e1] dark:border-[#3f3f46] text-[#0f172a] dark:text-[#fafafa] rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
          title="Move selected items to Trash"
        >
          <Trash2Icon class="w-3.5 h-3.5 text-[#64748b] dark:text-[#cbd5e1]" />
          <span>Trash</span>
        </button>

        <!-- Delete Permanently -->
        <button 
          @click="$emit('delete-permanent-selected')" 
          class="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/80 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
          title="Delete selected items permanently"
        >
          <FlameIcon class="w-3.5 h-3.5" />
          <span>Delete Permanently</span>
        </button>

        <!-- Clear selection -->
        <button 
          @click="$emit('clear-selection')" 
          class="p-1.5 text-[#94a3b8] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa] rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] transition-colors ml-1 cursor-pointer"
          title="Clear Selection"
        >
          <XIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { 
  PackagePlus as PackagePlusIcon,
  Archive as ArchiveIcon, 
  FolderInput as FolderInputIcon, 
  Trash2 as Trash2Icon,
  Flame as FlameIcon,
  X as XIcon
} from 'lucide-vue-next'

defineProps({
  selectedCount: { type: Number, required: true }
})

defineEmits([
  'compress-selected',
  'download-zip', 
  'move-selected', 
  'delete-selected', 
  'delete-permanent-selected',
  'clear-selection'
])
</script>
