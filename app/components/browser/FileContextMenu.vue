<template>
  <Transition name="context-menu-pop">
    <div 
      v-if="visible" 
      ref="menuRef"
      class="fixed z-[99999] glass-dropdown border border-black/10 dark:border-white/15 rounded-2xl shadow-2xl p-1.5 min-w-[215px] text-xs font-medium text-[#0f172a] dark:text-[#fafafa] select-none"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      @click.stop
      @contextmenu.prevent
    >
      <!-- Header with item name -->
      <div class="px-3 py-1.5 border-b border-black/5 dark:border-white/10 mb-1 flex items-center justify-between text-[#64748b] dark:text-[#cbd5e1]">
        <span class="truncate font-bold text-[#0f172a] dark:text-[#fafafa] max-w-[170px]">
          {{ selectedCount > 1 ? `${selectedCount} items selected` : item?.name }}
        </span>
      </div>

      <!-- Actions -->
      <button 
        v-if="selectedCount <= 1"
        @click="emitAction('open')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <EyeIcon class="w-4 h-4 text-indigo-500 shrink-0" />
        <span>{{ item?.isDirectory ? 'Open Folder' : 'Preview / Open' }}</span>
      </button>

      <button 
        v-if="selectedCount <= 1"
        @click="emitAction('share')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <Share2Icon class="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Share Link...</span>
      </button>

      <button 
        v-if="selectedCount <= 1"
        @click="emitAction('direct-link')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <LinkIcon class="w-4 h-4 text-cyan-500 shrink-0" />
        <span>Direct CDN &amp; Download Link...</span>
      </button>

      <!-- In-Place ZIP Extraction Options (Only for .zip files) -->
      <template v-if="selectedCount <= 1 && !item?.isDirectory && item?.name?.toLowerCase().endsWith('.zip')">
        <button 
          @click="emitAction('extract-zip')" 
          class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-semibold text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
        >
          <FolderDownIcon class="w-4 h-4 accent-text shrink-0" />
          <span>Extract Here</span>
        </button>

        <button 
          @click="emitAction('extract-zip-subfolder')" 
          class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
        >
          <FolderArchiveIcon class="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Extract to Folder</span>
        </button>

        <div class="my-1 border-t border-black/5 dark:border-white/10"></div>
      </template>

      <!-- In-Place ZIP Compression Option -->
      <button 
        @click="emitAction('compress-zip')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <PackagePlusIcon class="w-4 h-4 text-purple-500 shrink-0" />
        <span>{{ selectedCount > 1 ? `Compress ${selectedCount} items to ZIP` : 'Compress to ZIP' }}</span>
      </button>

      <div class="my-1 border-t border-black/5 dark:border-white/10"></div>

      <button 
        v-if="selectedCount <= 1"
        @click="emitAction('toggle-favorite')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <StarIcon class="w-4 h-4 shrink-0" :class="isFavorite(item) ? 'text-amber-400 fill-amber-400' : 'text-[#94a3b8] dark:text-[#cbd5e1]'" />
        <span>{{ isFavorite(item) ? 'Remove from Favorites' : 'Add to Favorites' }}</span>
      </button>

      <button 
        @click="emitAction('download')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <DownloadIcon class="w-4 h-4 text-blue-500 shrink-0" />
        <span>{{ selectedCount > 1 ? `Download ${selectedCount} items as ZIP` : (item?.isDirectory ? 'Download as ZIP' : 'Download File') }}</span>
      </button>

      <button 
        v-if="selectedCount <= 1 && !item?.isDirectory && isCodeOrText(item?.name)"
        @click="emitAction('edit-code')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <CodeIcon class="w-4 h-4 text-violet-500 shrink-0" />
        <span>Edit in Code Editor</span>
      </button>

      <!-- Version History (Files only) -->
      <button 
        v-if="selectedCount <= 1 && !item?.isDirectory"
        @click="emitAction('versions')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <HistoryIcon class="w-4 h-4 text-amber-500 shrink-0" />
        <span>Version History</span>
      </button>

      <button 
        v-if="selectedCount <= 1"
        @click="emitAction('details')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <InfoIcon class="w-4 h-4 text-[#94a3b8] dark:text-[#cbd5e1] shrink-0" />
        <span>File Details</span>
      </button>

      <div class="my-1 border-t border-black/5 dark:border-white/10"></div>

      <button 
        v-if="selectedCount <= 1"
        @click="emitAction('rename')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <Edit3Icon class="w-4 h-4 text-amber-500 shrink-0" />
        <span>Rename</span>
      </button>

      <button 
        @click="emitAction('move')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <FolderInputIcon class="w-4 h-4 text-indigo-500 shrink-0" />
        <span>{{ selectedCount > 1 ? `Move ${selectedCount} items to...` : 'Move to...' }}</span>
      </button>

      <div class="my-1 border-t border-black/5 dark:border-white/10"></div>

      <button 
        @click="emitAction('delete')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#0f172a] dark:text-[#fafafa] text-left transition-colors font-medium cursor-pointer"
      >
        <Trash2Icon class="w-4 h-4 text-[#64748b] dark:text-[#cbd5e1] shrink-0" />
        <span>{{ selectedCount > 1 ? `Move ${selectedCount} items to Trash` : 'Move to Trash' }}</span>
      </button>

      <button 
        @click="emitAction('delete-permanent')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 text-left transition-colors font-semibold cursor-pointer"
      >
        <FlameIcon class="w-4 h-4 text-red-500 shrink-0" />
        <span>{{ selectedCount > 1 ? `Delete ${selectedCount} items permanently` : 'Delete Permanently' }}</span>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  Eye as EyeIcon, 
  Share2 as Share2Icon, 
  Link as LinkIcon, 
  Star as StarIcon, 
  Download as DownloadIcon, 
  Info as InfoIcon, 
  Edit3 as Edit3Icon, 
  Code as CodeIcon,
  FolderInput as FolderInputIcon, 
  Trash2 as Trash2Icon,
  Flame as FlameIcon,
  FolderDown as FolderDownIcon,
  FolderArchive as FolderArchiveIcon,
  PackagePlus as PackagePlusIcon,
  History as HistoryIcon
} from 'lucide-vue-next'
import { useFavorites } from '../../composables/useFavorites'
import { useFileHelpers } from '../../composables/useFileHelpers'

const { isFavorite } = useFavorites()
const { isCodeOrText } = useFileHelpers()

const props = defineProps({
  visible: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ x: 0, y: 0 }) },
  item: { type: Object, default: null },
  selectedCount: { type: Number, default: 1 }
})

const emit = defineEmits(['close', 'action'])

const emitAction = (actionName) => {
  emit('action', { action: actionName, item: props.item })
  emit('close')
}

const handleClickOutside = (e) => {
  if (props.visible) {
    emit('close')
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('blur', handleClickOutside)
    window.addEventListener('resize', handleClickOutside)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside)
    window.removeEventListener('blur', handleClickOutside)
    window.removeEventListener('resize', handleClickOutside)
  }
})
</script>
