<template>
  <Transition name="modal-fade">
    <div 
      v-if="show && currentItem" 
      class="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between select-none overflow-hidden text-white"
      tabindex="0"
      @keydown="handleKeyDown"
      ref="containerRef"
    >
      <!-- Top Bar -->
      <div class="h-16 px-4 sm:px-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div class="flex items-center gap-3 min-w-0">
          <button 
            @click="$emit('close')" 
            class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
            title="Close (Esc)"
          >
            <XIcon class="w-5 h-5" />
          </button>
          
          <div class="flex flex-col min-w-0">
            <span class="font-bold text-sm truncate max-w-[200px] sm:max-w-[400px]">{{ currentItem.name }}</span>
            <span class="text-[11px] text-white/60 font-mono">
              {{ currentIndex + 1 }} / {{ allItems.length }} • {{ formatDate(currentItem.dateTaken) }}
            </span>
          </div>
        </div>

        <!-- Top Right Actions -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- Slideshow Toggle -->
          <button 
            @click="toggleSlideshow" 
            class="p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
            :class="isSlideshowActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'"
            :title="isSlideshowActive ? 'Pause Slideshow (Space)' : 'Play Slideshow (Space)'"
          >
            <PauseIcon v-if="isSlideshowActive" class="w-4 h-4" />
            <PlayIcon v-else class="w-4 h-4 fill-white" />
            <span class="hidden md:inline">{{ isSlideshowActive ? 'Pause' : 'Slideshow' }}</span>
          </button>

          <!-- Zoom Controls (Images only) -->
          <template v-if="!currentItem.isVideo">
            <button 
              @click="zoomIn" 
              class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Zoom In"
            >
              <ZoomInIcon class="w-4 h-4" />
            </button>
            <button 
              @click="zoomOut" 
              class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOutIcon class="w-4 h-4" />
            </button>
            <button 
              @click="rotate" 
              class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Rotate (R)"
            >
              <RotateCwIcon class="w-4 h-4" />
            </button>
          </template>

          <!-- EXIF Info Toggle -->
          <button 
            @click="showInfoSidebar = !showInfoSidebar" 
            class="p-2 rounded-xl transition-all cursor-pointer"
            :class="showInfoSidebar ? 'bg-white/25 text-white font-bold' : 'bg-white/10 hover:bg-white/20 text-white'"
            title="Toggle EXIF Info (i)"
          >
            <InfoIcon class="w-4 h-4" />
          </button>

          <!-- Download Button -->
          <a 
            :href="currentItem.url" 
            :download="currentItem.name"
            class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Download Original"
          >
            <DownloadIcon class="w-4 h-4" />
          </a>
        </div>
      </div>

      <!-- Main Stage Container -->
      <div class="flex-1 relative flex items-center justify-center overflow-hidden z-10">
        <!-- Previous Button -->
        <button 
          v-if="hasPrev"
          @click="prevItem" 
          class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/40 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-30 cursor-pointer border border-white/10 shadow-2xl"
          title="Previous (Left Arrow)"
        >
          <ChevronLeftIcon class="w-6 h-6" />
        </button>

        <!-- Media Display -->
        <div class="w-full h-full flex items-center justify-center p-4 sm:p-8" @click.self="$emit('close')">
          <!-- Video -->
          <video 
            v-if="currentItem.isVideo"
            :key="currentItem.url"
            :src="currentItem.url" 
            controls 
            autoplay
            class="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl bg-black object-contain outline-none"
          ></video>

          <!-- Image with Zoom & Rotate -->
          <div 
            v-else
            class="transition-transform duration-200 ease-out max-h-full max-w-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            :style="{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
            }"
            @dblclick="toggleZoom"
          >
            <img 
              :src="currentItem.url" 
              :alt="currentItem.name" 
              class="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain pointer-events-none select-none"
            />
          </div>
        </div>

        <!-- Next Button -->
        <button 
          v-if="hasNext"
          @click="nextItem" 
          class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/40 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-30 cursor-pointer border border-white/10 shadow-2xl"
          title="Next (Right Arrow)"
        >
          <ChevronRightIcon class="w-6 h-6" />
        </button>

        <!-- EXIF Info Sidebar Drawer -->
        <Transition name="slide-left">
          <div 
            v-if="showInfoSidebar"
            class="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-black/85 backdrop-blur-2xl border-l border-white/15 p-5 overflow-y-auto z-40 text-xs text-white/90 flex flex-col justify-between shadow-2xl"
          >
            <div class="space-y-5">
              <!-- Sidebar Header -->
              <div class="flex items-center justify-between pb-3 border-b border-white/15">
                <h4 class="text-sm font-bold flex items-center gap-2 text-white">
                  <InfoIcon class="w-4 h-4 text-indigo-400" />
                  <span>Media Information</span>
                </h4>
                <button @click="showInfoSidebar = false" class="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">
                  <XIcon class="w-4 h-4" />
                </button>
              </div>

              <!-- General File Info -->
              <div class="space-y-2">
                <span class="text-[10px] font-bold text-white/50 uppercase tracking-wider block">File</span>
                <div class="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 font-mono text-[11px]">
                  <div class="flex justify-between">
                    <span class="text-white/60 font-sans">Name</span>
                    <span class="font-bold text-white truncate max-w-[170px]" :title="currentItem.name">{{ currentItem.name }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-white/60 font-sans">Size</span>
                    <span>{{ formatBytes(currentItem.size) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-white/60 font-sans">Type</span>
                    <span>{{ currentItem.mimeType }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-white/60 font-sans">Date</span>
                    <span>{{ formatDate(currentItem.dateTaken) }}</span>
                  </div>
                </div>
              </div>

              <!-- Camera & Exposure Specs -->
              <div v-if="currentItem.exif && (currentItem.exif.make || currentItem.exif.model || currentItem.exif.iso)" class="space-y-2">
                <span class="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Camera &amp; Lens</span>
                
                <div class="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div v-if="currentItem.exif.make || currentItem.exif.model" class="flex items-center gap-2 text-white font-bold">
                    <CameraIcon class="w-4 h-4 text-indigo-400 shrink-0" />
                    <span class="truncate">{{ [currentItem.exif.make, currentItem.exif.model].filter(Boolean).join(' ') }}</span>
                  </div>

                  <div v-if="currentItem.exif.lens" class="text-[11px] text-white/70 truncate">
                    Lens: {{ currentItem.exif.lens }}
                  </div>

                  <!-- Exposure Specs Pill Grid -->
                  <div class="grid grid-cols-2 gap-2 pt-1">
                    <div v-if="currentItem.exif.fNumber" class="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col">
                      <span class="text-[10px] text-white/50">Aperture</span>
                      <span class="font-bold text-white font-mono">f/{{ currentItem.exif.fNumber }}</span>
                    </div>

                    <div v-if="currentItem.exif.exposureTime" class="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col">
                      <span class="text-[10px] text-white/50">Shutter Speed</span>
                      <span class="font-bold text-white font-mono">{{ currentItem.exif.exposureTime }}</span>
                    </div>

                    <div v-if="currentItem.exif.iso" class="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col">
                      <span class="text-[10px] text-white/50">ISO</span>
                      <span class="font-bold text-white font-mono">ISO {{ currentItem.exif.iso }}</span>
                    </div>

                    <div v-if="currentItem.exif.focalLength" class="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col">
                      <span class="text-[10px] text-white/50">Focal Length</span>
                      <span class="font-bold text-white font-mono">{{ currentItem.exif.focalLength }}mm</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Location / GPS Coordinates -->
              <div v-if="currentItem.exif && currentItem.exif.latitude && currentItem.exif.longitude" class="space-y-2">
                <span class="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Location (GPS)</span>
                <div class="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div class="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
                    <MapPinIcon class="w-4 h-4 shrink-0" />
                    <span>{{ currentItem.exif.latitude }}, {{ currentItem.exif.longitude }}</span>
                  </div>
                  <a 
                    :href="`https://www.google.com/maps?q=${currentItem.exif.latitude},${currentItem.exif.longitude}`" 
                    target="_blank" 
                    class="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLinkIcon class="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="pt-4 border-t border-white/10 text-[10px] text-white/40 text-center">
              FluxCloud Media Inspector
            </div>
          </div>
        </Transition>
      </div>

      <!-- Bottom Filmstrip Navigation Thumbnails -->
      <div class="h-20 px-6 flex items-center justify-center gap-2 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent overflow-x-auto">
        <div 
          v-for="(item, idx) in allItems" 
          :key="item.id"
          @click="currentIndex = idx"
          class="h-12 w-12 rounded-xl overflow-hidden cursor-pointer border-2 transition-all shrink-0 hover:scale-105 active:scale-95"
          :class="currentIndex === idx ? 'border-indigo-500 scale-110 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-100'"
        >
          <img 
            :src="item.thumbnailUrl || item.url" 
            :alt="item.name" 
            class="w-full h-full object-cover" 
            loading="lazy" 
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { 
  X as XIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateCw as RotateCwIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Camera as CameraIcon,
  MapPin as MapPinIcon,
  ExternalLink as ExternalLinkIcon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'

const props = defineProps({
  show: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  initialIndex: { type: Number, default: 0 }
})

const emit = defineEmits(['close'])

const { formatBytes, formatDate } = useFileHelpers()

const containerRef = ref(null)
const currentIndex = ref(props.initialIndex)
const allItems = computed(() => props.items || [])
const currentItem = computed(() => allItems.value[currentIndex.value] || null)

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < allItems.value.length - 1)

const zoomLevel = ref(1)
const rotation = ref(0)
const showInfoSidebar = ref(false)
const isSlideshowActive = ref(false)
let slideshowTimer = null

const resetTransform = () => {
  zoomLevel.value = 1
  rotation.value = 0
}

watch(() => props.initialIndex, (newIdx) => {
  currentIndex.value = newIdx
  resetTransform()
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    resetTransform()
    nextTick(() => {
      containerRef.value?.focus()
    })
  } else {
    stopSlideshow()
  }
})

watch(currentIndex, () => {
  resetTransform()
})

const nextItem = () => {
  if (hasNext.value) {
    currentIndex.value++
  } else if (isSlideshowActive.value) {
    currentIndex.value = 0 // Loop in slideshow
  }
}

const prevItem = () => {
  if (hasPrev.value) {
    currentIndex.value--
  }
}

const zoomIn = () => {
  zoomLevel.value = Math.min(3, zoomLevel.value + 0.25)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)
}

const toggleZoom = () => {
  zoomLevel.value = zoomLevel.value === 1 ? 2 : 1
}

const rotate = () => {
  rotation.value = (rotation.value + 90) % 360
}

const toggleSlideshow = () => {
  if (isSlideshowActive.value) {
    stopSlideshow()
  } else {
    startSlideshow()
  }
}

const startSlideshow = () => {
  isSlideshowActive.value = true
  slideshowTimer = setInterval(() => {
    nextItem()
  }, 4000)
}

const stopSlideshow = () => {
  isSlideshowActive.value = false
  if (slideshowTimer) {
    clearInterval(slideshowTimer)
    slideshowTimer = null
  }
}

const handleKeyDown = (e) => {
  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'ArrowRight') {
    nextItem()
  } else if (e.key === 'ArrowLeft') {
    prevItem()
  } else if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault()
    toggleSlideshow()
  } else if (e.key === 'i' || e.key === 'I') {
    showInfoSidebar.value = !showInfoSidebar.value
  } else if (e.key === 'r' || e.key === 'R') {
    rotate()
  } else if (e.key === '+' || e.key === '=') {
    zoomIn()
  } else if (e.key === '-') {
    zoomOut()
  }
}

onUnmounted(() => {
  stopSlideshow()
})
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.25s ease-out, opacity 0.25s ease-out;
}
.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
