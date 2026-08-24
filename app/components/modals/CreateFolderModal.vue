<template>
  <Transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4" @click.self="$emit('close')">
      <div class="glass-modal border border-white/20 dark:border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
            <FolderPlusIcon class="w-5 h-5 accent-text" />
            <span>Create New Folder</span>
          </h3>
          <button @click="$emit('close')" class="text-[#64748b] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa] p-1 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] transition-colors">
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-[#64748b] dark:text-[#a1a1aa] mb-3">Creating folder inside <span class="text-[#0f172a] dark:text-[#fafafa] font-mono font-semibold">/{{ currentPath || 'root' }}</span></p>

        <form @submit.prevent="handleSubmit">
          <input 
            ref="inputRef"
            v-model="name" 
            type="text" 
            placeholder="Folder Name" 
            class="w-full px-3.5 py-2.5 bg-[#f8fafc] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] focus:border-indigo-500 rounded-xl text-sm text-[#0f172a] dark:text-[#fafafa] placeholder-[#94a3b8] dark:placeholder-[#71717a] focus:outline-none mb-5 transition-all"
            autofocus
          />

          <div class="flex items-center justify-end gap-2.5 text-xs font-medium">
            <button 
              type="button" 
              @click="$emit('close')" 
              class="px-4 py-2 border border-[#e2e8f0] dark:border-[#27272a] hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] rounded-xl text-[#0f172a] dark:text-[#fafafa] transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :disabled="!name.trim() || isSubmitting"
              class="px-5 py-2 accent-bg accent-bg-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-white transition-all shadow-md active:scale-95"
            >
              <span v-if="isSubmitting">Creating...</span>
              <span v-else>Create Folder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { FolderPlus as FolderPlusIcon, X as XIcon } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  currentPath: { type: String, default: '' },
  isSubmitting: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'create'])

const name = ref('')
const inputRef = ref(null)

watch(() => props.show, (newVal) => {
  if (newVal) {
    name.value = ''
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

const handleSubmit = () => {
  if (!name.value.trim()) return
  emit('create', name.value.trim())
}
</script>
