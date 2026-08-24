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
        <span class="truncate font-bold text-[#0f172a] dark:text-[#fafafa] max-w-[170px]">{{ item?.name }}</span>
      </div>

      <!-- Actions -->
      <button 
        @click="emitAction('open')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <EyeIcon class="w-4 h-4 text-indigo-500 shrink-0" />
        <span>{{ item?.isDirectory ? 'Open Folder' : 'Preview / Open' }}</span>
      </button>

      <button 
        @click="emitAction('share')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <Share2Icon class="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Share Link...</span>
      </button>

      <button 
        @click="emitAction('direct-link')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <LinkIcon class="w-4 h-4 text-cyan-500 shrink-0" />
        <span>Direct CDN &amp; Download Link...</span>
      </button>

      <div class="my-1 border-t border-black/5 dark:border-white/10"></div>

      <button 
        @click="emitAction('toggle-favorite')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <StarIcon class="w-4 h-4 shrink-0" :class="isFavorite(item) ? 'text-amber-400 fill-amber-400' : 'text-[#94a3b8] dark:text-[#cbd5e1]'" />
        <span>{{ isFavorite(item) ? 'Remove from Favorites' : 'Add to Favorites' }}</span>
      </button>

      <button 
        @click="emitAction('download')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <DownloadIcon class="w-4 h-4 text-blue-500 shrink-0" />
        <span>{{ item?.isDirectory ? 'Download as ZIP' : 'Download File' }}</span>
      </button>

      <button 
        v-if="!item?.isDirectory && isCodeOrText(item?.name)"
        @click="emitAction('edit-code')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <CodeIcon class="w-4 h-4 text-violet-500 shrink-0" />
        <span>Edit in Code Editor</span>
      </button>

      <button 
        @click="emitAction('details')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa]"
      >
        <InfoIcon class="w-4 h-4 text-[#94a3b8] dark:text-[#cbd5e1] shrink-0" />
        <span>File Details</span>
      </button>

      <div class="my-1 border-t border-black/5 dark:border-white/10"></div>

      <button 
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
        <span>Move to...</span>
      </button>

      <div class="my-1 border-t border-black/5 dark:border-white/10"></div>

      <button 
        @click="emitAction('delete')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 text-left transition-colors font-medium"
      >
        <Trash2Icon class="w-4 h-4 text-red-500 shrink-0" />
        <span>Move to Trash</span>
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
  Trash2 as Trash2Icon 
} from 'lucide-vue-next'
import { useFavorites } from '../../composables/useFavorites'
import { useFileHelpers } from '../../composables/useFileHelpers'

const { isFavorite } = useFavorites()
const { isCodeOrText } = useFileHelpers()

const props = defineProps({
  visible: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ x: 0, y: 0 }) },
  item: { type: Object, default: null }
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
