<template>
  <div 
    v-if="active" 
    class="absolute inset-0 z-40 bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-md border-2 border-dashed accent-border flex flex-col items-center justify-center p-8 transition-all animate-in fade-in duration-150"
    @dragover.prevent
    @dragleave.prevent="$emit('leave')"
    @drop.prevent="$emit('drop', $event)"
  >
    <div class="p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] flex flex-col items-center text-center shadow-2xl scale-105 transition-transform pointer-events-none">
      <div class="p-4 rounded-full accent-bg-alpha mb-4">
        <UploadCloudIcon class="w-12 h-12 accent-text animate-bounce" />
      </div>
      <h3 class="text-lg font-bold text-[#0f172a] dark:text-[#fafafa] mb-1">Drop files here to upload</h3>
      <p class="text-xs text-[#64748b] dark:text-[#a1a1aa]">Files will be uploaded directly into /{{ currentPath || 'root' }}</p>
    </div>
  </div>
</template>

<script setup>
import { UploadCloud as UploadCloudIcon } from 'lucide-vue-next'

defineProps({
  active: { type: Boolean, default: false },
  currentPath: { type: String, default: '' }
})

defineEmits(['leave', 'drop'])
</script>
