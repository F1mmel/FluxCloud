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
                Share {{ item?.isDirectory ? 'Folder' : 'File' }}
              </h3>
              <p class="text-xs text-[#64748b] dark:text-[#71717a] truncate max-w-[280px]">{{ item?.name }}</p>
            </div>
          </div>
          <button @click="$emit('close')" class="text-[#64748b] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa] p-1 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] transition-colors">
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Mode Segmented Tabs -->
        <div class="mt-4 flex p-1 bg-black/5 dark:bg-white/10 rounded-xl border border-black/5 dark:border-white/10">
          <button 
            type="button"
            @click="shareMode = 'public'" 
            class="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            :class="shareMode === 'public' ? 'bg-white dark:bg-white/20 text-[#0f172a] dark:text-white shadow-sm font-bold' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white'"
          >
            <GlobeIcon class="w-3.5 h-3.5" />
            <span>Public Link</span>
          </button>
          <button 
            type="button"
            @click="shareMode = 'user'" 
            class="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            :class="shareMode === 'user' ? 'bg-white dark:bg-white/20 text-[#0f172a] dark:text-white shadow-sm font-bold' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white'"
          >
            <UsersIcon class="w-3.5 h-3.5" />
            <span>Share with User</span>
          </button>
        </div>

        <!-- ================= MODE 1: PUBLIC LINK ================= -->
        <div v-if="shareMode === 'public'" class="pt-3">
          <!-- Generated Share Result (if created and done) -->
          <div v-if="createdShare" class="py-2 space-y-4">
            <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2Icon class="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Public share link ready! Anyone with this link can access the file according to your rules.</span>
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
                  class="px-4 py-2 accent-bg accent-bg-hover rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-md shrink-0 active:scale-95 cursor-pointer"
                >
                  <CopyIcon class="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <!-- QR Code & Active Share Policy -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <!-- QR Code Preview -->
              <div class="p-3.5 bg-[#f8fafc] dark:bg-[#18181b] rounded-xl border border-[#e2e8f0] dark:border-[#27272a] flex flex-col items-center justify-center text-center">
                <img 
                  :src="getQrCodeUrl(fullShareUrl, 140)" 
                  alt="Share QR Code" 
                  class="w-24 h-24 rounded-lg bg-white p-1 mb-2 shadow-sm border border-[#e2e8f0] dark:border-transparent"
                />
                <span class="text-[10px] font-medium text-[#64748b] dark:text-[#cbd5e1]">Scan on mobile</span>
              </div>

              <!-- Active Share Policy Details -->
              <div class="p-3 bg-[#f8fafc] dark:bg-[#18181b] rounded-xl border border-[#e2e8f0] dark:border-[#27272a] flex flex-col justify-between text-xs space-y-2">
                <div>
                  <span class="text-[11px] font-bold text-[#0f172a] dark:text-[#fafafa] block mb-2">Policy Settings</span>
                  
                  <div class="space-y-1.5 text-[11px]">
                    <!-- Expiration -->
                    <div class="flex items-center gap-2 text-[#64748b] dark:text-[#cbd5e1]">
                      <ClockIcon class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{{ formatExpiry(createdShare.expiresAt) }}</span>
                    </div>

                    <!-- Password -->
                    <div class="flex items-center gap-2">
                      <LockIcon class="w-3.5 h-3.5 shrink-0" :class="createdShare.hasPassword ? 'text-amber-500' : 'text-emerald-500'" />
                      <span :class="createdShare.hasPassword ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">
                        {{ createdShare.hasPassword ? 'Password Protected 🔒' : 'No Password' }}
                      </span>
                    </div>

                    <!-- Hide folder contents badge -->
                    <div v-if="createdShare.isDirectory && createdShare.hideContents" class="flex items-center gap-2 text-indigo-500 font-semibold">
                      <EyeOffIcon class="w-3.5 h-3.5 shrink-0" />
                      <span>Blind File Drop (Contents Hidden)</span>
                    </div>

                    <!-- Guest Uploads Policy -->
                    <div v-else-if="createdShare.isDirectory && createdShare.allowUploads" class="flex items-center gap-2 text-emerald-500">
                      <UploadCloudIcon class="w-3.5 h-3.5 shrink-0" />
                      <span>Guest Uploads Allowed</span>
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
              <div class="flex items-center gap-2">
                <button 
                  type="button"
                  @click="reconfigureShare" 
                  class="px-3.5 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/20 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#0f172a] dark:text-[#fafafa] transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings2Icon class="w-3.5 h-3.5" />
                  <span>Reconfigure</span>
                </button>

                <!-- Revoke / Delete Share Link Button -->
                <button 
                  type="button"
                  @click="revokeShare" 
                  :disabled="isRevoking"
                  class="px-3.5 py-2 rounded-xl text-xs font-semibold border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Revoke and delete this share link immediately"
                >
                  <Trash2Icon v-if="!isRevoking" class="w-3.5 h-3.5" />
                  <Loader2Icon v-else class="w-3.5 h-3.5 animate-spin" />
                  <span>Revoke</span>
                </button>
              </div>

              <button 
                type="button"
                @click="$emit('close')" 
                class="px-6 py-2 accent-bg accent-bg-hover text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>

          <!-- Public Creation Form -->
          <form v-else @submit.prevent="handleCreateShare" class="py-3 space-y-3.5">
            <!-- Expiration Selector -->
            <div class="space-y-1 flex flex-col">
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
            <div class="space-y-1">
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
            <div v-if="item?.isDirectory" class="space-y-2 pt-2 border-t border-black/5 dark:border-white/10">
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-1.5 cursor-pointer" @click="allowUploads = !allowUploads">
                    <UploadCloudIcon class="w-3.5 h-3.5 text-emerald-500" />
                    <span>Allow Guest Uploads (File Drop)</span>
                  </label>
                  <span class="text-[11px] text-[#64748b] dark:text-[#71717a]">Visitors can upload files into this folder</span>
                </div>
                <AppCheckbox v-model="allowUploads" />
              </div>

              <!-- HIDE FOLDER CONTENTS (BLIND FILE DROP) -->
              <div v-if="allowUploads" class="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 animate-in fade-in duration-150">
                <div class="pr-2">
                  <label class="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 cursor-pointer" @click="hideContents = !hideContents">
                    <EyeOffIcon class="w-3.5 h-3.5 text-indigo-500" />
                    <span>Hide Folder Contents (Blind Upload)</span>
                  </label>
                  <span class="text-[10.5px] text-[#64748b] dark:text-[#cbd5e1] block mt-0.5">
                    Visitors cannot view existing files in the folder; they only see an upload dropzone.
                  </span>
                </div>
                <AppCheckbox v-model="hideContents" />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-black/5 dark:border-white/10 text-xs font-semibold">
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

        <!-- ================= MODE 2: SHARE WITH USER ================= -->
        <div v-else class="pt-4 space-y-4">
          <div class="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 text-xs text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2.5">
            <UsersIcon class="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Directly grant access to this file/folder for another user on your FluxCloud instance.</span>
          </div>

          <!-- User Picker -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] block">Select User</label>
            <div v-if="systemUsers.length > 0">
              <select 
                v-model="targetUser" 
                class="w-full px-3.5 py-2.5 bg-white/80 dark:bg-[#18181b] border border-black/10 dark:border-white/15 rounded-xl text-xs text-[#0f172a] dark:text-[#fafafa] focus:outline-none focus:border-indigo-500"
              >
                <option value="" disabled>-- Select a user --</option>
                <option v-for="u in systemUsers" :key="u.username" :value="u.username">
                  {{ u.username }} ({{ u.role }})
                </option>
              </select>
            </div>
            <div v-else class="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-[#64748b] dark:text-[#cbd5e1]">
              No other users found on this instance. Create additional users in Settings > Users.
            </div>
          </div>

          <!-- Permissions Selector -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] block">Access Permission</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                type="button"
                @click="userPermission = 'read'"
                class="p-3 rounded-xl border text-left transition-all"
                :class="userPermission === 'read' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 font-bold' : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'"
              >
                <span class="text-xs block text-[#0f172a] dark:text-[#fafafa]">Can View</span>
                <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] font-normal">Read and download only</span>
              </button>

              <button 
                type="button"
                @click="userPermission = 'write'"
                class="p-3 rounded-xl border text-left transition-all"
                :class="userPermission === 'write' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 font-bold' : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'"
              >
                <span class="text-xs block text-[#0f172a] dark:text-[#fafafa]">Can Edit &amp; Upload</span>
                <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] font-normal">Read, write and upload files</span>
              </button>
            </div>
          </div>

          <!-- Action Footer for User Sharing -->
          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-black/5 dark:border-white/10 text-xs font-semibold">
            <button 
              type="button" 
              @click="$emit('close')" 
              class="px-4 py-2 border border-black/10 dark:border-white/20 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-xl text-[#0f172a] dark:text-[#fafafa] font-semibold transition-all cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="button" 
              @click="handleCreateUserShare"
              :disabled="!targetUser || isCreating"
              class="px-5 py-2 accent-bg accent-bg-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer font-semibold"
            >
              <UsersIcon class="w-3.5 h-3.5" />
              <span>{{ isCreating ? 'Sharing...' : `Share with ${targetUser || 'User'}` }}</span>
            </button>
          </div>
        </div>
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
  UploadCloud as UploadCloudIcon,
  Globe as GlobeIcon,
  Users as UsersIcon,
  EyeOff as EyeOffIcon,
  Trash2 as Trash2Icon,
  Loader2 as Loader2Icon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'
import { useShares } from '../../composables/useShares'
import { useConfirm } from '../../composables/useConfirm'
import AppCheckbox from '../ui/AppCheckbox.vue'
import AppSelect from '../ui/AppSelect.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null }
})

const emit = defineEmits(['close', 'created', 'revoked'])

const { copyToClipboard, getQrCodeUrl } = useFileHelpers()
const { success, error } = useToast()
const { markAsShared, unmarkAsShared, activeShares, loadShares } = useShares()
const { askConfirm } = useConfirm()

const isRevoking = ref(false)
const shareMode = ref('public') // 'public' | 'user'

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
const hideContents = ref(false)
const isCreating = ref(false)
const createdShare = ref(null)
const activeExistingShare = ref(null)

// User Sharing States
const systemUsers = ref([])
const targetUser = ref('')
const userPermission = ref('read')

const loadSystemUsers = async () => {
  try {
    const res = await $fetch('/api/users')
    systemUsers.value = res || []
  } catch {
    systemUsers.value = []
  }
}

watch(() => props.show, async (newVal) => {
  if (newVal && props.item) {
    loadSystemUsers()

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
      enablePassword.value = !!existing.hasPassword
      password.value = ''
      maxDownloads.value = existing.maxDownloads || null
      viewOnly.value = !!existing.viewOnly
      allowUploads.value = !!existing.allowUploads
      hideContents.value = !!existing.hideContents

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
      hideContents.value = false
      createdShare.value = null
    }
  } else {
    activeExistingShare.value = null
    createdShare.value = null
    targetUser.value = ''
    userPermission.value = 'read'
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
    hideContents.value = !!createdShare.value.hideContents
  }
  createdShare.value = null
}

const revokeShare = async () => {
  const shareId = createdShare.value?.id || activeExistingShare.value?.id || props.item?.shareId
  if (!shareId) return

  const confirmed = await askConfirm({
    title: 'Revoke Share Link',
    message: `Are you sure you want to revoke and delete the share link for "${props.item?.name || 'this item'}"? The public link will stop working immediately.`,
    confirmText: 'Revoke Link',
    cancelText: 'Cancel',
    danger: true
  })
  if (!confirmed) return

  isRevoking.value = true
  try {
    await $fetch(`/api/share/${shareId}`, { method: 'DELETE' })
    unmarkAsShared(props.item, shareId)
    await loadShares()
    createdShare.value = null
    activeExistingShare.value = null
    success('Share Revoked', `Share link for "${props.item?.name || 'item'}" was deleted.`)
    emit('revoked', shareId)
    emit('close')
  } catch (err) {
    error('Revoke Failed', err?.data?.statusMessage || 'Failed to delete share link')
  } finally {
    isRevoking.value = false
  }
}

const formatExpiry = (dateStr) => {
  if (!dateStr) return 'Permanent Link'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Never'
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  if (diffMs <= 0) return 'Expired'
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays >= 1) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} left`
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
        allowUploads: props.item.isDirectory ? allowUploads.value : false,
        hideContents: props.item.isDirectory && allowUploads.value ? hideContents.value : false
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

const handleCreateUserShare = async () => {
  if (!props.item || !targetUser.value) return
  isCreating.value = true

  try {
    const res = await $fetch('/api/share', {
      method: 'POST',
      body: {
        path: props.item.relativePath || props.item.name,
        sharedWithUser: targetUser.value,
        permission: userPermission.value,
        expiresIn: 'never'
      }
    })

    markAsShared(props.item, res.share)
    emit('created', res.share)
    success('Shared with user', `Successfully shared with ${targetUser.value}`)
    emit('close')
  } catch (err) {
    error('Share error', err?.data?.statusMessage || 'Failed to share with user')
  } finally {
    isCreating.value = false
  }
}

const copyLink = async () => {
  if (await copyToClipboard(fullShareUrl.value)) {
    success('Link copied', 'Share link copied to clipboard')
  }
}
</script>
