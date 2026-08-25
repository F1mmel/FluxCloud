<template>
  <div 
    :style="rootStyles" 
    class="min-h-screen font-sans antialiased text-[#0f172a] dark:text-[#fafafa] relative overflow-hidden transition-colors duration-200"
    :class="currentBackground ? 'bg-[#09090b]' : 'bg-[#f8fafc] dark:bg-[#09090b]'"
  >
    <!-- Wallpaper Layer: Forced 16:9 full screen scaling with zero cropping -->
    <div 
      v-if="currentBackground"
      class="fixed inset-0 pointer-events-none z-0 bg-center bg-no-repeat transition-all duration-300"
      :style="{
        backgroundImage: `url('${currentBackground}')`,
        backgroundSize: '100% 100%',
        filter: `blur(${backgroundBlur}px) brightness(${backgroundBrightness}%)`
      }"
    ></div>

    <!-- Ambient Dark Tint Overlay (Deep Dark Gray Frosted Glass with backdrop blur) -->
    <div 
      v-if="currentBackground" 
      class="fixed inset-0 pointer-events-none transition-opacity duration-300 z-0 bg-black/35 dark:bg-[#09090b]/55 backdrop-blur-sm"
    ></div>

    <div class="relative z-10 min-h-screen flex flex-col">
      <Suspense>
        <NuxtPage />
      </Suspense>
      <AppToast />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import AppToast from './components/ui/AppToast.vue'
import { useTheme } from './composables/useTheme'
import { useBackground } from './composables/useBackground'
import { useFont } from './composables/useFont'

// Fetch server config for global CSS dynamic accent color & default background
const { data: config } = useFetch('/api/config')
const { accentColor, initTheme, initAccent } = useTheme()
const { currentBackground, backgroundBlur, backgroundBrightness, initBackground } = useBackground()
const { initFont } = useFont()

const rootStyles = computed(() => {
  const accent = accentColor.value || config.value?.color || '#818CF8'
  return {
    '--accent-color': accent,
    '--accent-bg-alpha': `${accent}26`
  }
})

onMounted(() => {
  initTheme(config.value?.color)
  initBackground(config.value)
  initFont()
})

watch(config, (newConf) => {
  if (newConf) {
    initAccent(newConf.color)
    initBackground(newConf)
  }
})
</script>
