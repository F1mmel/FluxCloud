<template>
  <Transition name="context-menu-pop">
    <div 
      v-if="visible" 
      ref="menuRef"
      class="fixed z-[99999] glass-dropdown border border-black/10 dark:border-white/15 rounded-2xl shadow-2xl p-1.5 min-w-[200px] text-xs font-medium text-[#0f172a] dark:text-[#fafafa] select-none"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      @click.stop
      @contextmenu.prevent
    >
      <!-- New Folder -->
      <button 
        @click="emitAction('new-folder')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-semibold text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <FolderPlusIcon class="w-4 h-4 accent-text shrink-0" />
        <span>New Folder</span>
      </button>

      <!-- New File -->
      <button 
        @click="emitAction('new-file')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <FilePlusIcon class="w-4 h-4 text-emerald-500 shrink-0" />
        <span>New File (.txt)</span>
      </button>

      <div class="my-1 border-t border-black/5 dark:border-white/10"></div>

      <!-- Upload Files -->
      <button 
        @click="emitAction('upload-files')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <UploadCloudIcon class="w-4 h-4 text-indigo-500 shrink-0" />
        <span>Upload Files...</span>
      </button>

      <!-- Upload Folder -->
      <button 
        @click="emitAction('upload-folder')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <FolderUpIcon class="w-4 h-4 text-cyan-500 shrink-0" />
        <span>Upload Folder...</span>
      </button>

      <div class="my-1 border-t border-black/5 dark:border-white/10"></div>

      <!-- Select All -->
      <button 
        @click="emitAction('select-all')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <CheckSquareIcon class="w-4 h-4 text-[#94a3b8] dark:text-[#cbd5e1] shrink-0" />
        <span>Select All</span>
      </button>

      <!-- Refresh -->
      <button 
        @click="emitAction('refresh')" 
        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors font-medium text-[#0f172a] dark:text-[#fafafa] cursor-pointer"
      >
        <RefreshCwIcon class="w-4 h-4 text-[#94a3b8] dark:text-[#cbd5e1] shrink-0" />
        <span>Refresh</span>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { 
  FolderPlus as FolderPlusIcon, 
  FilePlus as FilePlusIcon, 
  UploadCloud as UploadCloudIcon, 
  FolderUp as FolderUpIcon, 
  CheckSquare as CheckSquareIcon, 
  RefreshCw as RefreshCwIcon 
} from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ x: 0, y: 0 }) }
})

const emit = defineEmits(['close', 'action'])

const emitAction = (actionName) => {
  emit('action', actionName)
  emit('close')
}

const handleClickOutside = () => {
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
