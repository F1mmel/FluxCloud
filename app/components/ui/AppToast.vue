<template>
  <div class="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    <TransitionGroup 
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all bg-white/95 dark:bg-[#12131a]/95"
        :class="{
          'border-emerald-500/40 text-emerald-700 dark:text-emerald-300': toast.type === 'success',
          'border-red-500/40 text-red-700 dark:text-red-300': toast.type === 'error',
          'border-amber-500/40 text-amber-700 dark:text-amber-300': toast.type === 'warning',
          'border-indigo-500/40 text-indigo-700 dark:text-indigo-300': toast.type === 'info'
        }"
      >
        <div class="shrink-0 mt-0.5">
          <CheckCircle2Icon v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-500" />
          <AlertCircleIcon v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-500" />
          <AlertCircleIcon v-else-if="toast.type === 'warning'" class="w-5 h-5 text-amber-500" />
          <InfoIcon v-else class="w-5 h-5 text-indigo-500" />
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-[#0f172a] dark:text-[#fafafa] leading-tight">{{ toast.title }}</h4>
          <p v-if="toast.message" class="text-xs text-[#64748b] dark:text-[#a1a1aa] mt-1 leading-relaxed">{{ toast.message }}</p>
        </div>
        <button 
          @click="removeToast(toast.id)" 
          class="shrink-0 text-[#94a3b8] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-colors p-0.5 -mr-1 -mt-1"
        >
          <XIcon class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { 
  CheckCircle2 as CheckCircle2Icon, 
  AlertCircle as AlertCircleIcon, 
  Info as InfoIcon, 
  X as XIcon 
} from 'lucide-vue-next'
import { useToast } from '../../composables/useToast'

const { toasts, removeToast } = useToast()
</script>
