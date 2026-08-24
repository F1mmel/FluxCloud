<template>
  <Transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4" @click.self="$emit('close')">
      <div class="glass-modal border border-white/20 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0] dark:border-[#27272a]">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/40">
              <Share2Icon class="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa]">
                {{ (createdShare === null && (activeExistingShare || props.item?.openConfigure)) ? 'Configure Share Link' : 'Share Link' }}
              </h3>
              <p class="text-xs text-[#64748b] dark:text-[#71717a] truncate max-w-[280px]">{{ item?.name }}</p>
            </div>
          </div>
          <button @click="$emit('close')" class="text-[#64748b] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa] p-1 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] transition-colors">
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Generated Share Result (if created) -->
        <div v-if="createdShare" class="py-4 space-y-4">
          <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2Icon class="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Public share link created successfully! Anyone with this link can access the file according to your rules.</span>
          </div>

          <!-- Share URL Bar -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] block">Share URL</label>
            <div class="flex items-center gap-2">
              <input 
                type="text" 
                :value="fullShareUrl" 
                readonly 
                class="flex-1 px-3.5 py-2 bg-[#f8fafc] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] rounded-xl text-xs text-[#0f172a] dark:text-[#fafafa] font-mono select-all focus:outline-none"
              />
              <button 
                @click="copyLink" 
                class="px-4 py-2 accent-bg accent-bg-hover rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-md shrink-0 active:scale-95"
              >
                <CopyIcon class="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <!-- QR Code & Active Share Policy -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <!-- QR Code Preview -->
            <div class="p-3.5 bg-[#f8fafc] dark:bg-[#18181b] rounded-xl border border-[#e2e8f0] dark:border-[#27272a] flex flex-col items-center justify-center text-center">
              <img 
                :src="getQrCodeUrl(fullShareUrl, 140)" 
                alt="Share QR Code" 
                class="w-24 h-24 rounded-lg bg-white p-1 mb-2 shadow-sm border border-[#e2e8f0] dark:border-transparent"
              />
              <span class="text-[10px] font-medium text-[#64748b] dark:text-[#cbd5e1]">Scan to open on mobile</span>
            </div>

            <!-- Active Share Policy Details -->
            <div class="p-3.5 bg-[#f8fafc] dark:bg-[#18181b] rounded-xl border border-[#e2e8f0] dark:border-[#27272a] flex flex-col justify-between text-xs space-y-2.5">
              <div>
                <span class="text-[11px] font-bold text-[#0f172a] dark:text-[#fafafa] block mb-2.5">Share Configuration</span>
                
                <div class="space-y-2">
                  <!-- Expiration -->
                  <div class="flex items-start gap-2">
                    <ClockIcon class="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <div class="flex flex-col">
                      <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] font-semibold">Expiration</span>
                      <span class="font-medium text-[#0f172a] dark:text-[#fafafa] text-[11px]">{{ formatExpiry(createdShare.expiresAt) }}</span>
                    </div>
                  </div>

                  <!-- Password -->
                  <div class="flex items-start gap-2">
                    <LockIcon class="w-3.5 h-3.5 shrink-0 mt-0.5" :class="createdShare.hasPassword ? 'text-amber-500' : 'text-emerald-500'" />
                    <div class="flex flex-col">
                      <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] font-semibold">Protection</span>
                      <span class="font-medium text-[11px]" :class="createdShare.hasPassword ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">
                        {{ createdShare.hasPassword ? 'Password Protected 🔒' : 'Public (No Password)' }}
                      </span>
                    </div>
                  </div>

                  <!-- Access / Download limit -->
                  <div class="flex items-start gap-2">
                    <DownloadIcon class="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <div class="flex flex-col">
                      <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] font-semibold">Access &amp; Limit</span>
                      <span class="font-medium text-[#0f172a] dark:text-[#fafafa] text-[11px]">
                        {{ createdShare.viewOnly ? 'View-Only (Download disabled)' : (createdShare.maxDownloads ? `Max ${createdShare.maxDownloads} Downloads` : 'Unlimited Downloads') }}
                      </span>
                    </div>
                  </div>

                  <!-- Guest Uploads Policy -->
                  <div v-if="createdShare.isDirectory && createdShare.allowUploads" class="flex items-start gap-2">
                    <UploadCloudIcon class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <div class="flex flex-col">
                      <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] font-semibold">Guest Uploads</span>
                      <span class="font-medium text-emerald-600 dark:text-emerald-400 text-[11px]">File Drop Enabled 📥</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Test Link -->
              <a 
                :href="createdShare.shareUrl || `/s/${createdShare.id}`" 
                target="_blank" 
                class="text-[11px] accent-text hover:underline inline-flex items-center gap-1 font-semibold pt-1 border-t border-black/5 dark:border-white/10"
              >
                <span>Test Share Page</span>
                <ExternalLinkIcon class="w-3 h-3" />
              </a>
            </div>
          </div>

          <!-- Modal Actions Footer -->
          <div class="flex items-center justify-between gap-3 pt-3 border-t border-black/5 dark:border-white/10 mt-1">
            <button 
              type="button"
              @click="reconfigureShare" 
              class="px-4 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/20 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#0f172a] dark:text-[#fafafa] transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2Icon class="w-3.5 h-3.5" />
              <span>Reconfigure Share</span>
            </button>

            <button 
              type="button"
              @click="$emit('close')" 
              class="px-6 py-2 accent-bg accent-bg-hover text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

        <!-- Creation Form -->
        <form v-else @submit.prevent="handleCreateShare" class="py-4 space-y-4">
          <!-- Expiration Selector (Shadcn Style) -->
          <div class="space-y-1.5 flex flex-col">
            <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-1.5">
              <ClockIcon class="w-3.5 h-3.5 text-indigo-500" />
              <span>Link Expiration</span>
            </label>
            <AppSelect 
              v-model="expiresIn" 
              :options="expirationOptions"
              button-class="w-full justify-between"
            />
          </div>

          <!-- Password Protection -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-1.5 cursor-pointer" @click="enablePassword = !enablePassword">
                <LockIcon class="w-3.5 h-3.5 text-amber-500" />
                <span>Password Protection</span>
              </label>
              <AppCheckbox v-model="enablePassword" />
            </div>

            <div v-if="enablePassword" class="animate-in fade-in duration-150">
              <input 
                v-model="password" 
                type="password" 
                :placeholder="activeExistingShare?.hasPassword ? 'Enter new password (or leave empty to keep current)' : 'Enter link password'" 
                class="w-full px-3.5 py-2 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 focus:border-indigo-500 rounded-xl text-xs text-[#0f172a] dark:text-[#fafafa] placeholder-[#94a3b8] dark:placeholder-[#71717a] focus:outline-none"
              />
            </div>
          </div>

          <!-- Download Limit -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-1.5">
                <DownloadIcon class="w-3.5 h-3.5 text-blue-500" />
                <span>Max Downloads Limit (Optional)</span>
              </label>
              <span class="text-[11px] text-[#64748b] dark:text-[#71717a]">{{ maxDownloads ? `${maxDownloads} downloads` : 'Unlimited' }}</span>
            </div>
            <input 
              v-model.number="maxDownloads" 
              type="number" 
              min="1" 
              placeholder="Leave empty for unlimited downloads" 
              class="w-full px-3.5 py-2 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 focus:border-indigo-500 rounded-xl text-xs text-[#0f172a] dark:text-[#fafafa] placeholder-[#94a3b8] dark:placeholder-[#71717a] focus:outline-none"
            />
          </div>

          <!-- View Only Toggle -->
          <div class="flex items-center justify-between pt-1">
            <div>
              <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] block">View Only Mode</label>
              <span class="text-[11px] text-[#64748b] dark:text-[#71717a]">Disable direct downloading, allow only in-browser preview</span>
            </div>
            <AppCheckbox v-model="viewOnly" />
          </div>

          <!-- Allow Guest Uploads / File Drop (Folders Only) -->
          <div v-if="item?.isDirectory" class="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/10">
            <div>
              <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-1.5 cursor-pointer" @click="allowUploads = !allowUploads">
                <UploadCloudIcon class="w-3.5 h-3.5 text-emerald-500" />
                <span>Allow Guest Uploads (File Drop)</span>
              </label>
              <span class="text-[11px] text-[#64748b] dark:text-[#71717a]">Visitors can upload files into this folder without an account</span>
            </div>
            <AppCheckbox v-model="allowUploads" />
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-black/5 dark:border-white/10 text-xs font-semibold">
            <button 
              type="button" 
              @click="$emit('close')" 
              class="px-4 py-2 border border-black/10 dark:border-white/20 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-xl text-[#0f172a] dark:text-[#fafafa] font-semibold transition-all cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :disabled="isCreating || (enablePassword && !password && !activeExistingShare?.hasPassword)"
              class="px-5 py-2 accent-bg accent-bg-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer font-semibold"
            >
              <Share2Icon class="w-3.5 h-3.5" />
              <span>{{ isCreating ? 'Saving...' : ((activeExistingShare || props.item?.openConfigure) ? 'Save & Update Share' : 'Generate Share Link') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  Share2 as Share2Icon, 
  X as XIcon, 
  Clock as ClockIcon, 
  Lock as LockIcon, 
  Download as DownloadIcon, 
  Copy as CopyIcon, 
  CheckCircle2 as CheckCircle2Icon, 
  ExternalLink as ExternalLinkIcon,
  Settings2 as Settings2Icon,
  UploadCloud as UploadCloudIcon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'
import { useShares } from '../../composables/useShares'
import AppCheckbox from '../ui/AppCheckbox.vue'
import AppSelect from '../ui/AppSelect.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null }
})

const emit = defineEmits(['close', 'created'])

const { copyToClipboard, getQrCodeUrl } = useFileHelpers()
const { success, error } = useToast()
const { markAsShared, activeShares, loadShares } = useShares()

const expirationOptions = [
  { value: 'never', label: 'Never (Permanent Link)' },
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: '1 Day (24 Hours)' },
  { value: '7d', label: '7 Days (1 Week)' },
  { value: '30d', label: '30 Days (1 Month)' }
]

const expiresIn = ref('never')
const enablePassword = ref(false)
const password = ref('')
const maxDownloads = ref(null)
const viewOnly = ref(false)
const allowUploads = ref(false)
const isCreating = ref(false)
const createdShare = ref(null)
const activeExistingShare = ref(null)

watch(() => props.show, async (newVal) => {
  if (newVal && props.item) {
    // Check if there is already an active share for this item
    if (activeShares.value.length === 0) {
      await loadShares()
    }
    const itemPath = props.item.relativePath || props.item.name
    const existing = props.item.shareData || activeShares.value.find(s => {
      const sp = s.displayPath || s.targetPath
      return (props.item.shareId && s.id === props.item.shareId) || sp === itemPath || s.targetPath === itemPath || s.targetPath.endsWith(`/${itemPath}`) || (props.item.name && s.fileName === props.item.name)
    })

    activeExistingShare.value = existing || null

    if (existing) {
      // Pre-fill existing settings
      enablePassword.value = !!existing.hasPassword
      password.value = ''
      maxDownloads.value = existing.maxDownloads || null
      viewOnly.value = !!existing.viewOnly
      allowUploads.value = !!existing.allowUploads

      if (existing.expiresAt) {
        const diffMs = new Date(existing.expiresAt).getTime() - Date.now()
        const diffHours = Math.round(diffMs / (1000 * 60 * 60))
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
        if (diffHours <= 2) expiresIn.value = '1h'
        else if (diffDays <= 2) expiresIn.value = '1d'
        else if (diffDays <= 10) expiresIn.value = '7d'
        else if (diffDays <= 40) expiresIn.value = '30d'
        else expiresIn.value = 'never'
      } else {
        expiresIn.value = 'never'
      }

      if (props.item.openConfigure) {
        createdShare.value = null
      } else {
        createdShare.value = existing
      }
    } else {
      expiresIn.value = 'never'
      enablePassword.value = false
      password.value = ''
      maxDownloads.value = null
      viewOnly.value = false
      allowUploads.value = false
      createdShare.value = null
    }
  } else {
    activeExistingShare.value = null
    createdShare.value = null
  }
})

const fullShareUrl = computed(() => {
  if (typeof window === 'undefined' || !createdShare.value) return ''
  const path = createdShare.value.shareUrl || (createdShare.value.id ? `/s/${createdShare.value.id}` : '')
  if (!path) return ''
  return `${window.location.origin}${path}`
})

const reconfigureShare = () => {
  if (createdShare.value) {
    if (createdShare.value.hasPassword) {
      enablePassword.value = true
    }
    maxDownloads.value = createdShare.value.maxDownloads || null
    viewOnly.value = !!createdShare.value.viewOnly
    allowUploads.value = !!createdShare.value.allowUploads
  }
  createdShare.value = null
}

const formatExpiry = (dateStr) => {
  if (!dateStr) return 'Never (Permanent Link)'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Never'
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  if (diffMs <= 0) return 'Expired'
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  
  const formattedDate = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  if (diffDays >= 1) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} (${formattedDate})`
  }
  return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} left`
}

const handleCreateShare = async () => {
  if (!props.item) return
  isCreating.value = true

  try {
    const res = await $fetch('/api/share', {
      method: 'POST',
      body: {
        shareId: props.item?.shareId || activeExistingShare.value?.id || null,
        path: props.item.relativePath || props.item.name,
        expiresIn: expiresIn.value,
        enablePassword: enablePassword.value,
        password: enablePassword.value ? password.value : null,
        maxDownloads: maxDownloads.value || null,
        viewOnly: viewOnly.value,
        allowUploads: props.item.isDirectory ? allowUploads.value : false
      }
    })

    createdShare.value = res.share
    activeExistingShare.value = res.share
    markAsShared(props.item, res.share)
    emit('created', res.share)
    success('Share link ready', 'Saved and updated share settings')
  } catch (err) {
    error('Share error', err?.data?.statusMessage || 'Failed to save share link')
  } finally {
    isCreating.value = false
  }
}

const copyLink = async () => {
  if (await copyToClipboard(fullShareUrl.value)) {
    success('Link copied', 'Share link copied to clipboard')
  }
}

const copyDirectUrl = async () => {
  if (!props.item) return
  try {
    const res = await $fetch('/api/direct-token', {
      method: 'POST',
      body: { path: props.item.relativePath || props.item.name }
    })
    const direct = `${window.location.origin}${res.directUrl}`
    if (await copyToClipboard(direct)) {
      success('Secure Direct URL copied', 'Unguessable CDN URL copied to clipboard')
    }
  } catch {
    const fallback = `${window.location.origin}${props.item.url || ''}`
    if (await copyToClipboard(fallback)) {
      success('Direct URL copied', 'Direct URL copied to clipboard')
    }
  }
}
</script>
