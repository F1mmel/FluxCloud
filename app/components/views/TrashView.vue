<template>
  <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
    <!-- Top Header -->
    <header class="relative z-30 h-16 border-b border-black/5 dark:border-white/10 px-6 flex items-center justify-between glass-card bg-white/40 dark:bg-white/10 shrink-0 transition-all duration-200">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl bg-red-500/15 border border-red-500/30">
          <Trash2Icon class="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa]">Trash / Recycle Bin</h2>
          <p class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Items in trash can be restored or permanently removed</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button 
          v-if="trashItems.length > 0"
          @click="emptyTrash" 
          class="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-100/80 dark:bg-red-950/60 hover:bg-red-200 dark:hover:bg-red-900/80 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-200 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
        >
          <Trash2Icon class="w-3.5 h-3.5" />
          <span>Empty Trash</span>
        </button>

        <button 
          @click="loadTrash" 
          class="p-2 border border-black/10 dark:border-white/10 rounded-xl text-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#64748b] dark:text-[#e2e8f0] hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-all active:scale-95 shadow-sm"
          title="Refresh Trash"
        >
          <RefreshCwIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>

      <!-- Concave Inner Corner -->
      <div class="absolute top-full left-0 w-5 h-5 pointer-events-none z-30 overflow-hidden">
        <div class="w-full h-full glass-card bg-white/40 dark:bg-white/10 concave-glass-corner"></div>
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 20 20" fill="none">
          <path d="M20,0 A20,20 0 0,0 0,20" fill="none" stroke="currentColor" class="text-black/5 dark:text-white/10" stroke-width="1.2" />
        </svg>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-6 select-none">
      <div v-if="loading" class="flex flex-col items-center justify-center h-64 text-[#64748b] dark:text-[#cbd5e1] gap-3">
        <Loader2Icon class="w-8 h-8 animate-spin accent-text" />
        <span class="text-sm">Loading trash...</span>
      </div>

      <!-- Trash Items Table -->
      <div v-else-if="trashItems && trashItems.length > 0" class="border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden glass-card shadow-xl transition-all duration-200">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/10 text-[#475569] dark:text-[#cbd5e1] font-semibold text-xs">
              <th class="py-3 px-4 align-middle">Deleted Item</th>
              <th class="py-3 px-4 align-middle">Original Location</th>
              <th class="py-3 px-4 w-44 align-middle">Deleted Time</th>
              <th class="py-3 px-4 w-32 align-middle">Size</th>
              <th class="py-3 px-4 text-right w-28 align-middle">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in trashItems" 
              :key="item.id"
              class="border-b border-[#e2e8f0] dark:border-[#27272a] last:border-0 hover:bg-[#f1f5f9]/80 dark:hover:bg-[#18181b]/60 transition-colors select-none group cursor-pointer"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-xl bg-black/5 dark:bg-white/10 text-[#64748b] dark:text-[#e2e8f0]">
                    <FolderIcon v-if="item.isDirectory" class="w-4 h-4 accent-text folder-item-icon" />
                    <FileIcon v-else class="w-4 h-4 text-slate-700 dark:text-white file-item-icon" />
                  </div>
                  <span class="font-medium text-xs text-[#0f172a] dark:text-[#fafafa] leading-normal py-0.5">{{ item.fileName }}</span>
                </div>
              </td>
              <td class="py-3 px-4 text-xs text-[#64748b] dark:text-[#cbd5e1]">
                {{ item.originalPath }}
              </td>
              <td class="py-3 px-4 text-xs text-[#64748b] dark:text-[#cbd5e1]">
                {{ formatDate(item.deletedAt) }}
              </td>
              <td class="py-3 px-4 text-xs text-[#64748b] dark:text-[#cbd5e1]">
                {{ item.isDirectory ? '--' : formatBytes(item.size) }}
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="restoreItem(item.id)" 
                    class="p-1 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all active:scale-95"
                    title="Restore item"
                  >
                    <RotateCcwIcon class="w-4 h-4" />
                  </button>
                  <button 
                    @click="deletePermanently(item.id)" 
                    class="p-1 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-95"
                    title="Delete permanently"
                  >
                    <Trash2Icon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="border border-dashed border-[#cbd5e1] dark:border-[#27272a] rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto mt-12 glass-card shadow-sm">
        <div class="p-4 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 mb-4">
          <Trash2Icon class="w-12 h-12 text-[#94a3b8] dark:text-[#cbd5e1]" />
        </div>
        <h3 class="text-base font-semibold text-[#0f172a] dark:text-[#fafafa] mb-1">Trash is empty</h3>
        <p class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Deleted files will appear here before being permanently purged.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  Trash2 as Trash2Icon, 
  Folder as FolderIcon, 
  File as FileIcon, 
  RotateCcw as RotateCcwIcon, 
  RefreshCw as RefreshCwIcon, 
  Loader2 as Loader2Icon 
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'

const emit = defineEmits(['trash-updated'])

const { formatBytes, formatDate } = useFileHelpers()
const { success, error } = useToast()

const trashItems = ref([])
const loading = ref(false)

const loadTrash = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/trash')
    trashItems.value = res || []
    emit('trash-updated', trashItems.value.length)
  } catch {
    trashItems.value = []
  } finally {
    loading.value = false
  }
}

const restoreItem = async (id) => {
  try {
    await $fetch('/api/trash', {
      method: 'POST',
      body: { action: 'restore', id }
    })
    trashItems.value = trashItems.value.filter(t => t.id !== id)
    emit('trash-updated', trashItems.value.length)
    success('Restored', 'Item restored to its original folder')
  } catch (err) {
    error('Restore failed', err?.data?.statusMessage || 'Could not restore item')
  }
}

const deletePermanently = async (id) => {
  if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) return
  try {
    await $fetch('/api/trash', {
      method: 'POST',
      body: { action: 'delete', id }
    })
    trashItems.value = trashItems.value.filter(t => t.id !== id)
    emit('trash-updated', trashItems.value.length)
    success('Deleted', 'Item permanently removed')
  } catch (err) {
    error('Delete failed', 'Could not delete item')
  }
}

const emptyTrash = async () => {
  if (!confirm(`Are you sure you want to permanently empty ${trashItems.value.length} items from trash?`)) return
  try {
    await $fetch('/api/trash', {
      method: 'POST',
      body: { action: 'empty' }
    })
    trashItems.value = []
    emit('trash-updated', 0)
    success('Trash emptied', 'All trash items permanently removed')
  } catch (err) {
    error('Error', 'Could not empty trash')
  }
}

onMounted(() => {
  loadTrash()
})

defineExpose({ loadTrash })
</script>
