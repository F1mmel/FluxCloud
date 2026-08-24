<template>
  <Transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4" @click.self="$emit('close')">
      <div class="glass-modal border border-white/20 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
            <FolderInputIcon class="w-5 h-5 text-indigo-500" />
            <span>Move {{ items.length }} {{ items.length === 1 ? 'Item' : 'Items' }}</span>
          </h3>
          <button @click="$emit('close')" class="text-[#64748b] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa] p-1 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] transition-colors">
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-[#64748b] dark:text-[#a1a1aa] mb-3">Select the destination folder:</p>

        <!-- Folder Directory Tree / List -->
        <div class="max-h-60 overflow-y-auto border border-[#e2e8f0] dark:border-[#27272a] rounded-xl p-2 bg-[#f8fafc] dark:bg-[#09090b] space-y-1">
          <!-- Root destination -->
          <button 
            @click="selectedDestination = ''" 
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all duration-150 active:scale-[0.98]"
            :class="selectedDestination === '' ? 'accent-bg text-white shadow-sm' : 'text-[#0f172a] dark:text-[#fafafa] hover:bg-[#e2e8f0] dark:hover:bg-[#18181b]'"
          >
            <HomeIcon class="w-4 h-4 shrink-0" />
            <span>/ (Root Directory)</span>
          </button>

          <!-- Folder entries -->
          <button 
            v-for="folder in availableFolders" 
            :key="folder.path"
            @click="selectedDestination = folder.path" 
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all duration-150 active:scale-[0.98]"
            :class="selectedDestination === folder.path ? 'accent-bg text-white shadow-sm' : 'text-[#0f172a] dark:text-[#fafafa] hover:bg-[#e2e8f0] dark:hover:bg-[#18181b]'"
          >
            <FolderIcon class="w-4 h-4 shrink-0 text-indigo-500" />
            <span class="truncate font-mono">/{{ folder.path }}</span>
          </button>

          <div v-if="loadingFolders" class="p-4 text-center text-xs text-[#64748b] dark:text-[#71717a] flex items-center justify-center gap-2">
            <Loader2Icon class="w-4 h-4 animate-spin accent-text" />
            <span>Loading folders...</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-2.5 pt-5 border-t border-[#e2e8f0] dark:border-[#27272a] mt-5 text-xs font-semibold">
          <button 
            type="button" 
            @click="$emit('close')" 
            class="px-4 py-2 border border-[#e2e8f0] dark:border-[#27272a] hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] rounded-xl text-[#0f172a] dark:text-[#fafafa] transition-all"
          >
            Cancel
          </button>
          <button 
            type="button" 
            @click="handleMove"
            :disabled="isSubmitting"
            class="px-5 py-2 accent-bg accent-bg-hover disabled:opacity-50 rounded-xl text-white transition-all shadow-md active:scale-95"
          >
            <span v-if="isSubmitting">Moving...</span>
            <span v-else>Move Here</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { 
  FolderInput as FolderInputIcon, 
  Folder as FolderIcon, 
  Home as HomeIcon, 
  X as XIcon, 
  Loader2 as Loader2Icon 
} from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  isSubmitting: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'move'])

const selectedDestination = ref('')
const availableFolders = ref([])
const loadingFolders = ref(false)

watch(() => props.show, async (newVal) => {
  if (newVal) {
    selectedDestination.value = ''
    loadingFolders.value = true
    try {
      const res = await $fetch('/api/files?recursive=true&category=folder')
      availableFolders.value = (res || []).filter(f => f.isDirectory).map(f => ({ path: f.relativePath }))
    } catch {
      availableFolders.value = []
    } finally {
      loadingFolders.value = false
    }
  }
})

const handleMove = () => {
  emit('move', {
    items: props.items,
    destination: selectedDestination.value
  })
}
</script>
