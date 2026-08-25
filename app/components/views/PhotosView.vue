<template>
  <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden select-none bg-transparent">
    <!-- Top Header -->
    <header class="relative z-30 h-16 border-b border-black/5 dark:border-white/10 px-6 flex items-center justify-between glass-header shrink-0 transition-all duration-200">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl accent-bg-alpha border border-[var(--accent-color)]/30">
          <CameraIcon class="w-5 h-5 accent-text" />
        </div>
        <div>
          <h2 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
            <span>Photos &amp; Gallery</span>
            <span v-if="filteredPhotos.length > 0" class="text-xs px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 accent-text font-semibold">
              {{ filteredPhotos.length }}
            </span>
          </h2>
          <p class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Immich &amp; Google Photos style media timeline</p>
        </div>
      </div>

      <!-- Right Controls: Filter Buttons & Refresh -->
      <div class="flex items-center gap-3">
        <!-- Filter: All / Photos / Videos -->
        <div class="bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 p-0.5 rounded-xl flex items-center shadow-sm text-xs font-semibold">
          <button 
            @click="mediaFilter = 'all'" 
            class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            :class="mediaFilter === 'all' ? 'bg-white dark:bg-[#27272a] text-[#0f172a] dark:text-[#fafafa] shadow-sm font-bold' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa]'"
          >
            All ({{ allFlattenedPhotos.length }})
          </button>
          <button 
            @click="mediaFilter = 'photos'" 
            class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            :class="mediaFilter === 'photos' ? 'bg-white dark:bg-[#27272a] text-[#0f172a] dark:text-[#fafafa] shadow-sm font-bold' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa]'"
          >
            Photos ({{ photosOnlyCount }})
          </button>
          <button 
            @click="mediaFilter = 'videos'" 
            class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            :class="mediaFilter === 'videos' ? 'bg-white dark:bg-[#27272a] text-[#0f172a] dark:text-[#fafafa] shadow-sm font-bold' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa]'"
          >
            Videos ({{ videosOnlyCount }})
          </button>
        </div>

        <!-- Refresh Button -->
        <button 
          @click="loadPhotos" 
          :disabled="loading"
          class="p-2 border border-black/10 dark:border-white/10 rounded-xl text-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-all active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
          title="Refresh Gallery"
        >
          <RefreshCwIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>

      <!-- Concave Inner Corner -->
      <div class="absolute top-full left-0 w-5 h-5 pointer-events-none z-30 overflow-hidden">
        <div class="w-full h-full glass-header concave-glass-corner"></div>
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 20 20" fill="none">
          <path d="M20,0 A20,20 0 0,0 0,20" fill="none" stroke="currentColor" class="text-black/5 dark:text-white/10" stroke-width="1.2" />
        </svg>
      </div>
    </header>

    <!-- Main Photos Area with Sidebar -->
    <div class="flex-1 flex min-w-0 h-full overflow-hidden relative">
      <!-- Photos Scroll Container -->
      <div 
        ref="scrollContainerRef" 
        @scroll="handleScroll"
        class="flex-1 h-full overflow-y-auto p-4 sm:p-6 pr-2 sm:pr-4 space-y-6 scroll-smooth"
      >
        <!-- Selection Toolbar (When 1 or more photos selected) -->
        <Transition name="fade">
          <div 
            v-if="selectedPhotoIds.size > 0"
            class="p-3 px-4 rounded-2xl accent-bg text-white shadow-xl flex items-center justify-between z-20 animate-in slide-in-from-top-3 duration-200"
          >
            <div class="flex items-center gap-3">
              <span class="font-bold text-xs">{{ selectedPhotoIds.size }} selected</span>
              <button 
                @click="selectedPhotoIds.clear()"
                class="text-xs text-white/80 hover:text-white underline cursor-pointer"
              >
                Deselect
              </button>
            </div>

            <div class="flex items-center gap-2">
              <!-- Download Selected ZIP -->
              <button 
                @click="downloadSelectedZip"
                class="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <DownloadIcon class="w-3.5 h-3.5" />
                <span>Download ZIP</span>
              </button>

              <!-- Move to Trash -->
              <button 
                @click="deleteSelected(false)"
                class="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Trash2Icon class="w-3.5 h-3.5" />
                <span>Trash</span>
              </button>

              <!-- Delete Permanently -->
              <button 
                @click="deleteSelected(true)"
                class="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
              >
                <FlameIcon class="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </Transition>

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2Icon class="w-8 h-8 animate-spin accent-text" />
          <span class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Scanning media timeline...</span>
        </div>

        <!-- Filtered Timeline Groups -->
        <template v-else-if="filteredTimeline.length > 0">
          <div 
            v-for="group in filteredTimeline" 
            :key="group.monthTitle" 
            :id="`group_${slugify(group.monthTitle)}`"
            class="space-y-3 timeline-section"
            :data-group-title="group.monthTitle"
          >
            <!-- Sticky Month Header (Google Photos Style) -->
            <div class="sticky top-0 z-10 py-2 backdrop-blur-xl bg-white/75 dark:bg-[#12131a]/75 flex items-center justify-between border-b border-black/5 dark:border-white/10 px-1 rounded-xl">
              <div class="flex items-center gap-2">
                <CalendarIcon class="w-4 h-4 text-purple-500" />
                <span class="font-bold text-xs text-[#0f172a] dark:text-[#fafafa]">{{ group.monthTitle }}</span>
              </div>
              <span class="text-[11px] text-[#64748b] dark:text-[#cbd5e1] font-mono font-medium">
                {{ group.items.length }} {{ group.items.length === 1 ? 'item' : 'items' }}
              </span>
            </div>

            <!-- Media Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div 
                v-for="(photo, pIdx) in group.items" 
                :key="photo.id"
                v-reveal
                :style="{ '--reveal-delay': `${(pIdx % 6) * 40}ms` }"
                @click="handleCardClick(photo, $event)"
                class="group relative aspect-square rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl select-none"
                :class="selectedPhotoIds.has(photo.id) ? 'ring-3 ring-[var(--accent-color)] scale-[0.98]' : ''"
              >
                <!-- Thumbnail Image -->
                <img 
                  :src="photo.thumbnailUrl || photo.url" 
                  :alt="photo.name" 
                  loading="lazy"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />

                <!-- Selection Checkmark Circle (Top-Left, Google Photos Style) -->
                <button 
                  @click.stop="toggleSelectPhoto(photo.id)"
                  class="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer"
                  :class="selectedPhotoIds.has(photo.id) ? 'accent-bg text-white shadow-md' : 'bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/70 hover:text-white'"
                >
                  <CheckIcon class="w-3.5 h-3.5 stroke-[3]" />
                </button>

                <!-- Video Play Badge -->
                <div v-if="photo.isVideo" class="absolute bottom-2 right-2 p-1 rounded-lg bg-black/60 text-white backdrop-blur-md shadow-md flex items-center gap-1 text-[10px]">
                  <PlayIcon class="w-3 h-3 fill-white" />
                  <span class="font-mono">Video</span>
                </div>

                <!-- Hover Overlay with Title -->
                <div class="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col justify-end text-left pointer-events-none">
                  <span class="text-white text-[11px] font-semibold truncate">{{ photo.name }}</span>
                  <span class="text-white/70 text-[9px] font-mono">{{ formatBytes(photo.size) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty State -->
        <div v-else class="border border-dashed border-[#cbd5e1] dark:border-[#27272a] rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto mt-12 glass-card shadow-sm">
          <div class="p-4 rounded-2xl accent-bg-alpha border border-[var(--accent-color)]/20 mb-4">
            <CameraIcon class="w-12 h-12 accent-text" />
          </div>
          <h3 class="text-base font-semibold text-[#0f172a] dark:text-[#fafafa] mb-1">No media found</h3>
          <p class="text-xs text-[#64748b] dark:text-[#cbd5e1] mb-4 max-w-xs">Upload images and videos to your cloud to automatically build your interactive timeline gallery.</p>
        </div>
      </div>

      <!-- RIGHT TIMELINE SCRUBBER SIDEBAR (Google Photos / Immich Style) -->
      <aside 
        v-if="scrubberTree.length > 0"
        class="w-20 sm:w-24 border-l border-black/5 dark:border-white/10 bg-white/40 dark:bg-[#12131a]/40 backdrop-blur-xl flex flex-col py-4 px-1.5 select-none overflow-y-auto shrink-0 z-10"
      >
        <div class="text-[10px] font-bold tracking-wider text-[#64748b] dark:text-[#cbd5e1] uppercase text-center pb-3 border-b border-black/5 dark:border-white/10">
          Timeline
        </div>

        <div class="space-y-4 pt-3">
          <div v-for="yearNode in scrubberTree" :key="yearNode.year" class="space-y-1">
            <!-- Year Header -->
            <button 
              @click="scrollToMonth(yearNode.months[0]?.groupTitle)"
              class="w-full text-center font-bold text-xs py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              :class="activeScrubberYear === yearNode.year ? 'accent-text font-black scale-105' : 'text-[#0f172a] dark:text-[#fafafa]'"
            >
              {{ yearNode.year }}
            </button>

            <!-- Months List -->
            <div class="space-y-0.5 pl-1">
              <button 
                v-for="m in yearNode.months" 
                :key="m.groupTitle"
                @click="scrollToMonth(m.groupTitle)"
                class="w-full text-left px-2 py-0.5 rounded-md text-[10px] font-medium truncate transition-all cursor-pointer flex items-center justify-between"
                :class="activeScrubberMonth === m.groupTitle ? 'accent-bg text-white font-bold shadow-sm' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'"
                :title="`${m.groupTitle} (${m.count} items)`"
              >
                <span>{{ m.shortMonth }}</span>
                <span class="text-[9px] opacity-70 font-mono">{{ m.count }}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Lightbox Modal -->
    <PhotoLightboxModal 
      :show="showLightbox"
      :items="filteredPhotos"
      :initial-index="selectedPhotoIndex"
      @close="showLightbox = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Camera as CameraIcon,
  RefreshCw as RefreshCwIcon,
  Loader2 as Loader2Icon,
  Calendar as CalendarIcon,
  Play as PlayIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
  Trash2 as Trash2Icon,
  Flame as FlameIcon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import PhotoLightboxModal from '../modals/PhotoLightboxModal.vue'

const { formatBytes } = useFileHelpers()
const { success, error } = useToast()
const { askConfirm } = useConfirm()

const timeline = ref([])
const loading = ref(false)
const mediaFilter = ref('all') // 'all' | 'photos' | 'videos'
const showLightbox = ref(false)
const selectedPhotoIndex = ref(0)
const selectedPhotoIds = ref(new Set())
const scrollContainerRef = ref(null)
const activeScrubberMonth = ref('')
const activeScrubberYear = ref('')

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '_')

const allFlattenedPhotos = computed(() => {
  const list = []
  for (const g of timeline.value) {
    if (g.items) {
      list.push(...g.items)
    }
  }
  return list
})

const photosOnlyCount = computed(() => allFlattenedPhotos.value.filter(p => !p.isVideo).length)
const videosOnlyCount = computed(() => allFlattenedPhotos.value.filter(p => p.isVideo).length)

const filteredPhotos = computed(() => {
  if (mediaFilter.value === 'photos') return allFlattenedPhotos.value.filter(p => !p.isVideo)
  if (mediaFilter.value === 'videos') return allFlattenedPhotos.value.filter(p => p.isVideo)
  return allFlattenedPhotos.value
})

const filteredTimeline = computed(() => {
  if (mediaFilter.value === 'all') return timeline.value

  const res = []
  for (const g of timeline.value) {
    const matched = g.items.filter(p => {
      if (mediaFilter.value === 'photos') return !p.isVideo
      if (mediaFilter.value === 'videos') return p.isVideo
      return true
    })
    if (matched.length > 0) {
      res.push({
        monthTitle: g.monthTitle,
        items: matched
      })
    }
  }
  return res
})

/**
 * Builds Year -> Months tree for the right scrubber sidebar
 */
const scrubberTree = computed(() => {
  const yearsMap = new Map()

  for (const g of filteredTimeline.value) {
    // Expected group title e.g. "August 2026" or "August 2025"
    const parts = g.monthTitle.split(' ')
    const year = parts.length > 1 ? parts[parts.length - 1] : 'Other'
    const shortMonth = parts[0].slice(0, 3)

    if (!yearsMap.has(year)) {
      yearsMap.set(year, [])
    }

    yearsMap.get(year).push({
      groupTitle: g.monthTitle,
      shortMonth,
      count: g.items.length
    })
  }

  return Array.from(yearsMap.entries()).map(([year, months]) => ({
    year,
    months
  }))
})

const loadPhotos = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/photos')
    timeline.value = res || []
  } catch {
    timeline.value = []
  } finally {
    loading.value = false
  }
}

const toggleSelectPhoto = (id) => {
  if (selectedPhotoIds.value.has(id)) {
    selectedPhotoIds.value.delete(id)
  } else {
    selectedPhotoIds.value.add(id)
  }
}

const handleCardClick = (photo, e) => {
  if (selectedPhotoIds.value.size > 0 || e.shiftKey) {
    toggleSelectPhoto(photo.id)
    return
  }
  const idx = filteredPhotos.value.findIndex(p => p.id === photo.id)
  selectedPhotoIndex.value = idx >= 0 ? idx : 0
  showLightbox.value = true
}

const scrollToMonth = (groupTitle) => {
  if (!groupTitle) return
  const el = document.getElementById(`group_${slugify(groupTitle)}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeScrubberMonth.value = groupTitle
    const parts = groupTitle.split(' ')
    if (parts.length > 1) activeScrubberYear.value = parts[parts.length - 1]
  }
}

const handleScroll = () => {
  if (!scrollContainerRef.value) return
  const sections = scrollContainerRef.value.querySelectorAll('.timeline-section')
  const containerTop = scrollContainerRef.value.getBoundingClientRect().top

  for (const s of sections) {
    const rect = s.getBoundingClientRect()
    if (rect.top - containerTop <= 80 && rect.bottom - containerTop > 40) {
      const title = s.getAttribute('data-group-title')
      if (title) {
        activeScrubberMonth.value = title
        const parts = title.split(' ')
        if (parts.length > 1) activeScrubberYear.value = parts[parts.length - 1]
      }
      break
    }
  }
}

const downloadSelectedZip = () => {
  const selectedItems = allFlattenedPhotos.value.filter(p => selectedPhotoIds.value.has(p.id))
  if (selectedItems.length === 0) return

  const paths = selectedItems.map(p => p.relativePath)
  const params = new URLSearchParams()
  params.set('zipName', `photos_selection_${new Date().toISOString().slice(0, 10)}.zip`)
  for (const p of paths) {
    params.append('path', p)
  }
  const a = document.createElement('a')
  a.href = `/api/download-zip?${params.toString()}`
  a.download = `photos_selection.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  success('Download started', `Downloading ${selectedItems.length} photos as ZIP`)
}

const deleteSelected = async (permanent = false) => {
  const selectedItems = allFlattenedPhotos.value.filter(p => selectedPhotoIds.value.has(p.id))
  if (selectedItems.length === 0) return

  const isMulti = selectedItems.length > 1
  const confirmed = await askConfirm({
    title: permanent 
      ? (isMulti ? `Permanently delete ${selectedItems.length} photos?` : 'Permanently delete photo?')
      : (isMulti ? `Move ${selectedItems.length} photos to Trash?` : 'Move photo to Trash?'),
    message: permanent 
      ? `⚠️ This will permanently remove ${selectedItems.length} media items from your server disk.\nThis cannot be undone!`
      : `Are you sure you want to move ${selectedItems.length} ${isMulti ? 'photos' : 'photo'} to the Trash bin?`,
    confirmText: permanent ? 'Delete Permanently' : 'Move to Trash',
    type: permanent ? 'danger' : 'warning',
    icon: permanent ? 'flame' : 'trash'
  })
  if (!confirmed) return

  try {
    const paths = selectedItems.map(p => p.relativePath)
    await $fetch('/api/delete', {
      method: 'POST',
      body: { paths, permanent }
    })
    selectedPhotoIds.value.clear()
    await loadPhotos()
    success(
      permanent ? 'Permanently Deleted' : 'Moved to Trash',
      `${selectedItems.length} items ${permanent ? 'permanently deleted' : 'moved to trash'}`
    )
  } catch (err) {
    error('Delete failed', err?.data?.statusMessage || 'Could not delete photos')
  }
}

const vReveal = {
  mounted(el) {
    el.classList.add('photo-card-reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          el.classList.add('is-revealed')
        }
      })
    }, {
      root: scrollContainerRef.value,
      rootMargin: '60px 0px 60px 0px',
      threshold: 0.05
    })
    observer.observe(el)
    el._revealObserver = observer
  },
  unmounted(el) {
    if (el._revealObserver) {
      el._revealObserver.disconnect()
    }
  }
}

onMounted(() => {
  loadPhotos()
})

defineExpose({ loadPhotos })
</script>

<style scoped>
.photo-card-reveal {
  opacity: 0;
  transform: scale(0.86) translateY(24px);
  filter: blur(4px);
  transition: opacity 0.48s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.48s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.48s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reveal-delay, 0ms);
  will-change: opacity, transform, filter;
}

.photo-card-reveal.is-revealed {
  opacity: 1;
  transform: scale(1) translateY(0);
  filter: blur(0px);
}
</style>
