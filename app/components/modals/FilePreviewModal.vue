<template>
  <Transition name="modal-fade">
    <div 
      v-if="show && item" 
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none"
      @click.self="$emit('close')"
    >
      <!-- Top Bar -->
      <div class="w-full max-w-6xl flex items-center justify-between py-2 px-4 rounded-xl glass-modal border border-white/20 dark:border-white/10 shrink-0 text-sm mb-3 shadow-2xl">
        <div class="flex items-center gap-3 min-w-0">
          <FileIcon class="w-5 h-5 text-indigo-500 shrink-0" />
          <div class="flex flex-col min-w-0">
            <span class="font-semibold text-[#0f172a] dark:text-[#fafafa] truncate max-w-md">{{ item.name }}</span>
            <span class="text-[11px] text-[#64748b] dark:text-[#71717a]">{{ formatBytes(item.size) }} • {{ formatDate(item.modifiedAt || item.createdAt) }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <!-- Edit Code Button -->
          <button 
            v-if="!item.isDirectory && isCodeOrText(item.name)"
            @click="$emit('edit', item)" 
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <CodeIcon class="w-3.5 h-3.5" />
            <span>Edit File</span>
          </button>

          <!-- Direct Download Button -->
          <a 
            v-if="item.url" 
            :href="`${item.url}?download=1`" 
            class="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f5f9] dark:bg-[#18181b] hover:bg-[#e2e8f0] dark:hover:bg-[#27272a] border border-[#cbd5e1] dark:border-[#27272a] rounded-lg text-xs font-medium text-[#0f172a] dark:text-[#fafafa] transition-all active:scale-95"
          >
            <DownloadIcon class="w-3.5 h-3.5" />
            <span>Download</span>
          </a>

          <!-- Share Button -->
          <button 
            @click="$emit('share', item)" 
            class="flex items-center gap-1.5 px-3 py-1.5 accent-bg accent-bg-hover rounded-lg text-xs font-medium text-white transition-all active:scale-95 shadow-sm"
          >
            <Share2Icon class="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <!-- Close Button -->
          <button 
            @click="$emit('close')" 
            class="p-1.5 text-[#64748b] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa] rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] transition-colors ml-1"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Main Preview Content -->
      <div class="w-full max-w-6xl flex-1 rounded-2xl bg-white dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#27272a] flex items-center justify-center overflow-hidden relative p-4 shadow-2xl">
        <!-- Loading Text Content Indicator -->
        <div v-if="loadingText" class="flex flex-col items-center gap-3 text-[#64748b] dark:text-[#71717a]">
          <Loader2Icon class="w-8 h-8 animate-spin accent-text" />
          <span class="text-xs">Loading content...</span>
        </div>

        <!-- 1. Image Preview -->
        <div v-else-if="isImage(item.name)" class="w-full h-full flex items-center justify-center p-2 overflow-auto">
          <img 
            :src="item.url" 
            :alt="item.name" 
            class="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl transition-transform duration-200"
            :style="{ transform: `scale(${zoomLevel})` }"
          />
          <!-- Zoom Controls -->
          <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 dark:bg-[#12131a]/95 border border-[#e2e8f0] dark:border-[#27272a] rounded-xl px-3 py-1.5 shadow-xl text-xs backdrop-blur-md">
            <button @click="zoomLevel = Math.max(0.5, zoomLevel - 0.25)" class="p-1 text-[#475569] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-[#fafafa] font-bold">-</button>
            <span class="text-[#0f172a] dark:text-[#fafafa] font-mono w-12 text-center">{{ Math.round(zoomLevel * 100) }}%</span>
            <button @click="zoomLevel = Math.min(3, zoomLevel + 0.25)" class="p-1 text-[#475569] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-[#fafafa] font-bold">+</button>
            <button @click="zoomLevel = 1" class="ml-2 text-[11px] text-[#64748b] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa]">Reset</button>
          </div>
        </div>

        <!-- 2. Video Preview -->
        <div v-else-if="isVideo(item.name)" class="w-full h-full flex items-center justify-center">
          <video 
            :src="item.url" 
            controls 
            autoplay 
            class="max-w-full max-h-[75vh] rounded-xl shadow-2xl bg-black"
          ></video>
        </div>

        <!-- 3. Audio Preview -->
        <div v-else-if="isAudio(item.name)" class="flex flex-col items-center justify-center p-12 max-w-md w-full bg-[#f8fafc] dark:bg-[#12131a] rounded-2xl border border-[#e2e8f0] dark:border-[#27272a] shadow-2xl">
          <div class="p-6 rounded-full accent-bg-alpha mb-6">
            <MusicIcon class="w-16 h-16 accent-text" />
          </div>
          <h4 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa] text-center mb-1 truncate w-full">{{ item.name }}</h4>
          <p class="text-xs text-[#64748b] dark:text-[#71717a] mb-6">{{ formatBytes(item.size) }}</p>
          <audio :src="item.url" controls autoplay class="w-full"></audio>
        </div>

        <!-- 4. PDF Preview -->
        <div v-else-if="isPdf(item.name)" class="w-full h-full">
          <iframe :src="item.url" class="w-full h-full rounded-xl border-0"></iframe>
        </div>

        <!-- 5. Code / Text / Markdown Viewer -->
        <div v-else-if="textContent !== null" class="w-full h-full flex flex-col bg-white dark:bg-[#0d0e15] rounded-xl overflow-hidden border border-[#e2e8f0] dark:border-[#27272a]">
          <div class="flex items-center justify-between px-4 py-2 bg-[#f1f5f9] dark:bg-[#12131a] border-b border-[#e2e8f0] dark:border-[#27272a] text-xs">
            <span class="font-mono text-[#475569] dark:text-[#a1a1aa]">{{ item.name }} ({{ lineCount }} lines)</span>
            <button 
              @click="copyTextContent" 
              class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-[#18181b] border border-[#cbd5e1] dark:border-[#27272a] hover:bg-[#e2e8f0] dark:hover:bg-[#27272a] text-[#0f172a] dark:text-[#fafafa] transition-all active:scale-95"
            >
              <CopyIcon class="w-3.5 h-3.5" />
              <span>Copy Text</span>
            </button>
          </div>
          <pre class="flex-1 p-4 overflow-auto text-xs font-mono text-[#334155] dark:text-[#e4e4e7] leading-relaxed select-text whitespace-pre-wrap"><code>{{ textContent }}</code></pre>
        </div>

        <!-- 6. Generic / Unsupported Binary Preview -->
        <div v-else class="flex flex-col items-center justify-center text-center p-8">
          <div class="p-6 rounded-2xl bg-[#f8fafc] dark:bg-[#12131a] border border-[#e2e8f0] dark:border-[#27272a] mb-4 shadow-md">
            <FileIcon class="w-16 h-16 text-[#94a3b8] dark:text-[#52525b]" />
          </div>
          <h4 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa] mb-1">Preview not available</h4>
          <p class="text-xs text-[#64748b] dark:text-[#71717a] mb-6 max-w-sm">This file type ({{ item.extension || 'binary' }}) does not support direct in-browser preview. You can download the raw file.</p>
          <a 
            :href="`${item.url}?download=1`" 
            class="flex items-center gap-2 px-5 py-2.5 accent-bg accent-bg-hover rounded-xl text-xs font-semibold text-white transition-all shadow-md active:scale-95"
          >
            <DownloadIcon class="w-4 h-4" />
            <span>Download {{ item.name }}</span>
          </a>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { 
  File as FileIcon, 
  X as XIcon, 
  Download as DownloadIcon, 
  Share2 as Share2Icon, 
  Music as MusicIcon, 
  Copy as CopyIcon, 
  Loader2 as Loader2Icon,
  Code as CodeIcon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null }
})

defineEmits(['close', 'share', 'edit'])

const { formatBytes, formatDate, isImage, isVideo, isAudio, isPdf, isCodeOrText, copyToClipboard } = useFileHelpers()
const { success } = useToast()

const zoomLevel = ref(1)
const textContent = ref(null)
const loadingText = ref(false)

const lineCount = computed(() => {
  if (!textContent.value) return 0
  return textContent.value.split('\n').length
})

watch(() => props.item, async (newItem) => {
  zoomLevel.value = 1
  textContent.value = null
  if (newItem && !newItem.isDirectory && isCodeOrText(newItem.name)) {
    loadingText.value = true
    try {
      const res = await $fetch(`/api/file-content?path=${encodeURIComponent(newItem.relativePath || newItem.name)}`)
      textContent.value = res.content
    } catch (err) {
      textContent.value = '// Error loading file preview content'
    } finally {
      loadingText.value = false
    }
  }
}, { immediate: true })

const copyTextContent = async () => {
  if (!textContent.value) return
  if (await copyToClipboard(textContent.value)) {
    success('Copied', 'File text copied to clipboard')
  }
}
</script>
