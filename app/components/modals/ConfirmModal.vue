<template>
  <Transition name="modal">
    <div 
      v-if="isVisible" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none"
      @click.self="handleCancel"
      @keydown.esc="handleCancel"
      @keydown.enter="handleConfirm"
      tabindex="0"
    >
      <div 
        class="bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <!-- Modal Content -->
        <div class="p-6">
          <div class="flex items-start gap-4">
            <!-- Icon with themed background -->
            <div 
              class="p-3 rounded-2xl shrink-0 shadow-sm"
              :class="[
                options.type === 'danger' ? 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400' :
                options.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400' :
                'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400'
              ]"
            >
              <FlameIcon v-if="options.icon === 'flame'" class="w-6 h-6" />
              <Trash2Icon v-else-if="options.icon === 'trash'" class="w-6 h-6" />
              <UserMinusIcon v-else-if="options.icon === 'user'" class="w-6 h-6" />
              <InfoIcon v-else-if="options.icon === 'info'" class="w-6 h-6" />
              <AlertTriangleIcon v-else class="w-6 h-6" />
            </div>

            <!-- Title & Message -->
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa] leading-snug">
                {{ options.title }}
              </h3>
              <p class="text-xs text-[#64748b] dark:text-[#cbd5e1] mt-1.5 leading-relaxed whitespace-pre-line">
                {{ options.message }}
              </p>
            </div>
          </div>
        </div>

        <!-- Actions Bar -->
        <div class="px-6 py-3.5 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/10 flex items-center justify-end gap-2.5">
          <!-- Cancel Button -->
          <button 
            @click="handleCancel"
            class="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-semibold text-[#475569] dark:text-[#cbd5e1] transition-all active:scale-95 cursor-pointer"
          >
            {{ options.cancelText || 'Cancel' }}
          </button>

          <!-- Confirm Button -->
          <button 
            @click="handleConfirm"
            class="px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            :class="[
              options.type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
              options.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white' :
              'accent-bg accent-bg-hover text-white'
            ]"
          >
            {{ options.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { 
  AlertTriangle as AlertTriangleIcon, 
  Trash2 as Trash2Icon, 
  Flame as FlameIcon, 
  UserMinus as UserMinusIcon, 
  Info as InfoIcon 
} from 'lucide-vue-next'
import { useConfirm } from '../../composables/useConfirm'

const { isVisible, options, handleConfirm, handleCancel } = useConfirm()
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
