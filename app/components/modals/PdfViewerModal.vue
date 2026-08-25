<template>
  <Transition name="modal-fade">
    <div 
      v-if="show && item" 
      class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden"
      @keydown="handleKeyDown"
      @click.self="$emit('close')"
      tabindex="0"
      ref="modalContainerRef"
    >
      <!-- PDF Top Navigation Bar -->
      <div class="w-full max-w-7xl flex items-center justify-between py-2 px-3 sm:px-5 rounded-2xl glass-modal border border-white/20 dark:border-white/10 shrink-0 text-sm mb-2 sm:mb-3 shadow-2xl z-20 gap-2">
        <!-- Left: Document Details & Sidebar Toggle -->
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            @click="toggleSidebar"
            class="p-2 rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            :class="showSidebar ? 'accent-bg text-white border-transparent shadow-sm' : 'border-black/10 dark:border-white/15 text-[#64748b] dark:text-[#cbd5e1] hover:bg-black/5 dark:hover:bg-white/10'"
            title="Toggle Page Thumbnails Sidebar"
          >
            <SidebarIcon class="w-4 h-4" />
            <span class="hidden md:inline text-xs font-semibold">Pages</span>
          </button>

          <div class="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
            <FileTextIcon class="w-4 h-4" />
          </div>

          <div class="flex flex-col min-w-0">
            <span class="font-bold text-xs sm:text-sm text-[#0f172a] dark:text-[#fafafa] truncate max-w-[180px] sm:max-w-xs md:max-w-md">{{ item.name }}</span>
            <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] truncate font-mono">
              {{ formatBytes(item.size || 0) }}
            </span>
          </div>
        </div>

        <!-- Center: Page Navigation & Zoom Controls -->
        <div class="flex items-center gap-1 sm:gap-2 shrink-0">
          <!-- Page Pager -->
          <div class="flex items-center border border-black/10 dark:border-white/15 rounded-xl p-1 bg-black/5 dark:bg-white/5 text-xs font-mono">
            <button 
              @click="prevPage" 
              :disabled="currentPage <= 1"
              class="p-1 rounded-lg hover:bg-white dark:hover:bg-white/20 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeftIcon class="w-4 h-4" />
            </button>

            <div class="flex items-center px-1.5 gap-1 text-xs">
              <input 
                type="number" 
                min="1" 
                :max="totalPages" 
                v-model.number="pageInput"
                @keyup.enter="jumpToPage"
                @blur="jumpToPage"
                class="w-10 text-center font-bold bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 rounded-md text-[#0f172a] dark:text-[#fafafa] py-0.5 focus:outline-none focus:border-indigo-500"
              />
              <span class="text-[#64748b] dark:text-[#71717a]">/ {{ totalPages || 1 }}</span>
            </div>

            <button 
              @click="nextPage" 
              :disabled="currentPage >= totalPages"
              class="p-1 rounded-lg hover:bg-white dark:hover:bg-white/20 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Next Page (Right Arrow / Space)"
            >
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </div>

          <!-- Zoom Controls -->
          <div class="hidden sm:flex items-center border border-black/10 dark:border-white/15 rounded-xl p-1 bg-black/5 dark:bg-white/5 text-xs font-mono">
            <button 
              @click="zoomOut" 
              :disabled="scale <= 0.4"
              class="p-1 rounded-lg hover:bg-white dark:hover:bg-white/20 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOutIcon class="w-4 h-4" />
            </button>

            <button 
              @click="resetZoom"
              class="px-2 py-0.5 text-xs font-bold text-[#0f172a] dark:text-[#fafafa] hover:text-indigo-500 cursor-pointer min-w-[52px] text-center"
              title="Reset Zoom to 100%"
            >
              {{ Math.round(scale * 100) }}%
            </button>

            <button 
              @click="zoomIn" 
              :disabled="scale >= 3.0"
              class="p-1 rounded-lg hover:bg-white dark:hover:bg-white/20 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomInIcon class="w-4 h-4" />
            </button>
          </div>

          <!-- Fit Width -->
          <button 
            @click="fitWidth" 
            class="hidden md:flex items-center gap-1 p-2 rounded-xl border border-black/10 dark:border-white/15 text-[#64748b] dark:text-[#cbd5e1] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#0f172a] dark:hover:text-white transition-all cursor-pointer text-xs"
            title="Fit to Width"
          >
            <Maximize2Icon class="w-3.5 h-3.5" />
            <span>Fit Width</span>
          </button>

          <!-- Rotate -->
          <button 
            @click="rotateClockwise" 
            class="p-2 rounded-xl border border-black/10 dark:border-white/15 text-[#64748b] dark:text-[#cbd5e1] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#0f172a] dark:hover:text-white transition-all cursor-pointer"
            title="Rotate Clockwise 90°"
          >
            <RotateCwIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Right: Actions & Close -->
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <!-- Print -->
          <button 
            @click="printPdf" 
            class="hidden sm:flex p-2 rounded-xl text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Print PDF"
          >
            <PrinterIcon class="w-4 h-4" />
          </button>

          <!-- Download -->
          <a 
            v-if="item.url" 
            :href="`${item.url}?download=1`" 
            class="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/15 rounded-xl text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] transition-all active:scale-95 cursor-pointer"
            title="Download PDF File"
          >
            <DownloadIcon class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Download</span>
          </a>

          <!-- Close -->
          <button 
            @click="$emit('close')" 
            class="p-2 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors active:scale-95 cursor-pointer"
            title="Close PDF Viewer (Esc)"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Main Viewer Area (Sidebar + Canvas Viewport) -->
      <div class="w-full max-w-7xl flex-1 flex min-h-0 rounded-2xl glass-modal border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden relative">
        <!-- Loading State Indicator -->
        <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-xs z-30">
          <Loader2Icon class="w-10 h-10 animate-spin accent-text" />
          <span class="text-xs font-semibold text-white">Rendering PDF document...</span>
          <span v-if="loadingProgress > 0" class="text-[11px] font-mono text-white/70">{{ loadingProgress }}% loaded</span>
        </div>

        <!-- Left Page Thumbnails Sidebar with Live Previews -->
        <Transition name="slide-left">
          <div 
            v-if="showSidebar" 
            class="w-48 sm:w-56 shrink-0 border-r border-black/10 dark:border-white/10 bg-black/20 dark:bg-black/40 flex flex-col h-full overflow-hidden select-none"
          >
            <div class="p-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-bold text-[#0f172a] dark:text-white">
              <span>Page Thumbnails</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">{{ totalPages }} pages</span>
            </div>

            <!-- Live Thumbnail List -->
            <div class="flex-1 overflow-y-auto p-3 space-y-3">
              <div 
                v-for="pageIndex in totalPages" 
                :key="pageIndex"
                @click="goToPage(pageIndex)"
                class="group flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer"
                :class="currentPage === pageIndex ? 'border-indigo-500 bg-indigo-500/15 shadow-md scale-[1.02]' : 'border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/30 bg-white/40 dark:bg-white/5'"
              >
                <!-- Miniature Preview Canvas -->
                <div class="w-full aspect-[1/1.414] bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center relative border border-black/5 dark:border-white/10">
                  <canvas 
                    :ref="el => setThumbnailCanvas(el, pageIndex)" 
                    class="w-full h-full object-contain block bg-white"
                  ></canvas>
                </div>
                <span class="text-[11px] font-bold mt-1 text-[#0f172a] dark:text-[#fafafa]">
                  Page {{ pageIndex }}
                </span>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Main PDF Canvas Viewport with Smooth Scroll & Wheel Page Flip -->
        <div 
          ref="viewportRef"
          class="flex-1 h-full overflow-y-auto overflow-x-auto p-4 sm:p-8 flex flex-col items-center justify-start relative bg-[#525659]/80 dark:bg-[#18181b]/90 select-text"
          @wheel="handleViewportWheel"
        >
          <!-- Canvas Wrapper with drop shadow and margins for smooth scroll -->
          <div class="relative rounded-lg shadow-2xl transition-all duration-150 my-4 bg-white overflow-hidden shrink-0">
            <canvas ref="canvasRef" class="rounded-lg max-w-none block bg-white"></canvas>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, shallowRef, markRaw, watch, nextTick, onBeforeUnmount } from 'vue'
import { 
  FileText as FileTextIcon, 
  X as XIcon, 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon, 
  ZoomIn as ZoomInIcon, 
  ZoomOut as ZoomOutIcon, 
  RotateCw as RotateCwIcon, 
  Maximize2 as Maximize2Icon, 
  Download as DownloadIcon, 
  Printer as PrinterIcon, 
  PanelLeft as SidebarIcon,
  Loader2 as Loader2Icon 
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null }
})

const emit = defineEmits(['close'])

const { formatBytes } = useFileHelpers()
const { error } = useToast()

const canvasRef = ref(null)
const viewportRef = ref(null)
const modalContainerRef = ref(null)

const pdfDoc = shallowRef(null)
const currentPage = ref(1)
const pageInput = ref(1)
const totalPages = ref(1)
const scale = ref(1.2)
const rotation = ref(0)
const isLoading = ref(false)
const loadingProgress = ref(0)
const showSidebar = ref(false)
let renderTask = null
let isWheelFlipping = false
const thumbnailCanvases = new Map()

// Dynamic browser-side loader for PDF.js (zero Node.js memory footprint)
const initPdfJs = async () => {
  if (typeof window === 'undefined') return null
  if (window.pdfjsLib) return window.pdfjsLib

  await new Promise((resolve, reject) => {
    const existing = document.getElementById('pdfjs-cdn-script')
    if (existing) {
      if (window.pdfjsLib) return resolve()
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.id = 'pdfjs-cdn-script'
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      }
      resolve()
    }
    script.onerror = reject
    document.head.appendChild(script)
  })

  return window.pdfjsLib
}

const setThumbnailCanvas = (el, pageIndex) => {
  if (el) {
    thumbnailCanvases.set(pageIndex, el)
    if (pdfDoc.value && showSidebar.value) {
      renderThumbnailPage(pageIndex, el)
    }
  } else {
    thumbnailCanvases.delete(pageIndex)
  }
}

const renderThumbnailPage = async (pageIndex, canvas) => {
  if (!pdfDoc.value || !canvas) return
  try {
    const page = await pdfDoc.value.getPage(pageIndex)
    const ctx = canvas.getContext('2d')
    const viewport = page.getViewport({ scale: 0.22, rotation: rotation.value })
    canvas.height = viewport.height
    canvas.width = viewport.width
    await page.render({ canvasContext: ctx, viewport }).promise
  } catch (err) {
    console.error('Error rendering thumbnail:', err)
  }
}

const renderAllThumbnails = () => {
  if (!pdfDoc.value) return
  for (const [pageIndex, canvas] of thumbnailCanvases.entries()) {
    renderThumbnailPage(pageIndex, canvas)
  }
}

const loadPdfDocument = async () => {
  if (!props.item?.url) return
  isLoading.value = true
  loadingProgress.value = 0
  currentPage.value = 1
  pageInput.value = 1
  rotation.value = 0

  try {
    const lib = await initPdfJs()
    if (!lib) throw new Error('PDF.js failed to initialize')

    const loadingTask = lib.getDocument({
      url: props.item.url,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true
    })

    loadingTask.onProgress = (progress) => {
      if (progress.total > 0) {
        loadingProgress.value = Math.round((progress.loaded / progress.total) * 100)
      }
    }

    const doc = await loadingTask.promise
    pdfDoc.value = markRaw(doc)
    totalPages.value = doc.numPages
    await renderCurrentPage()
    
    if (showSidebar.value) {
      nextTick(() => renderAllThumbnails())
    }
  } catch (err) {
    console.error('Failed to load PDF document:', err)
    error('PDF Error', 'Could not render PDF document.')
  } finally {
    isLoading.value = false
  }
}

const renderCurrentPage = async () => {
  if (!pdfDoc.value || !canvasRef.value) return
  
  if (renderTask) {
    try {
      renderTask.cancel()
    } catch {}
  }

  try {
    const page = await pdfDoc.value.getPage(currentPage.value)
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })

    const pixelRatio = window.devicePixelRatio || 1
    const viewport = page.getViewport({ scale: scale.value * pixelRatio, rotation: rotation.value })

    canvas.height = viewport.height
    canvas.width = viewport.width
    canvas.style.height = `${viewport.height / pixelRatio}px`
    canvas.style.width = `${viewport.width / pixelRatio}px`

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    }

    renderTask = page.render(renderContext)
    await renderTask.promise
    pageInput.value = currentPage.value
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      console.error('Error rendering page:', err)
    }
  }
}

watch(() => props.show, async (newVal) => {
  if (newVal && props.item) {
    await nextTick()
    modalContainerRef.value?.focus()
    await loadPdfDocument()
  } else {
    if (pdfDoc.value) {
      try {
        pdfDoc.value?.cleanup?.()
      } catch {}
      pdfDoc.value = null
    }
  }
})

watch(showSidebar, (newVal) => {
  if (newVal) {
    nextTick(() => {
      renderAllThumbnails()
    })
  }
})

const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--
    await renderCurrentPage()
  }
}

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    await renderCurrentPage()
  }
}

const goToPage = async (num) => {
  if (num >= 1 && num <= totalPages.value) {
    currentPage.value = num
    await renderCurrentPage()
  }
}

const jumpToPage = () => {
  const target = parseInt(pageInput.value, 10)
  if (!isNaN(target) && target >= 1 && target <= totalPages.value) {
    goToPage(target)
  } else {
    pageInput.value = currentPage.value
  }
}

const zoomIn = async () => {
  scale.value = Math.min(3.0, Number((scale.value + 0.25).toFixed(2)))
  await renderCurrentPage()
}

const zoomOut = async () => {
  scale.value = Math.max(0.4, Number((scale.value - 0.25).toFixed(2)))
  await renderCurrentPage()
}

const resetZoom = async () => {
  scale.value = 1.0
  await renderCurrentPage()
}

const fitWidth = async () => {
  if (!viewportRef.value || !pdfDoc.value) return
  try {
    const page = await pdfDoc.value.getPage(currentPage.value)
    const baseViewport = page.getViewport({ scale: 1.0, rotation: rotation.value })
    const availableWidth = viewportRef.value.clientWidth - 64
    if (availableWidth > 100 && baseViewport.width > 0) {
      scale.value = Math.max(0.4, Number((availableWidth / baseViewport.width).toFixed(2)))
      await renderCurrentPage()
    }
  } catch (e) {
    console.error('Error in fitWidth:', e)
  }
}

const rotateClockwise = async () => {
  rotation.value = (rotation.value + 90) % 360
  await renderCurrentPage()
  if (showSidebar.value) {
    renderAllThumbnails()
  }
}

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const printPdf = () => {
  if (!props.item?.url) return
  const printWindow = window.open(props.item.url, '_blank')
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

const handleViewportWheel = (e) => {
  if (e.ctrlKey) {
    e.preventDefault()
    if (e.deltaY < 0) zoomIn()
    else zoomOut()
    return
  }

  const el = viewportRef.value
  if (!el || totalPages.value <= 1) return

  const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 10
  const isAtTop = el.scrollTop <= 10

  if (e.deltaY > 50 && isAtBottom && currentPage.value < totalPages.value) {
    if (!isWheelFlipping) {
      isWheelFlipping = true
      nextPage().then(() => {
        if (viewportRef.value) viewportRef.value.scrollTop = 0
        setTimeout(() => { isWheelFlipping = false }, 350)
      })
    }
  } else if (e.deltaY < -50 && isAtTop && currentPage.value > 1) {
    if (!isWheelFlipping) {
      isWheelFlipping = true
      prevPage().then(() => {
        if (viewportRef.value) viewportRef.value.scrollTop = viewportRef.value.scrollHeight
        setTimeout(() => { isWheelFlipping = false }, 350)
      })
    }
  }
}

const handleKeyDown = (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return

  if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'k') {
    e.preventDefault()
    prevPage()
  } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'j' || e.key === ' ') {
    e.preventDefault()
    nextPage()
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault()
    zoomIn()
  } else if (e.key === '-') {
    e.preventDefault()
    zoomOut()
  } else if (e.key === '0') {
    e.preventDefault()
    resetZoom()
  } else if (e.key === 'Escape') {
    emit('close')
  }
}
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.2s ease;
}
.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
