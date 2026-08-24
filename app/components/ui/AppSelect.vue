<template>
  <div class="relative inline-block text-left" ref="selectRef">
    <!-- Trigger Button (Shadcn Style) -->
    <button
      type="button"
      @click="isOpen = !isOpen"
      :disabled="disabled"
      class="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 text-[#0f172a] dark:text-[#fafafa] hover:bg-white dark:hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all duration-150 active:scale-[0.98] select-none cursor-pointer"
      :class="[
        isOpen ? 'ring-2 ring-indigo-500/40 border-indigo-500/50' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        buttonClass
      ]"
    >
      <div class="flex items-center gap-2 truncate">
        <component v-if="selectedOption?.icon" :is="selectedOption.icon" class="w-3.5 h-3.5 text-[#64748b] dark:text-[#a1a1aa] shrink-0" />
        <span class="truncate">{{ selectedOption?.label || placeholder || 'Select...' }}</span>
      </div>
      <ChevronDownIcon 
        class="w-3.5 h-3.5 text-[#64748b] dark:text-[#a1a1aa] shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Popover Menu (Shadcn Glass Style) -->
    <Transition name="dropdown-pop">
      <div
        v-if="isOpen"
        class="absolute z-50 mt-1.5 min-w-[160px] max-w-[240px] p-1 glass-dropdown rounded-2xl border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden focus:outline-none"
        :class="align === 'right' ? 'right-0' : 'left-0'"
      >
        <div class="max-h-60 overflow-y-auto space-y-0.5 p-0.5">
          <button
            v-for="opt in normalizedOptions"
            :key="opt.value"
            type="button"
            @click="selectOption(opt)"
            class="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors duration-150 select-none cursor-pointer"
            :class="[
              opt.value === modelValue
                ? 'bg-black/5 dark:bg-white/15 font-semibold text-[#0f172a] dark:text-white'
                : 'text-[#475569] dark:text-[#cbd5e1] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#0f172a] dark:hover:text-white'
            ]"
          >
            <div class="flex items-center gap-2 truncate">
              <component v-if="opt.icon" :is="opt.icon" class="w-3.5 h-3.5 shrink-0" :class="opt.value === modelValue ? 'accent-text' : 'text-[#64748b] dark:text-[#a1a1aa]'" />
              <span class="truncate">{{ opt.label }}</span>
            </div>
            <CheckIcon 
              v-if="opt.value === modelValue" 
              class="w-3.5 h-3.5 accent-text shrink-0 stroke-[3]"
            />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown as ChevronDownIcon, Check as CheckIcon } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  align: { type: String, default: 'left' }, // 'left', 'right'
  buttonClass: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const selectRef = ref(null)

const normalizedOptions = computed(() => {
  return props.options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label || opt.value,
        icon: opt.icon
      }
    }
    return {
      value: opt,
      label: opt,
      icon: null
    }
  })
})

const selectedOption = computed(() => {
  return normalizedOptions.value.find(opt => opt.value === props.modelValue)
})

const selectOption = (opt) => {
  isOpen.value = false
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
}

const handleClickOutside = (e) => {
  if (selectRef.value && !selectRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    document.addEventListener('click', handleClickOutside, true)
    document.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleClickOutside, true)
    document.removeEventListener('keydown', handleKeyDown)
  }
})
</script>

<style scoped>
.dropdown-pop-enter-active,
.dropdown-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
  transform-origin: top;
}

.dropdown-pop-enter-from,
.dropdown-pop-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}
</style>
