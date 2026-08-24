<template>
  <Transition name="modal-fade">
    <div 
      v-if="show" 
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none"
      @click.self="$emit('close')"
    >
      <div 
        class="glass-modal border border-white/20 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <!-- Modal Header -->
        <div class="h-16 px-6 border-b border-[#e2e8f0] dark:border-[#27272a] flex items-center justify-between glass-header shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <div class="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shrink-0">
              <LinkIcon class="w-5 h-5" />
            </div>
            <div class="flex flex-col min-w-0">
              <h3 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
                <span>Direct CDN Link</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  {{ item?.isDirectory ? 'Folder' : 'File' }}
                </span>
              </h3>
              <p class="text-xs text-[#64748b] dark:text-[#cbd5e1] truncate max-w-sm">/{{ item?.relativePath || item?.name }}</p>
            </div>
          </div>

          <button 
            @click="$emit('close')" 
            class="p-2 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-5">
          <!-- Loading State -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2Icon class="w-8 h-8 animate-spin text-cyan-500" />
            <span class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Generating permanent direct token...</span>
          </div>

          <div v-else class="space-y-5">
            <!-- 1. Direct URL Bar + Copy Button on top (Default Inline) -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-1.5">
                  <LinkIcon class="w-3.5 h-3.5 text-cyan-500" />
                  <span>{{ isDirectDownload ? 'Direct Download URL' : 'Direct Inline CDN URL' }}</span>
                </label>
                <span class="text-[10px] font-mono text-[#64748b] dark:text-[#cbd5e1]">
                  {{ isDirectDownload ? 'Auto-Download Trigger 🚀' : 'Raw / Inline Stream ⚡' }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <input 
                  type="text" 
                  :value="activeUrl" 
                  readonly 
                  class="flex-1 px-3.5 py-2.5 bg-[#f8fafc] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] focus:border-cyan-500 rounded-xl text-xs font-mono text-[#0f172a] dark:text-[#fafafa] select-all focus:outline-none transition-colors"
                />
                <button 
                  @click="copyActiveUrl" 
                  class="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <CopyIcon class="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                <a 
                  :href="activeUrl" 
                  target="_blank" 
                  class="p-2.5 border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-all shrink-0 cursor-pointer"
                  title="Open Link in New Tab"
                >
                  <ExternalLinkIcon class="w-4 h-4" />
                </a>
              </div>
            </div>

            <!-- 2. Direct Download Checkbox Option below -->
            <div class="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between gap-3 cursor-pointer hover:bg-black/[0.07] dark:hover:bg-white/[0.07] transition-all" @click="isDirectDownload = !isDirectDownload">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 shrink-0">
                  <DownloadCloudIcon class="w-4 h-4" />
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-xs font-bold text-[#0f172a] dark:text-[#fafafa]">Direct Download</span>
                  <span class="text-[11px] text-[#64748b] dark:text-[#cbd5e1]">Starts download immediately when opening this URL</span>
                </div>
              </div>
              <AppCheckbox v-model="isDirectDownload" @click.stop />
            </div>

            <!-- 3. QR Code & Close Footer -->
            <div class="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <img 
                  :src="qrCodeUrl" 
                  alt="QR Code" 
                  class="w-14 h-14 rounded-xl border border-white/20 dark:border-white/10 shadow-xs bg-white p-1 shrink-0"
                />
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-[#0f172a] dark:text-[#fafafa]">Mobile QR Code</span>
                  <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1]">Scan to open on phone</span>
                </div>
              </div>

              <button 
                @click="$emit('close')" 
                class="px-5 py-2 accent-bg accent-bg-hover text-white text-xs font-bold rounded-xl shadow-md active:scale-95 cursor-pointer shrink-0"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  Link as LinkIcon, 
  X as XIcon, 
  Copy as CopyIcon, 
  ExternalLink as ExternalLinkIcon, 
  DownloadCloud as DownloadCloudIcon, 
  Loader2 as Loader2Icon 
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'
import AppCheckbox from '../ui/AppCheckbox.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null }
})

const emit = defineEmits(['close'])

const { copyToClipboard, getQrCodeUrl } = useFileHelpers()
const { success, error } = useToast()

const loading = ref(false)
const directData = ref(null)
const isDirectDownload = ref(false)

const fullDirectUrl = computed(() => {
  if (typeof window === 'undefined' || !directData.value?.directUrl) return ''
  return `${window.location.origin}${directData.value.directUrl}`
})

const fullDownloadUrl = computed(() => {
  if (typeof window === 'undefined' || !directData.value?.directDownloadUrl) return ''
  return `${window.location.origin}${directData.value.directDownloadUrl}`
})

// Dynamically switch active URL based on Direct Download checkbox
const activeUrl = computed(() => {
  return isDirectDownload.value ? fullDownloadUrl.value : fullDirectUrl.value
})

const qrCodeUrl = computed(() => {
  return getQrCodeUrl(activeUrl.value || fullDirectUrl.value)
})

const loadDirectToken = async () => {
  if (!props.item) return
  loading.value = true
  isDirectDownload.value = false
  try {
    const res = await $fetch('/api/direct-token', {
      method: 'POST',
      body: { path: props.item.relativePath || props.item.name }
    })
    directData.value = res
  } catch (err) {
    error('Direct Link Error', err?.data?.statusMessage || 'Failed to generate direct CDN token')
    emit('close')
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal && props.item) {
    loadDirectToken()
  } else {
    directData.value = null
    isDirectDownload.value = false
  }
})

const copyActiveUrl = async () => {
  if (await copyToClipboard(activeUrl.value)) {
    const msg = isDirectDownload.value ? 'Direct Auto-Download URL copied' : 'Inline CDN link copied'
    success('Link copied', msg)
  }
}
</script>
