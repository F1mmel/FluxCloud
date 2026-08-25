<template>
  <Transition name="modal">
    <div 
      v-if="show" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="handleResolve('skip')"
    >
      <div 
        class="bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <!-- Modal Header -->
        <div class="p-6 pb-4 flex items-start gap-3.5 border-b border-black/5 dark:border-white/10">
          <div class="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangleIcon class="w-6 h-6" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold text-[#0f172a] dark:text-[#fafafa] truncate">
              File Already Exists
            </h3>
            <p class="text-xs text-[#64748b] dark:text-[#cbd5e1] mt-0.5">
              A file named <span class="font-semibold text-[#0f172a] dark:text-[#fafafa]">"{{ conflict?.name }}"</span> already exists in this folder.
            </p>
          </div>
        </div>

        <!-- Comparison Cards (Existing vs. New Upload) -->
        <div class="p-6 grid grid-cols-2 gap-3 text-xs">
          <!-- 1. Existing on Cloud -->
          <div class="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col gap-1.5">
            <span class="text-[10px] uppercase font-bold tracking-wider text-[#64748b] dark:text-[#a1a1aa]">Existing File</span>
            <div class="font-semibold text-[#0f172a] dark:text-[#fafafa] truncate" :title="conflict?.name">
              {{ conflict?.name }}
            </div>
            <div class="text-[11px] text-[#64748b] dark:text-[#cbd5e1] space-y-0.5 mt-1 font-mono">
              <div>Size: <span class="text-[#0f172a] dark:text-[#fafafa] font-semibold">{{ formatBytes(conflict?.existingFile?.size || 0) }}</span></div>
              <div v-if="conflict?.existingFile?.modifiedAt" class="text-[10px]">
                Modified: {{ formatDate(conflict.existingFile.modifiedAt) }}
              </div>
            </div>
          </div>

          <!-- 2. New Uploading File -->
          <div class="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 flex flex-col gap-1.5">
            <span class="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">New Upload</span>
            <div class="font-semibold text-[#0f172a] dark:text-[#fafafa] truncate" :title="conflict?.name">
              {{ conflict?.name }}
            </div>
            <div class="text-[11px] text-[#64748b] dark:text-[#cbd5e1] space-y-0.5 mt-1 font-mono">
              <div>Size: <span class="text-indigo-600 dark:text-indigo-300 font-semibold">{{ formatBytes(conflict?.size || 0) }}</span></div>
              <div class="text-[10px]">Ready to upload</div>
            </div>
          </div>
        </div>

        <!-- Apply to All Checkbox (If multiple pending) -->
        <div v-if="remainingCount > 1" class="px-6 pb-2">
          <label class="flex items-center gap-2 text-xs text-[#475569] dark:text-[#cbd5e1] cursor-pointer select-none">
            <input 
              type="checkbox" 
              v-model="applyToAll" 
              class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-black/20 dark:border-white/20"
            />
            <span>Apply this decision to all remaining conflicts ({{ remainingCount }} files)</span>
          </label>
        </div>

        <!-- Modal Actions Footer -->
        <div class="p-6 pt-3 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/10 flex items-center justify-end gap-2.5">
          <!-- Skip -->
          <button 
            @click="handleResolve('skip')"
            class="px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-semibold text-[#475569] dark:text-[#cbd5e1] transition-all active:scale-95 cursor-pointer"
          >
            Skip
          </button>

          <!-- Keep Both -->
          <button 
            @click="handleResolve('rename')"
            class="px-4 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/15 text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            Keep Both
          </button>

          <!-- Overwrite -->
          <button 
            @click="handleResolve('overwrite')"
            class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <ReplaceIcon class="w-3.5 h-3.5" />
            <span>Replace / Overwrite</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import { 
  AlertTriangle as AlertTriangleIcon, 
  Replace as ReplaceIcon 
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'

const props = defineProps({
  show: { type: Boolean, default: false },
  conflict: { type: Object, default: null },
  remainingCount: { type: Number, default: 1 }
})

const emit = defineEmits(['resolve'])

const { formatBytes, formatDate } = useFileHelpers()
const applyToAll = ref(false)

const handleResolve = (action) => {
  emit('resolve', {
    action, // 'overwrite' | 'rename' | 'skip'
    applyToAll: applyToAll.value
  })
  applyToAll.value = false
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
