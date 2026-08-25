<template>
  <Transition name="modal-fade">
    <div 
      v-if="show" 
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none"
      @click.self="$emit('close')"
    >
      <div 
        class="glass-modal border border-white/20 dark:border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <!-- Modal Header -->
        <div class="h-16 px-6 border-b border-[#e2e8f0] dark:border-[#27272a] flex items-center justify-between glass-header shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <div class="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shrink-0">
              <LinkIcon class="w-5 h-5" />
            </div>
            <div class="flex flex-col min-w-0">
              <h3 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
                <span>Direct Links</span>
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

          <div v-else class="space-y-4">
            <!-- 1. Web Preview Landing Page URL (Interactive Web View without share record) -->
            <div class="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <GlobeIcon class="w-4 h-4 text-indigo-500" />
                  <span class="text-xs font-bold text-[#0f172a] dark:text-[#fafafa]">Preview Landing Page</span>
                  <span class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold uppercase">Web View</span>
                </div>
                <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1]">PDF Reader • Media Lightbox</span>
              </div>

              <div class="flex items-center gap-2">
                <input 
                  type="text" 
                  :value="fullLandingUrl" 
                  readonly 
                  class="flex-1 px-3.5 py-2 bg-white dark:bg-[#18181b] border border-indigo-500/30 rounded-xl text-xs font-mono text-[#0f172a] dark:text-[#fafafa] select-all focus:outline-none"
                />
                <button 
                  @click="copyUrl(fullLandingUrl, 'Preview Landing Page URL copied!')" 
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <CopyIcon class="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                <a 
                  :href="fullLandingUrl" 
                  target="_blank" 
                  class="p-2 border border-black/10 dark:border-white/15 bg-white dark:bg-[#18181b] hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-all shrink-0 cursor-pointer"
                  title="Open Preview Page in New Tab"
                >
                  <ExternalLinkIcon class="w-4 h-4" />
                </a>
              </div>
            </div>

            <!-- 2. Direct Raw Stream / Download URL -->
            <div class="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <LinkIcon class="w-4 h-4 text-cyan-500" />
                  <span class="text-xs font-bold text-[#0f172a] dark:text-[#fafafa]">{{ isDirectDownload ? 'Direct Auto-Download URL' : 'Direct Raw CDN Stream' }}</span>
                  <span class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold uppercase">Raw Stream</span>
                </div>
                <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1]">{{ isDirectDownload ? 'Instant download trigger' : 'HTML <img> / <video> / curl' }}</span>
              </div>

              <div class="flex items-center gap-2">
                <input 
                  type="text" 
                  :value="activeCdnUrl" 
                  readonly 
                  class="flex-1 px-3.5 py-2 bg-white dark:bg-[#18181b] border border-black/10 dark:border-white/15 rounded-xl text-xs font-mono text-[#0f172a] dark:text-[#fafafa] select-all focus:outline-none"
                />
                <button 
                  @click="copyUrl(activeCdnUrl, isDirectDownload ? 'Auto-Download URL copied!' : 'Direct Raw CDN stream copied!')" 
                  class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <CopyIcon class="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                <a 
                  :href="activeCdnUrl" 
                  target="_blank" 
                  class="p-2 border border-black/10 dark:border-white/15 bg-white dark:bg-[#18181b] hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-all shrink-0 cursor-pointer"
                  title="Open Direct Stream in New Tab"
                >
                  <ExternalLinkIcon class="w-4 h-4" />
                </a>
              </div>

              <!-- Direct Download Toggle Checkbox -->
              <div 
                class="pt-2 flex items-center justify-between cursor-pointer border-t border-black/5 dark:border-white/5 mt-2" 
                @click="isDirectDownload = !isDirectDownload"
              >
                <div class="flex items-center gap-2">
                  <DownloadCloudIcon class="w-3.5 h-3.5 text-cyan-500" />
                  <span class="text-[11px] font-semibold text-[#0f172a] dark:text-[#fafafa]">Force Direct Auto-Download (?download=1)</span>
                </div>
                <AppCheckbox v-model="isDirectDownload" @click.stop />
              </div>
            </div>

            <!-- 3. QR Code & Close Footer -->
            <div class="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <img 
                  :src="qrCodeUrl" 
                  alt="QR Code" 
                  class="w-12 h-12 rounded-xl border border-white/20 dark:border-white/10 shadow-xs bg-white p-1 shrink-0"
                />
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-[#0f172a] dark:text-[#fafafa]">Mobile QR Code</span>
                  <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1]">Scans directly to Landing Page</span>
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
  Globe as GlobeIcon,
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

const fullLandingUrl = computed(() => {
  if (typeof window === 'undefined' || !directData.value?.directPreviewPageUrl) return ''
  return `${window.location.origin}${directData.value.directPreviewPageUrl}`
})

const fullDirectUrl = computed(() => {
  if (typeof window === 'undefined' || !directData.value?.directUrl) return ''
  return `${window.location.origin}${directData.value.directUrl}`
})

const fullDownloadUrl = computed(() => {
  if (typeof window === 'undefined' || !directData.value?.directDownloadUrl) return ''
  return `${window.location.origin}${directData.value.directDownloadUrl}`
})

const activeCdnUrl = computed(() => {
  return isDirectDownload.value ? fullDownloadUrl.value : fullDirectUrl.value
})

const qrCodeUrl = computed(() => {
  return getQrCodeUrl(fullLandingUrl.value || fullDirectUrl.value)
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
    error('Direct Link Error', err?.data?.statusMessage || 'Failed to generate direct token')
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

const copyUrl = async (url, successMsg) => {
  if (!url) return
  if (await copyToClipboard(url)) {
    success('Link copied', successMsg)
  }
}
</script>
