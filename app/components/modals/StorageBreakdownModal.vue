<template>
  <Transition name="modal-fade">
    <div 
      v-if="show" 
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none"
      @click.self="$emit('close')"
    >
      <div 
        class="glass-modal border border-white/20 dark:border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <!-- Modal Header -->
        <div class="h-16 px-6 border-b border-[#e2e8f0] dark:border-[#27272a] flex items-center justify-between glass-header shrink-0">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <HardDriveIcon class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa]">Storage Analytics &amp; Breakdown</h3>
              <p class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Inspect disk space usage, category distribution, and large files</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button 
              @click="loadBreakdown" 
              :disabled="loading"
              class="p-2 rounded-xl text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCwIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            </button>

            <button 
              @click="$emit('close')" 
              class="p-2 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <XIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Loading State -->
          <div v-if="loading && !data" class="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2Icon class="w-8 h-8 animate-spin accent-text" />
            <span class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Calculating storage metrics...</span>
          </div>

          <div v-else-if="data" class="space-y-6">
            <!-- 1. Overall Storage Meter Card -->
            <div class="p-5 rounded-2xl glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 shadow-md space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span class="text-xs text-[#64748b] dark:text-[#cbd5e1] font-semibold uppercase tracking-wider">Total Usage</span>
                  <div class="flex items-baseline gap-2 mt-0.5">
                    <span class="text-2xl font-black text-[#0f172a] dark:text-[#fafafa]">{{ formatBytes(data.totalBytes) }}</span>
                    <span class="text-xs text-[#64748b] dark:text-[#cbd5e1]">used of {{ formatBytes(data.maxStorageBytes) }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-4 text-xs font-semibold text-[#64748b] dark:text-[#cbd5e1]">
                  <span>{{ data.totalFiles }} Files</span>
                  <span>•</span>
                  <span>{{ data.totalFolders }} Folders</span>
                  <span>•</span>
                  <span class="accent-text font-bold">{{ data.quotaUsedPercentage }}% Quota</span>
                </div>
              </div>

              <!-- Multi-Category Stacked Progress Bar -->
              <div class="w-full h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden flex shadow-inner">
                <div 
                  v-for="cat in data.categories" 
                  :key="cat.id"
                  class="h-full transition-all duration-500 hover:opacity-80 cursor-pointer"
                  :style="{ width: `${Math.max(1, cat.percentage)}%`, backgroundColor: cat.color }"
                  :title="`${cat.name}: ${formatBytes(cat.bytes)} (${cat.percentage}%)`"
                ></div>
              </div>

              <!-- Category Legend Pills -->
              <div class="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <div 
                  v-for="cat in data.categories" 
                  :key="cat.id" 
                  class="flex items-center gap-1.5"
                >
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: cat.color }"></span>
                  <span class="text-[#0f172a] dark:text-[#fafafa] font-medium">{{ cat.name }}</span>
                  <span class="text-[#64748b] dark:text-[#cbd5e1] text-[11px]">({{ cat.percentage }}%)</span>
                </div>
              </div>
            </div>

            <!-- 2. Category Distribution Grid -->
            <div>
              <h4 class="text-xs font-bold text-[#64748b] dark:text-[#cbd5e1] uppercase tracking-wider mb-3">Category Breakdown</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div 
                  v-for="cat in data.categories" 
                  :key="cat.id"
                  class="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-[#e2e8f0]/60 dark:border-white/10 shadow-xs flex flex-col justify-between"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-[#0f172a] dark:text-[#fafafa] truncate">{{ cat.name }}</span>
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: cat.color }"></span>
                  </div>
                  <div class="space-y-0.5">
                    <span class="text-lg font-bold text-[#0f172a] dark:text-[#fafafa] block">{{ formatBytes(cat.bytes) }}</span>
                    <span class="text-[11px] text-[#64748b] dark:text-[#cbd5e1]">{{ cat.count }} file(s)</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Top 10 Space Consumers (Largest Files) -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-[#64748b] dark:text-[#cbd5e1] uppercase tracking-wider">Top Space Consumers</h4>
              <div class="rounded-2xl border border-[#e2e8f0] dark:border-[#27272a] bg-white/60 dark:bg-white/5 overflow-hidden shadow-xs">
                <div class="divide-y divide-[#e2e8f0] dark:divide-[#27272a]">
                  <div 
                    v-for="(file, idx) in data.largestFiles" 
                    :key="file.relativePath"
                    class="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs"
                  >
                    <!-- File Info -->
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="w-5 text-center font-mono text-[11px] font-bold text-[#94a3b8] dark:text-[#52525b] shrink-0">#{{ idx + 1 }}</span>
                      <div class="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 shrink-0">
                        <FileIcon class="w-4 h-4 text-indigo-500" />
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="font-semibold text-[#0f172a] dark:text-[#fafafa] truncate max-w-[220px] sm:max-w-md">{{ file.name }}</span>
                        <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] font-mono truncate max-w-sm">/{{ file.relativePath }}</span>
                      </div>
                    </div>

                    <!-- Size & Quick Preview -->
                    <div class="flex items-center gap-3 shrink-0">
                      <span class="font-bold font-mono text-[#0f172a] dark:text-[#fafafa]">{{ formatBytes(file.size) }}</span>
                      <button 
                        @click="handleOpenFile(file)"
                        class="p-1.5 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        title="Preview File"
                      >
                        <EyeIcon class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="h-14 px-6 border-t border-[#e2e8f0] dark:border-[#27272a] glass-header flex items-center justify-end shrink-0">
          <button 
            @click="$emit('close')" 
            class="px-5 py-2 accent-bg accent-bg-hover text-white text-xs font-bold rounded-xl shadow-md active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { 
  HardDrive as HardDriveIcon, 
  RefreshCw as RefreshCwIcon, 
  X as XIcon, 
  Loader2 as Loader2Icon, 
  File as FileIcon, 
  Eye as EyeIcon 
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'open-file'])

const { formatBytes } = useFileHelpers()
const { error } = useToast()

const loading = ref(false)
const data = ref(null)

const loadBreakdown = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/storage-breakdown')
    data.value = res
  } catch (err) {
    error('Analytics Error', err?.data?.statusMessage || 'Failed to load storage breakdown')
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadBreakdown()
  }
})

const handleOpenFile = (file) => {
  emit('open-file', file)
  emit('close')
}
</script>
