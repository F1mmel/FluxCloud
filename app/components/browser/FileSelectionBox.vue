<template>
  <div 
    v-if="lasso && lasso.active && (lasso.w > 2 || lasso.h > 2)" 
    class="fixed pointer-events-none z-[9999] rounded border transition-none"
    :style="{
      left: `${lasso.x}px`,
      top: `${lasso.y}px`,
      width: `${lasso.w}px`,
      height: `${lasso.h}px`,
      borderColor: 'var(--accent-color, #818CF8)',
      backgroundColor: 'var(--accent-bg-alpha, rgba(129, 140, 248, 0.15))'
    }"
  ></div>
</template>

<script setup>
defineProps({
  lasso: {
    type: Object,
    required: true
  }
})
</script>
