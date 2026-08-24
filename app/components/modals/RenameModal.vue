<template>
  <Transition name="modal-fade">
    <div v-if="show && item" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4" @click.self="$emit('close')">
      <div class="glass-modal border border-white/20 dark:border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
            <Edit3Icon class="w-5 h-5 text-amber-500" />
            <span>Rename {{ item.isDirectory ? 'Folder' : 'File' }}</span>
          </h3>
          <button @click="$emit('close')" class="text-[#64748b] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa] p-1 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] transition-colors">
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleRename">
          <input 
            ref="inputRef"
            v-model="newName" 
            type="text" 
            placeholder="New Name" 
            class="w-full px-3.5 py-2.5 bg-[#f8fafc] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] focus:border-indigo-500 rounded-xl text-sm text-[#0f172a] dark:text-[#fafafa] focus:outline-none mb-5 transition-all"
            autofocus
          />

          <div class="flex items-center justify-end gap-2.5 text-xs font-semibold">
            <button 
              type="button" 
              @click="$emit('close')" 
              class="px-4 py-2 border border-[#e2e8f0] dark:border-[#27272a] hover:bg-[#f1f5f9] dark:hover:bg-[#18181b] rounded-xl text-[#0f172a] dark:text-[#fafafa] transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :disabled="!newName.trim() || newName === item.name || isSubmitting"
              class="px-5 py-2 accent-bg accent-bg-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-md active:scale-95"
            >
              <span v-if="isSubmitting">Renaming...</span>
              <span v-else>Rename</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Edit3 as Edit3Icon, X as XIcon } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null },
  isSubmitting: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'rename'])

const newName = ref('')
const inputRef = ref(null)

watch(() => props.show, (newVal) => {
  if (newVal && props.item) {
    newName.value = props.item.name
    nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select()
    })
  }
})

const handleRename = () => {
  if (!newName.value.trim() || newName.value === props.item?.name) return
  emit('rename', { item: props.item, newName: newName.value.trim() })
}
</script>
