<template>
  <div 
    class="min-h-screen text-[#0f172a] dark:text-[#fafafa] flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-200 font-sans relative overflow-x-hidden"
    :class="hasCustomBackground ? 'bg-transparent' : 'bg-[#f8fafc] dark:bg-[#09090b]'"
  >
    <!-- Background Wallpaper Layer (If enabled in server settings) -->
    <div 
      v-if="hasCustomBackground"
      class="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <div 
        class="w-full h-full bg-cover bg-center transition-all duration-300 transform-gpu"
        :style="backgroundStyle"
      ></div>
    </div>

    <!-- Top Branding Navbar -->
    <header class="h-16 px-6 border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 flex items-center justify-between glass-header relative z-10">
      <div class="flex items-center gap-3">
        <img 
          v-if="shareData?.serverBranding?.logo" 
          :src="shareData.serverBranding.logo" 
          alt="Logo" 
          class="w-8 h-8 rounded-xl object-contain shadow-xs"
        />
        <div v-else class="w-8 h-8 rounded-xl accent-bg flex items-center justify-center text-white font-bold text-sm shadow-xs">
          FC
        </div>
        <span class="font-bold text-base tracking-tight">{{ shareData?.serverBranding?.siteName || 'FluxCloud CDN' }}</span>
      </div>

      <div class="flex items-center gap-2 text-xs text-[#64748b] dark:text-[#71717a]">
        <ShieldCheckIcon class="w-4 h-4 text-emerald-500" />
        <span>End-to-End Secure Sharing</span>
      </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 relative z-10">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center gap-3">
        <Loader2Icon class="w-10 h-10 animate-spin accent-text" />
        <span class="text-sm font-medium text-[#64748b] dark:text-[#71717a]">Decrypting share metadata...</span>
      </div>

      <!-- Error State (Expired / Non-existent / Limit reached) -->
      <div 
        v-else-if="errorMsg" 
        class="max-w-md w-full p-8 rounded-2xl border shadow-xl text-center space-y-4"
        :class="hasCustomBackground ? 'glass-modal border-white/20 dark:border-white/10' : 'bg-white dark:bg-[#12131a] border-[#e2e8f0] dark:border-[#27272a]'"
      >
        <div class="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-500 w-16 h-16 mx-auto flex items-center justify-center">
          <AlertCircleIcon class="w-8 h-8" />
        </div>
        <h3 class="text-lg font-bold text-[#0f172a] dark:text-[#fafafa]">Link Unavailable</h3>
        <p class="text-xs text-[#64748b] dark:text-[#71717a] leading-relaxed">{{ errorMsg }}</p>
      </div>

      <!-- Password Lock Screen -->
      <div 
        v-else-if="shareData && !unlocked" 
        class="max-w-md w-full p-8 rounded-2xl border shadow-2xl space-y-6"
        :class="hasCustomBackground ? 'glass-modal border-white/20 dark:border-white/10' : 'bg-white dark:bg-[#12131a] border-[#e2e8f0] dark:border-[#27272a]'"
      >
        <div class="flex flex-col items-center text-center space-y-2">
          <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-500">
            <LockIcon class="w-8 h-8" />
          </div>
          <h3 class="text-lg font-bold text-[#0f172a] dark:text-[#fafafa]">Password Protected</h3>
          <p class="text-xs text-[#64748b] dark:text-[#71717a]">This link is password-protected. Please enter the password to view and download.</p>
        </div>

        <form @submit.prevent="verifyPassword" class="space-y-4">
          <div class="space-y-1.5">
            <input 
              v-model="passwordInput" 
              type="password" 
              placeholder="Enter password" 
              class="w-full px-4 py-3 bg-[#f8fafc] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] rounded-xl text-sm text-[#0f172a] dark:text-[#fafafa] placeholder-[#94a3b8] focus:outline-none focus:border-indigo-500 text-center"
              autofocus
            />
            <p v-if="verifyError" class="text-xs text-red-500 font-medium text-center">{{ verifyError }}</p>
          </div>

          <button 
            type="submit" 
            :disabled="verifying || !passwordInput" 
            class="w-full py-3 accent-bg accent-bg-hover disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Loader2Icon v-if="verifying" class="w-4 h-4 animate-spin" />
            <KeyIcon v-else class="w-4 h-4" />
            <span>Unlock Content</span>
          </button>
        </form>
      </div>

      <!-- Unlocked / Public Share Presentation -->
      <div v-else-if="shareData" class="max-w-5xl w-full flex flex-col gap-6">
        <!-- Top Info Header Card -->
        <div 
          class="p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
          :class="hasCustomBackground ? 'glass-modal border-white/20 dark:border-white/10' : 'bg-white dark:bg-[#12131a] border-[#e2e8f0] dark:border-[#27272a]'"
        >
          <div class="flex items-center gap-4 min-w-0 w-full md:w-auto">
            <div class="p-4 rounded-2xl bg-[#f1f5f9] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] shrink-0">
              <FolderIcon v-if="shareData.isDirectory" class="w-10 h-10 accent-text" />
              <FileIcon v-else class="w-10 h-10 text-indigo-500" />
            </div>
            <div class="flex flex-col min-w-0">
              <h2 class="text-lg font-bold text-[#0f172a] dark:text-[#fafafa] truncate max-w-md">{{ shareData.fileName }}</h2>
              <div class="flex items-center gap-2 text-xs text-[#64748b] dark:text-[#71717a] mt-1">
                <span>{{ shareData.isDirectory ? 'Shared Folder' : formatBytes(shareData.size) }}</span>
                <span>•</span>
                <span>Shared {{ formatDate(shareData.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end flex-wrap">
            <button 
              v-if="shareData.isDirectory && shareData.allowUploads"
              @click="showUploadModal = true" 
              class="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <UploadCloudIcon class="w-4 h-4" />
              <span>Upload Files</span>
            </button>

            <a 
              v-if="!shareData.viewOnly && !shareData.hideContents"
              :href="downloadUrl" 
              class="flex items-center justify-center gap-2 px-6 py-3 accent-bg accent-bg-hover rounded-xl text-sm font-bold text-white transition-all shadow-lg active:scale-95"
            >
              <DownloadIcon class="w-4 h-4" />
              <span>{{ shareData.isDirectory ? 'Download Full ZIP' : 'Download File' }}</span>
            </a>
            <span v-else-if="shareData.viewOnly" class="px-4 py-2 rounded-xl bg-[#f1f5f9] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] text-xs text-[#64748b] dark:text-[#a1a1aa]">
              View Only
            </span>
          </div>
        </div>

        <!-- 1A. BLIND FILE DROP VIEW (When hideContents is enabled) -->
        <div 
          v-if="shareData.isDirectory && shareData.hideContents"
          class="rounded-3xl border shadow-2xl p-8 sm:p-14 text-center flex flex-col items-center justify-center max-w-2xl mx-auto glass-card border-white/20 dark:border-white/10 bg-white/80 dark:bg-[#18181b]/80 animate-in fade-in zoom-in-95 duration-200"
        >
          <div class="p-5 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 mb-5 shadow-lg">
            <UploadCloudIcon class="w-14 h-14" />
          </div>
          <h3 class="text-2xl font-bold text-[#0f172a] dark:text-[#fafafa] mb-2">
            File Drop Box
          </h3>
          <p class="text-xs sm:text-sm text-[#64748b] dark:text-[#cbd5e1] mb-8 max-w-md">
            You can securely upload files directly into <strong>{{ shareData.fileName }}</strong>. Existing files in this folder are kept private.
          </p>

          <button 
            @click="showUploadModal = true" 
            class="px-8 py-3.5 rounded-2xl accent-bg accent-bg-hover text-white font-bold text-sm shadow-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <UploadCloudIcon class="w-5 h-5" />
            <span>Select &amp; Upload Files</span>
          </button>
        </div>

        <!-- 1B. STANDARD SHARED FOLDER FILE BROWSER (If Directory and not blind drop) -->
        <div 
          v-else-if="shareData.isDirectory" 
          class="rounded-2xl border shadow-xl overflow-hidden flex flex-col"
          :class="hasCustomBackground ? 'glass-modal border-white/20 dark:border-white/10' : 'bg-white dark:bg-[#12131a] border-[#e2e8f0] dark:border-[#27272a]'"
        >
          <!-- Folder Navigation Bar & Search -->
          <div class="p-4 border-b border-[#e2e8f0] dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/5 dark:bg-white/5">
            <!-- Breadcrumbs -->
            <div class="flex items-center gap-1.5 text-xs text-[#64748b] dark:text-[#cbd5e1] overflow-x-auto py-1">
              <button 
                @click="navigateToSubpath('')" 
                class="hover:text-[#0f172a] dark:hover:text-[#fafafa] font-bold flex items-center gap-1 cursor-pointer"
              >
                <FolderIcon class="w-3.5 h-3.5 accent-text" />
                <span>{{ shareData.fileName }}</span>
              </button>
              <template v-for="(crumb, idx) in breadcrumbParts" :key="crumb.path">
                <span>/</span>
                <button 
                  @click="navigateToSubpath(crumb.path)" 
                  class="hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-colors cursor-pointer"
                  :class="{ 'font-bold text-[#0f172a] dark:text-[#fafafa]': idx === breadcrumbParts.length - 1 }"
                >
                  {{ crumb.name }}
                </button>
              </template>
            </div>

            <!-- Search Filter Bar -->
            <div class="flex items-center gap-2">
              <div class="relative w-full sm:w-56">
                <input 
                  v-model="fileSearch" 
                  type="text" 
                  placeholder="Filter files..." 
                  class="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] rounded-xl text-xs text-[#0f172a] dark:text-[#fafafa] placeholder-[#94a3b8] focus:outline-none focus:border-indigo-500"
                />
                <SearchIcon class="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <!-- Loading Files State -->
          <div v-if="loadingFiles" class="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2Icon class="w-6 h-6 animate-spin accent-text" />
            <span class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Loading folder items...</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredFiles.length === 0" class="flex flex-col items-center justify-center py-16 text-center text-[#64748b] dark:text-[#71717a] space-y-2">
            <FolderIcon class="w-10 h-10 opacity-40 mb-1" />
            <span class="text-xs font-semibold">No files found</span>
            <p class="text-[11px] max-w-xs">{{ fileSearch ? 'No items match your search filter.' : 'This folder is currently empty.' }}</p>
          </div>

          <!-- Files Table / List -->
          <div v-else class="divide-y divide-[#e2e8f0] dark:divide-[#27272a] max-h-[500px] overflow-y-auto">
            <div 
              v-for="item in filteredFiles" 
              :key="item.relativePath"
              class="p-3.5 sm:px-5 flex items-center justify-between gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs select-none"
            >
              <!-- Left: File / Folder Name & Icon -->
              <div 
                class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                @click="handleItemClick(item)"
              >
                <div class="p-2 rounded-xl shrink-0" :class="item.isDirectory ? 'bg-indigo-500/10 text-indigo-500' : 'bg-black/5 dark:bg-white/10 text-[#64748b] dark:text-[#cbd5e1]'">
                  <FolderIcon v-if="item.isDirectory" class="w-4 h-4 accent-text" />
                  <FileIcon v-else class="w-4 h-4" />
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-semibold text-[#0f172a] dark:text-[#fafafa] truncate hover:text-indigo-500 transition-colors">{{ item.name }}</span>
                  <span class="text-[10px] text-[#64748b] dark:text-[#71717a] sm:hidden">{{ item.isDirectory ? '--' : formatBytes(item.size) }}</span>
                </div>
              </div>

              <!-- Center: Date & Size (Desktop) -->
              <div class="hidden sm:flex items-center gap-6 text-[11px] text-[#64748b] dark:text-[#cbd5e1] shrink-0 font-mono">
                <span>{{ formatDate(item.modifiedAt) }}</span>
                <span class="w-20 text-right">{{ item.isDirectory ? '--' : formatBytes(item.size) }}</span>
              </div>

              <!-- Right: Quick Actions -->
              <div class="flex items-center gap-1.5 shrink-0">
                <!-- Preview Button for files (Hidden if view-only) -->
                <button 
                  v-if="!item.isDirectory && !shareData.viewOnly"
                  @click="openItemPreview(item)"
                  class="p-1.5 rounded-lg border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white transition-colors cursor-pointer"
                  title="Preview File"
                >
                  <EyeIcon class="w-3.5 h-3.5" />
                </button>

                <!-- Download Button (Hidden if view-only) -->
                <a 
                  v-if="!shareData.viewOnly"
                  :href="item.downloadUrl"
                  class="p-1.5 rounded-lg border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white transition-colors cursor-pointer"
                  :title="item.isDirectory ? 'Download Subfolder ZIP' : 'Download File'"
                >
                  <DownloadIcon class="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <!-- Table Footer -->
          <div class="p-3 px-5 border-t border-[#e2e8f0] dark:border-[#27272a] bg-black/5 dark:bg-white/5 flex items-center justify-between text-[11px] text-[#64748b] dark:text-[#cbd5e1]">
            <span>{{ folderFiles.length }} item(s) in this folder</span>
            <span>Total size: {{ formatBytes(totalFolderSize) }}</span>
          </div>
        </div>

        <!-- 2. IN-BROWSER PREVIEW BOX (If Single Shared File) -->
        <div 
          v-if="!shareData.isDirectory" 
          class="p-4 rounded-2xl border shadow-xl overflow-hidden flex items-center justify-center min-h-[360px]"
          :class="hasCustomBackground ? 'glass-modal border-white/20 dark:border-white/10' : 'bg-white dark:bg-[#12131a] border-[#e2e8f0] dark:border-[#27272a]'"
        >
          <!-- Image -->
          <img 
            v-if="isImage(shareData.fileName)" 
            :src="inlineUrl" 
            :alt="shareData.fileName" 
            class="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md"
          />

          <!-- Video -->
          <video 
            v-else-if="isVideo(shareData.fileName)" 
            :src="inlineUrl" 
            controls 
            class="max-h-[60vh] max-w-full rounded-xl shadow-md bg-black"
          ></video>

          <!-- Audio -->
          <div v-else-if="isAudio(shareData.fileName)" class="flex flex-col items-center justify-center p-8 max-w-md w-full">
            <MusicIcon class="w-16 h-16 accent-text mb-4" />
            <audio :src="inlineUrl" controls class="w-full"></audio>
          </div>

          <!-- PDF -->
          <iframe 
            v-else-if="isPdf(shareData.fileName)" 
            :src="inlineUrl" 
            class="w-full h-[65vh] rounded-xl border-0"
          ></iframe>

          <!-- Fallback -->
          <div v-else class="flex flex-col items-center justify-center text-center p-8 text-[#64748b] dark:text-[#71717a]">
            <FileIcon class="w-12 h-12 text-[#94a3b8] dark:text-[#52525b] mb-2" />
            <p class="text-xs">Click download above to save this file to your computer.</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Upload Modal (Same as in Dashboard) -->
    <UploadModal 
      :show="showUploadModal"
      :current-path="currentSubpath ? `${shareData?.fileName}/${currentSubpath}` : (shareData?.fileName || '')"
      :uploading="isUploading"
      @close="showUploadModal = false"
      @upload="handleGuestUploadFromModal"
    />

    <!-- Individual File Preview Lightbox (From inside shared folder) -->
    <Transition name="modal-fade">
      <div 
        v-if="activePreviewFile" 
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none"
        @click.self="activePreviewFile = null"
      >
        <div class="w-full max-w-5xl flex items-center justify-between py-2.5 px-4 rounded-xl glass-modal border border-white/20 dark:border-white/10 shrink-0 text-sm mb-3 shadow-2xl">
          <div class="flex items-center gap-3 min-w-0">
            <FileIcon class="w-5 h-5 text-indigo-500 shrink-0" />
            <div class="flex flex-col min-w-0">
              <span class="font-semibold text-[#0f172a] dark:text-[#fafafa] truncate max-w-md">{{ activePreviewFile.name }}</span>
              <span class="text-[11px] text-[#64748b] dark:text-[#cbd5e1]">{{ formatBytes(activePreviewFile.size) }} • {{ formatDate(activePreviewFile.modifiedAt) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <a 
              v-if="!shareData.viewOnly"
              :href="activePreviewFile.downloadUrl" 
              class="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold text-white transition-all active:scale-95 shadow-sm"
            >
              <DownloadIcon class="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button 
              @click="activePreviewFile = null" 
              class="p-1.5 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            >
              <XIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="w-full max-w-5xl flex-1 rounded-2xl bg-white dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#27272a] flex items-center justify-center overflow-hidden relative p-4 shadow-2xl">
          <img 
            v-if="isImage(activePreviewFile.name)" 
            :src="activePreviewFile.inlineUrl" 
            :alt="activePreviewFile.name" 
            class="max-h-[70vh] max-w-full rounded-xl object-contain shadow-md"
          />
          <video 
            v-else-if="isVideo(activePreviewFile.name)" 
            :src="activePreviewFile.inlineUrl" 
            controls 
            class="max-h-[70vh] max-w-full rounded-xl shadow-md bg-black"
          ></video>
          <div v-else-if="isAudio(activePreviewFile.name)" class="flex flex-col items-center justify-center p-8 max-w-md w-full">
            <MusicIcon class="w-16 h-16 accent-text mb-4" />
            <audio :src="activePreviewFile.inlineUrl" controls class="w-full"></audio>
          </div>
          <iframe 
            v-else-if="isPdf(activePreviewFile.name)" 
            :src="activePreviewFile.inlineUrl" 
            class="w-full h-[70vh] rounded-xl border-0"
          ></iframe>
          <div v-else class="flex flex-col items-center justify-center text-center p-8 text-[#64748b] dark:text-[#71717a]">
            <FileIcon class="w-12 h-12 text-[#94a3b8] dark:text-[#52525b] mb-2" />
            <p class="text-xs">Click download above to save this file to your computer.</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Footer -->
    <footer class="py-4 border-t border-[#e2e8f0]/80 dark:border-[#27272a]/80 text-center text-xs text-[#64748b] dark:text-[#71717a] relative z-10 glass-header">
      Powered by FluxCloud CDN • Fast, Private File Sharing
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  ShieldCheck as ShieldCheckIcon, 
  AlertCircle as AlertCircleIcon, 
  Lock as LockIcon, 
  Key as KeyIcon, 
  Folder as FolderIcon, 
  File as FileIcon, 
  Download as DownloadIcon, 
  Music as MusicIcon, 
  Loader2 as Loader2Icon,
  UploadCloud as UploadCloudIcon,
  Search as SearchIcon,
  Eye as EyeIcon,
  X as XIcon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'
import UploadModal from '../modals/UploadModal.vue'

const props = defineProps({
  shareId: { type: String, required: true }
})

const { formatBytes, formatDate, isImage, isVideo, isAudio, isPdf } = useFileHelpers()
const { success, error } = useToast()

const shareData = ref(null)
const loading = ref(true)
const errorMsg = ref('')
const unlocked = ref(false)
const passwordInput = ref('')
const verifying = ref(false)
const verifyError = ref('')

const hasCustomBackground = computed(() => {
  return !!(shareData.value?.serverBranding?.sharePageBackgroundEnabled && shareData.value?.serverBranding?.backgroundImage)
})

const backgroundStyle = computed(() => {
  if (!hasCustomBackground.value) return {}
  const b = shareData.value.serverBranding
  return {
    backgroundImage: `url(${b.backgroundImage})`,
    filter: `blur(${b.backgroundBlur ?? 2}px) brightness(${b.backgroundBrightness ?? 100}%)`,
    transform: 'scale(1.05)'
  }
})

// Folder Browser State
const folderFiles = ref([])
const currentSubpath = ref('')
const loadingFiles = ref(false)
const fileSearch = ref('')
const activePreviewFile = ref(null)

const showUploadModal = ref(false)
const isUploading = ref(false)

const breadcrumbParts = computed(() => {
  if (!currentSubpath.value) return []
  const parts = currentSubpath.value.split('/').filter(Boolean)
  const result = []
  let accumulated = ''
  for (const part of parts) {
    accumulated = accumulated ? `${accumulated}/${part}` : part
    result.push({ name: part, path: accumulated })
  }
  return result
})

const filteredFiles = computed(() => {
  if (!fileSearch.value) return folderFiles.value
  const q = fileSearch.value.toLowerCase()
  return folderFiles.value.filter(f => f.name.toLowerCase().includes(q))
})

const totalFolderSize = computed(() => {
  return folderFiles.value.reduce((acc, f) => acc + (f.size || 0), 0)
})

const loadFolderFiles = async (subpath = '') => {
  if (!shareData.value?.isDirectory) return
  loadingFiles.value = true
  try {
    const pwdParam = passwordInput.value ? `&pwd=${encodeURIComponent(passwordInput.value)}` : ''
    const subParam = subpath ? `&subpath=${encodeURIComponent(subpath)}` : ''
    const res = await $fetch(`/api/share/${props.shareId}/files?t=${Date.now()}${subParam}${pwdParam}`)
    folderFiles.value = res.files || []
    currentSubpath.value = res.currentPath || ''
  } catch (err) {
    console.error('Failed to load shared folder files:', err)
  } finally {
    loadingFiles.value = false
  }
}

const navigateToSubpath = (path) => {
  fileSearch.value = ''
  loadFolderFiles(path)
}

const handleItemClick = (item) => {
  if (item.isDirectory) {
    navigateToSubpath(item.relativePath)
  } else if (!shareData.value?.viewOnly) {
    openItemPreview(item)
  }
}

const openItemPreview = (item) => {
  if (shareData.value?.viewOnly) return
  activePreviewFile.value = item
}

const handleGuestUploadFromModal = async (fileList) => {
  if (!fileList || fileList.length === 0) return
  isUploading.value = true

  const formData = new FormData()
  for (let i = 0; i < fileList.length; i++) {
    formData.append('file', fileList[i])
  }

  try {
    const headers = {}
    if (passwordInput.value) {
      headers['x-share-password'] = passwordInput.value
    }

    const subParam = currentSubpath.value ? `?subpath=${encodeURIComponent(currentSubpath.value)}` : ''
    await $fetch(`/api/share/${props.shareId}/upload${subParam}`, {
      method: 'POST',
      headers,
      body: formData
    })

    showUploadModal.value = false
    await loadFolderFiles(currentSubpath.value)
    success('Upload complete', `Successfully uploaded ${fileList.length} files`)
  } catch (err) {
    error('Upload failed', err?.data?.statusMessage || 'Failed to upload files to shared folder')
  } finally {
    isUploading.value = false
  }
}

const loadShare = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`/api/share/${props.shareId}`)
    shareData.value = res
    if (!res.hasPassword) {
      unlocked.value = true
      if (res.isDirectory) {
        await loadFolderFiles('')
      }
    }
  } catch (err) {
    errorMsg.value = err?.data?.statusMessage || 'This share link does not exist, has expired, or exceeded download limits.'
  } finally {
    loading.value = false
  }
}

const verifyPassword = async () => {
  verifying.value = true
  verifyError.value = ''
  try {
    await $fetch(`/api/share/${props.shareId}/verify`, {
      method: 'POST',
      body: { password: passwordInput.value }
    })
    unlocked.value = true
    if (shareData.value?.isDirectory) {
      await loadFolderFiles('')
    }
  } catch (err) {
    verifyError.value = 'Incorrect password. Please try again.'
  } finally {
    verifying.value = false
  }
}

const downloadUrl = computed(() => {
  const pwdParam = passwordInput.value ? `&pwd=${encodeURIComponent(passwordInput.value)}` : ''
  return `/api/share/${props.shareId}/download?download=1${pwdParam}`
})

const inlineUrl = computed(() => {
  const pwdParam = passwordInput.value ? `&pwd=${encodeURIComponent(passwordInput.value)}` : ''
  return `/api/share/${props.shareId}/download?inline=1${pwdParam}`
})

onMounted(() => {
  loadShare()
})
</script>
