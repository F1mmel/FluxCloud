<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="isChecked"
    :disabled="disabled"
    @click="toggle"
    class="relative inline-flex items-center justify-center shrink-0 rounded-md border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-90 select-none cursor-pointer"
    :class="[
      sizeClasses,
      isChecked 
        ? 'accent-bg border-transparent text-white shadow-sm' 
        : 'bg-white/80 dark:bg-white/10 border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40 shadow-xs',
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    ]"
  >
    <CheckIcon 
      class="transition-all duration-150 stroke-[3.5]"
      :class="[
        iconSizeClasses,
        isChecked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      ]"
    />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { Check as CheckIcon } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: undefined },
  checked: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: 'md' } // 'sm', 'md', 'lg'
})

const emit = defineEmits(['update:modelValue', 'change'])

const isChecked = computed(() => {
  if (props.modelValue !== undefined) return props.modelValue
  return !!props.checked
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-3.5 h-3.5 rounded-[4px]'
    case 'lg': return 'w-5 h-5 rounded-lg'
    default: return 'w-4 h-4 rounded-[5px]'
  }
})

const iconSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-2.5 h-2.5'
    case 'lg': return 'w-3.5 h-3.5'
    default: return 'w-3 h-3'
  }
})

const toggle = (e) => {
  if (props.disabled) return
  const newVal = !isChecked.value
  emit('update:modelValue', newVal)
  emit('change', newVal, e)
}
</script>
