<template>
  <div class="flex items-center gap-2 text-sm text-[#64748b] dark:text-[#a1a1aa] overflow-x-auto select-none py-1 px-1">
    <!-- Root button -->
    <button 
      @click="$emit('navigate', '')" 
      class="hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-all duration-150 flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
      @dragover.prevent="dragOverIndex = 'root'"
      @dragleave="dragOverIndex = null"
      @drop.prevent="handleDrop('')"
      :class="{ 'accent-text accent-bg-alpha scale-105 font-semibold': dragOverIndex === 'root' }"
      title="Root directory"
    >
      <HomeIcon class="w-4 h-4 shrink-0" />
      <span>root</span>
    </button>
    
    <!-- Segment crumbs -->
    <template v-for="(folder, index) in breadcrumbs" :key="index">
      <ChevronRightIcon class="w-3.5 h-3.5 text-[#94a3b8] dark:text-[#3f3f46] shrink-0" />
      <button 
        @click="$emit('navigate', getPath(index))" 
        class="hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-all duration-150 truncate max-w-[160px] px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
        @dragover.prevent="dragOverIndex = index"
        @dragleave="dragOverIndex = null"
        @drop.prevent="handleDrop(getPath(index))"
        :class="{ 
          'accent-text accent-bg-alpha scale-105 font-semibold': dragOverIndex === index,
          'text-[#0f172a] dark:text-[#fafafa] font-semibold': index === breadcrumbs.length - 1
        }"
        :title="folder"
      >
        {{ folder }}
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

const handleDrop = (targetPath) => {
  dragOverIndex.value = null
  emit('drop-to-path', targetPath)
}
</script>
