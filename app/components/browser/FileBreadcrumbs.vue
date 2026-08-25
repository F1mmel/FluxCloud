<template>
  <div class="flex items-center gap-1.5 text-sm text-[#64748b] dark:text-[#a1a1aa] overflow-x-auto select-none py-1 px-1">
    <!-- Root button -->
    <button 
      @click="$emit('navigate', '')" 
      class="breadcrumb-drop-btn transition-colors duration-150 flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border border-transparent relative"
      @dragenter.prevent="handleDragEnter('root')"
      @dragover.prevent="handleDragOver('root', $event)"
      @dragleave="handleDragLeave('root', $event)"
      @drop.prevent="handleDrop('', $event)"
      :class="[
        dragOverIndex === 'root' 
          ? 'font-bold shadow-sm' 
          : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] hover:bg-black/5 dark:hover:bg-white/10'
      ]"
      :style="dragOverIndex === 'root' ? 'box-shadow: inset 0 0 0 2px var(--accent-color); background-color: var(--accent-bg-alpha); color: var(--accent-color)' : ''"
      title="Root directory (Drop files here to move to root)"
    >
      <HomeIcon class="w-3.5 h-3.5 shrink-0 pointer-events-none" />
      <span class="pointer-events-none">root</span>
    </button>
    
    <!-- Segment crumbs -->
    <template v-for="(folder, index) in breadcrumbs" :key="index">
      <ChevronRightIcon class="w-3.5 h-3.5 text-[#94a3b8] dark:text-[#3f3f46] shrink-0 pointer-events-none" />
      <button 
        @click="$emit('navigate', getPath(index))" 
        class="breadcrumb-drop-btn transition-colors duration-150 truncate max-w-[160px] px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer border border-transparent relative"
        @dragenter.prevent="handleDragEnter(index)"
        @dragover.prevent="handleDragOver(index, $event)"
        @dragleave="handleDragLeave(index, $event)"
        @drop.prevent="handleDrop(getPath(index), $event)"
        :class="[
          dragOverIndex === index 
            ? 'font-bold shadow-sm' 
            : (index === breadcrumbs.length - 1 ? 'text-[#0f172a] dark:text-[#fafafa] font-bold bg-black/5 dark:bg-white/10' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] hover:bg-black/5 dark:hover:bg-white/10')
        ]"
        :style="dragOverIndex === index ? 'box-shadow: inset 0 0 0 2px var(--accent-color); background-color: var(--accent-bg-alpha); color: var(--accent-color)' : ''"
        :title="`Folder: ${folder} (Drop files here to move to this folder)`"
      >
        <span class="pointer-events-none truncate">{{ folder }}</span>
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Home as HomeIcon, ChevronRight as ChevronRightIcon } from 'lucide-vue-next'

const props = defineProps({
  currentPath: { type: String, default: '' }
})

const emit = defineEmits(['navigate', 'drop-to-path'])

const dragOverIndex = ref(null)

const breadcrumbs = computed(() => {
  return props.currentPath ? props.currentPath.split('/').filter(Boolean) : []
})

const getPath = (index) => {
  return breadcrumbs.value.slice(0, index + 1).join('/')
}

const handleDragEnter = (targetKey) => {
  dragOverIndex.value = targetKey
}

const handleDragOver = (targetKey, event) => {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverIndex.value = targetKey
}

const handleDragLeave = (targetKey, event) => {
  // Only clear if the cursor actually exited the button boundaries
  if (event.currentTarget && !event.currentTarget.contains(event.relatedTarget)) {
    if (dragOverIndex.value === targetKey) {
      dragOverIndex.value = null
    }
  }
}

const handleDrop = (targetPath, event) => {
  dragOverIndex.value = null
  emit('drop-to-path', { targetPath, event })
}
</script>

<style scoped>
.breadcrumb-drop-btn * {
  pointer-events: none;
}
</style>
