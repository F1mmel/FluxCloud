<template>
  <Transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4" @click.self="handleClose">
      <div class="glass-modal border border-white/20 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl accent-bg-alpha">
              <UploadCloudIcon class="w-5 h-5 accent-text" />
            </div>
            <div>
              <h3 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa]">Upload Files</h3>
              <p class="text-xs text-[#64748b] dark:text-[#71717a]">Target: /{{ currentPath || 'root' }}</p>
            </div>
          </div>
          <button @click="handleClose" class="text-[#64748b] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa] p-1 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] transition-colors">
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Drag & Drop Area -->
        <div 
          class="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-white/60 dark:bg-black/20"
          :style="isDragging ? 'border-color: var(--accent-color); background-color: var(--accent-bg-alpha)' : ''"
          :class="!isDragging ? 'border-black/15 dark:border-white/15 hover:border-indigo-500/50' : ''"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <UploadCloudIcon class="w-10 h-10 accent-text mx-auto mb-3 transition-transform duration-200 hover:scale-110" />
          <p class="text-sm font-medium text-[#0f172a] dark:text-[#fafafa] mb-1">Click to browse or drop files here</p>
          <p class="text-xs text-[#64748b] dark:text-[#71717a]">Supports images, videos, documents, archives, code</p>
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden" 
            multiple 
            @change="handleSelect" 
          />
        </div>

        <!-- Selected Files Queue -->
        <div v-if="queuedFiles.length > 0" class="mt-4 max-h-48 overflow-y-auto space-y-1.5 p-1">
          <div 
            v-for="(f, idx) in queuedFiles" 
            :key="idx"
            class="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-xs transition-all animate-in fade-in"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <FileIcon class="w-4 h-4 text-indigo-500 shrink-0" />
              <span class="truncate text-[#0f172a] dark:text-[#fafafa] font-medium max-w-[260px]">{{ f.name }}</span>
              <span class="text-[#64748b] dark:text-[#71717a] shrink-0">{{ formatBytes(f.size) }}</span>
            </div>
            <button 
              v-if="!uploading" 
              @click="removeQueued(idx)" 
              class="text-[#64748b] dark:text-[#71717a] hover:text-red-500 p-1 transition-colors"
            >
              <XIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Upload Progress Indicator -->
        <div v-if="uploading" class="mt-4 p-3 rounded-xl bg-[#f1f5f9] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-[#0f172a] dark:text-[#fafafa] font-medium flex items-center gap-2">
              <Loader2Icon class="w-3.5 h-3.5 animate-spin accent-text" />
              <span>Uploading {{ queuedFiles.length }} files...</span>
            </span>
          </div>
          <div class="w-full bg-[#e2e8f0] dark:bg-[#27272a] rounded-full h-1.5 overflow-hidden">
            <div class="accent-bg h-full animate-pulse w-full"></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between mt-6 pt-3 border-t border-[#e2e8f0] dark:border-[#27272a] text-xs">
          <span class="text-[#64748b] dark:text-[#71717a]">
            {{ queuedFiles.length > 0 ? `${queuedFiles.length} files selected (${formatBytes(totalSize)})` : 'No files queued' }}
          </span>

          <div class="flex items-center gap-2.5">
            <button 
              type="button" 
              @click="handleClose" 
              :disabled="uploading"
              class="px-4 py-2 border border-[#e2e8f0] dark:border-[#27272a] hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] rounded-xl text-[#0f172a] dark:text-[#fafafa] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="button" 
              @click="startUpload" 
              :disabled="queuedFiles.length === 0 || uploading"
              class="px-5 py-2 accent-bg accent-bg-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-white transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <UploadIcon class="w-3.5 h-3.5" />
              <span>{{ uploading ? 'Uploading...' : 'Start Upload' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  UploadCloud as UploadCloudIcon, 
  Upload as UploadIcon, 
  File as FileIcon, 
  X as XIcon, 
  Loader2 as Loader2Icon 
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'

const props = defineProps({
  show: { type: Boolean, default: false },
  currentPath: { type: String, default: '' },
  uploading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'upload'])

const { formatBytes } = useFileHelpers()

const isDragging = ref(false)
const queuedFiles = ref([])
const fileInput = ref(null)

const totalSize = computed(() => {
  return queuedFiles.value.reduce((acc, f) => acc + f.size, 0)
})

const handleSelect = (e) => {
  const files = Array.from(e.target.files || [])
  queuedFiles.value = [...queuedFiles.value, ...files]
  if (fileInput.value) fileInput.value.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files || [])
  queuedFiles.value = [...queuedFiles.value, ...files]
}

const removeQueued = (index) => {
  queuedFiles.value.splice(index, 1)
}

const handleClose = () => {
  if (props.uploading) return
  queuedFiles.value = []
  emit('close')
}

const startUpload = () => {
  if (queuedFiles.value.length === 0 || props.uploading) return
  emit('upload', queuedFiles.value)
  queuedFiles.value = []
}
</script>
