<template>
  <div v-if="totalCount > 0" class="fixed bottom-5 right-5 z-40 font-sans select-none animate-in fade-in slide-in-from-bottom-5 duration-200">
    <!-- MINIMIZED VIEW (Floating Pill) -->
    <div 
      v-if="!isWidgetExpanded"
      @click="isWidgetExpanded = true"
      class="glass-card bg-white/80 dark:bg-[#18181b]/80 border border-black/10 dark:border-white/15 rounded-2xl p-3 shadow-2xl flex items-center gap-3 cursor-pointer hover:border-[var(--accent-color)]/60 transition-all hover:scale-[1.02] active:scale-[0.98] min-w-[280px]"
    >
      <!-- Status Icon with Ring Indicator -->
      <div class="relative w-8 h-8 flex items-center justify-center shrink-0">
        <Loader2Icon v-if="hasActiveOrQueued" class="w-5 h-5 accent-text animate-spin" />
        <CheckCircle2Icon v-else-if="errorCount === 0" class="w-5 h-5 text-emerald-500" />
        <AlertTriangleIcon v-else class="w-5 h-5 text-amber-500" />
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0 flex flex-col">
        <div class="flex items-center justify-between text-xs font-bold text-[#0f172a] dark:text-[#fafafa]">
          <span class="truncate">
            {{ hasActiveOrQueued ? `Uploading ${completedCount}/${totalCount}` : (errorCount > 0 ? `${errorCount} Failed` : 'Uploads Finished') }}
          </span>
          <span class="font-mono text-[11px] accent-text">{{ overallProgress }}%</span>
        </div>
        
        <!-- Speed & Progress Bar -->
        <div class="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden my-1">
          <div 
            class="h-full accent-bg transition-all duration-300 rounded-full"
            :style="{ width: `${overallProgress}%` }"
          ></div>
        </div>

        <span v-if="hasActiveOrQueued && totalSpeed > 0" class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] truncate font-medium">
          {{ formatSpeed(totalSpeed) }}
        </span>
      </div>

      <!-- Expand Chevron -->
      <ChevronUpIcon class="w-4 h-4 text-[#64748b] dark:text-[#cbd5e1] shrink-0" />
    </div>

    <!-- EXPANDED VIEW (Glassmorphic Drawer) -->
    <div 
      v-else
      class="glass-modal bg-white/95 dark:bg-[#18181b]/95 border border-black/10 dark:border-white/15 rounded-2xl shadow-2xl w-[380px] sm:w-[420px] flex flex-col overflow-hidden transition-all duration-200"
    >
      <!-- Header -->
      <div class="p-3.5 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg accent-bg-alpha border border-[var(--accent-color)]/30">
            <UploadCloudIcon class="w-4 h-4 accent-text" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-1.5">
              <span>Uploads</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-black/10 dark:bg-white/10">
                {{ completedCount }}/{{ totalCount }}
              </span>
            </h4>
            <span v-if="hasActiveOrQueued && totalSpeed > 0" class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] font-medium block">
              {{ formatSpeed(totalSpeed) }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button 
            @click="isWidgetExpanded = false" 
            class="p-1.5 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Minimize"
          >
            <ChevronDownIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Overall Progress Bar Header -->
      <div class="px-4 py-2 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5 flex flex-col gap-1">
        <div class="flex items-center justify-between text-[11px]">
          <span class="text-[#64748b] dark:text-[#cbd5e1] font-medium">Overall Progress</span>
          <span class="font-mono font-bold accent-text">{{ overallProgress }}%</span>
        </div>
        <div class="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div 
            class="h-full accent-bg transition-all duration-300 rounded-full"
            :style="{ width: `${overallProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- Uploads Scrollable File List -->
      <div class="max-h-[260px] overflow-y-auto divide-y divide-black/5 dark:divide-white/5 p-1">
        <div 
          v-for="item in uploadQueue" 
          :key="item.id"
          class="p-2.5 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-xs"
        >
          <!-- Category File Icon -->
          <div class="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10">
            <VideoIcon v-if="isVideo(item.name)" class="w-4 h-4 text-purple-500" />
            <ImageIcon v-else-if="isImage(item.name)" class="w-4 h-4 text-blue-500" />
            <MusicIcon v-else-if="isAudio(item.name)" class="w-4 h-4 text-emerald-500" />
            <FileIcon v-else class="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>

          <!-- File Info & Progress -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="font-semibold text-[#0f172a] dark:text-[#fafafa] truncate max-w-[190px]" :title="item.name">
                {{ item.name }}
              </span>
              <span class="text-[10px] font-mono text-[#64748b] dark:text-[#cbd5e1] shrink-0">
                {{ formatBytes(item.size) }}
              </span>
            </div>

            <!-- Single Item Progress Bar -->
            <div class="w-full bg-black/10 dark:bg-white/10 h-1 rounded-full overflow-hidden mb-1">
              <div 
                class="h-full rounded-full transition-all duration-200"
                :class="[
                  item.status === 'completed' ? 'bg-emerald-500' : (item.status === 'error' ? 'bg-red-500' : (item.status === 'paused' ? 'bg-amber-500' : 'accent-bg'))
                ]"
                :style="{ width: `${item.progress}%` }"
              ></div>
            </div>

            <!-- Status Label / Speed / ETA -->
            <div class="flex items-center justify-between text-[10px] text-[#64748b] dark:text-[#cbd5e1]">
              <span v-if="item.status === 'uploading'" class="accent-text font-medium flex items-center gap-1">
                <span>{{ formatSpeed(item.speed) }}</span>
                <span v-if="item.etaSeconds > 0">• ~{{ formatEta(item.etaSeconds) }}</span>
              </span>
              <span v-else-if="item.status === 'completed'" class="text-emerald-600 dark:text-emerald-400 font-medium">Completed</span>
              <span v-else-if="item.status === 'paused'" class="text-amber-600 dark:text-amber-400 font-medium">Paused</span>
              <span v-else-if="item.status === 'error'" class="text-red-500 font-medium truncate" :title="item.errorMessage || ''">
                {{ item.errorMessage || 'Failed' }}
              </span>
              <span v-else class="text-slate-400 font-medium">Queued...</span>

              <span class="font-mono text-[10px]">{{ item.progress }}%</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 shrink-0">
            <!-- Pause / Resume -->
            <button 
              v-if="item.status === 'uploading'" 
              @click="pauseUpload(item.id)" 
              class="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/15 text-[#64748b] dark:text-[#cbd5e1] transition-colors cursor-pointer"
              title="Pause Upload"
            >
              <PauseIcon class="w-3.5 h-3.5" />
            </button>
            <button 
              v-else-if="item.status === 'paused' || item.status === 'error'" 
              @click="resumeUpload(item.id)" 
              class="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/15 accent-text transition-colors cursor-pointer"
              title="Resume / Retry"
            >
              <PlayIcon class="w-3.5 h-3.5 accent-fill accent-text" />
            </button>

            <!-- Cancel -->
            <button 
              @click="cancelUpload(item.id)" 
              class="p-1.5 rounded-lg hover:bg-red-500/15 text-[#64748b] dark:text-[#cbd5e1] hover:text-red-500 transition-colors cursor-pointer"
              title="Cancel Upload"
            >
              <XIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Bar -->
      <div class="p-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5 text-[11px]">
        <button 
          v-if="completedCount > 0"
          @click="clearCompleted"
          class="text-xs accent-text hover:brightness-90 font-semibold transition-colors cursor-pointer"
        >
          Clear Finished ({{ completedCount }})
        </button>
        <span v-else class="text-[#64748b] dark:text-[#cbd5e1] text-[10px]">
          Chunked Transfer Active
        </span>

        <button 
          @click="isWidgetExpanded = false"
          class="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#0f172a] dark:text-white font-medium transition-all"
        >
          Hide
        </button>
      </div>
    </div>

    <!-- Conflict Resolution Modal (Pauses upload until user decides) -->
    <UploadConflictModal 
      :show="!!activeConflict"
      :conflict="activeConflict"
      :remaining-count="pendingConflicts.length"
      @resolve="resolveConflict"
    />
  </div>
</template>

<script setup>
import { 
  UploadCloud as UploadCloudIcon,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  X as XIcon,
  Pause as PauseIcon,
  Play as PlayIcon,
  RefreshCw as RefreshCwIcon,
  CheckCircle2 as CheckCircle2Icon,
  AlertTriangle as AlertTriangleIcon,
  Loader2 as Loader2Icon,
  File as FileIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon
} from 'lucide-vue-next'
import { useUploadManager } from '../../composables/useUploadManager'
import { useFileHelpers } from '../../composables/useFileHelpers'
import UploadConflictModal from '../modals/UploadConflictModal.vue'

const { 
  uploadQueue, 
  isWidgetExpanded, 
  activeConflict,
  pendingConflicts,
  activeCount, 
  completedCount, 
  errorCount, 
  totalCount, 
  hasActiveOrQueued, 
  totalSpeed, 
  overallProgress,
  resolveConflict,
  pauseUpload,
  resumeUpload,
  cancelUpload,
  clearCompleted 
} = useUploadManager()

const { formatBytes, isImage, isVideo, isAudio } = useFileHelpers()

const formatSpeed = (bytesPerSec) => {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s'
  if (bytesPerSec >= 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
  }
  return `${(bytesPerSec / 1024).toFixed(0)} KB/s`
}

const formatEta = (seconds) => {
  if (!seconds || seconds <= 0) return '0s'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  return `${hours}h ${mins % 60}m`
}
</script>
