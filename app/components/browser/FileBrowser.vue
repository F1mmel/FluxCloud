<template>
  <div class="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-transparent transition-colors duration-200">
    <!-- Sub-header: Breadcrumbs & Selection Ribbon -->
    <div class="relative z-30 border-b border-black/5 dark:border-white/10 glass-card bg-white/40 dark:bg-white/10 px-6 py-2 flex items-center justify-between shrink-0 transition-all duration-200">
      <FileBreadcrumbs 
        :current-path="currentPath" 
        @navigate="(p) => $emit('navigate', p)" 
        @drop-to-path="handleBreadcrumbDrop"
      />

      <div class="flex items-center gap-2 text-xs text-[#64748b] dark:text-[#cbd5e1]">
        <span>{{ files.length }} {{ files.length === 1 ? 'item' : 'items' }}</span>
        <button 
          v-if="selectedDetailsItem" 
          @click="selectedDetailsItem = null" 
          class="hover:text-[#0f172a] dark:hover:text-[#fafafa] p-1 ml-2" 
          title="Close details sidebar"
        >
          <PanelRightCloseIcon class="w-4 h-4" />
        </button>
      </div>

      <!-- Concave Inner Corner (Exakt gleiche hellere Glas-Farbe wie FileBrowser Table Header) -->
      <div class="absolute top-full left-0 w-5 h-5 pointer-events-none z-30 overflow-hidden">
        <div class="w-full h-full glass-card bg-white/40 dark:bg-white/10 concave-glass-corner"></div>
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 20 20" fill="none">
          <path d="M20,0 A20,20 0 0,0 0,20" fill="none" stroke="currentColor" class="text-black/5 dark:text-white/10" stroke-width="1.2" />
        </svg>
      </div>
    </div>

    <!-- Main File Canvas -->
    <div class="flex-1 flex min-w-0 overflow-hidden relative">
      <div 
        ref="browserContainer"
        class="flex-1 overflow-y-auto p-6 select-none relative"
        @mousedown="handleCanvasMouseDown"
        @dragenter.prevent="isDraggingUpload = true"
      >
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center h-64 text-[#64748b] dark:text-[#71717a] gap-3">
          <Loader2Icon class="w-8 h-8 animate-spin accent-text" />
          <span class="text-sm">Loading files...</span>
        </div>

        <!-- Files List / Grid View -->
        <div v-else-if="files && files.length > 0">
          <FileList 
            v-if="viewMode === 'list'"
            :files="sortedFiles"
            :selected-items="selectedItems"
            :drag-over-folder="dragOverFolder"
            :all-selected="allSelected"
            :renaming-item-name="renamingItemName"
            @item-click="handleItemClick"
            @item-dblclick="handleItemDoubleClick"
            @item-contextmenu="handleItemContextMenu"
            @item-dragstart="handleDragStart"
            @item-dragover="handleDragOver"
            @item-dragleave="handleDragLeave"
            @item-drop="handleDropOnItem"
            @toggle-select="toggleItemSelect"
            @toggle-select-all="toggleSelectAll"
            @toggle-favorite="(it) => $emit('toggle-favorite', it)"
            @item-action="handleItemAction"
            @submit-rename="handleInlineRename"
            @cancel-rename="renamingItemName = null"
            @sort="handleSort"
          />

          <FileGrid 
            v-else
            :files="sortedFiles"
            :selected-items="selectedItems"
            :drag-over-folder="dragOverFolder"
            :renaming-item-name="renamingItemName"
            @item-click="handleItemClick"
            @item-dblclick="handleItemDoubleClick"
            @item-contextmenu="handleItemContextMenu"
            @item-dragstart="handleDragStart"
            @item-dragover="handleDragOver"
            @item-dragleave="handleDragLeave"
            @item-drop="handleDropOnItem"
            @toggle-select="toggleItemSelect"
            @toggle-favorite="(it) => $emit('toggle-favorite', it)"
            @item-action="handleItemAction"
            @submit-rename="handleInlineRename"
            @cancel-rename="renamingItemName = null"
          />
        </div>

        <!-- Empty Search State -->
        <div v-else-if="isSearching" class="border border-dashed border-[#cbd5e1] dark:border-[#27272a] rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto mt-12 glass-card shadow-sm">
          <SearchXIcon class="w-12 h-12 text-[#94a3b8] dark:text-[#52525b] mb-4" />
          <h3 class="text-base font-semibold text-[#0f172a] dark:text-[#fafafa] mb-1">No matching files</h3>
          <p class="text-xs text-[#64748b] dark:text-[#71717a] mb-4">No items matched your search query or filter.</p>
          <button @click="$emit('clear-search')" class="px-3.5 py-1.5 border border-[#cbd5e1] dark:border-[#27272a] hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-xs font-medium transition-all text-[#0f172a] dark:text-[#fafafa]">
            Clear Filter
          </button>
        </div>

        <!-- Empty Folder State -->
        <div v-else class="border border-dashed border-[#cbd5e1] dark:border-[#27272a] rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-12 glass-card shadow-sm">
          <div class="p-4 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 mb-4">
            <FolderOpenIcon class="w-12 h-12 text-[#94a3b8] dark:text-[#52525b]" />
          </div>
          <h3 class="text-base font-semibold text-[#0f172a] dark:text-[#fafafa] mb-1">This folder is empty</h3>
          <p class="text-xs text-[#64748b] dark:text-[#71717a] mb-6 max-w-xs">Drag and drop files anywhere here, or use the buttons below to create content.</p>
          <div class="flex items-center gap-3">
            <button @click="$emit('open-create-folder')" class="px-4 py-2 border border-[#cbd5e1] dark:border-[#27272a] hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-xs font-medium transition-all text-[#0f172a] dark:text-[#fafafa]">
              New Folder
            </button>
            <button @click="$emit('open-upload')" class="px-4 py-2 accent-bg accent-bg-hover rounded-xl text-xs font-medium transition-all text-white shadow-md active:scale-95">
              Upload Files
            </button>
          </div>
        </div>
      </div>

      <!-- Animated Details Sidebar -->
      <Transition name="slide-sidebar">
        <FileDetailsSidebar 
          v-if="selectedDetailsItem"
          :item="selectedDetailsItem"
          @close="selectedDetailsItem = null"
          @action="handleItemAction"
        />
      </Transition>
    </div>

    <!-- Lasso Multi-Select Box Overlay -->
    <FileSelectionBox :lasso="lasso" />

    <!-- Floating Action Bar for Selected Items -->
    <FileSelectionBar 
      :selected-count="selectedItems.size"
      @download-zip="handleBatchDownloadZip"
      @move-selected="$emit('open-move-modal', Array.from(selectedItems))"
      @delete-selected="handleBatchDelete"
      @clear-selection="clearSelection"
    />

    <!-- File Drop Zone Overlay -->
    <FileDropZone 
      :active="isDraggingUpload"
      :current-path="currentPath"
      @leave="isDraggingUpload = false"
      @drop="handleUploadFilesDrop"
    />

    <!-- Right-Click Context Menu -->
    <FileContextMenu 
      :visible="contextMenu.visible"
      :position="contextMenu.position"
      :item="contextMenu.item"
      @close="contextMenu.visible = false"
      @action="handleContextMenuAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  PanelRightClose as PanelRightCloseIcon, 
  Loader2 as Loader2Icon, 
  SearchX as SearchXIcon, 
  FolderOpen as FolderOpenIcon 
} from 'lucide-vue-next'
import FileBreadcrumbs from './FileBreadcrumbs.vue'
import FileSelectionBar from './FileSelectionBar.vue'
import FileSelectionBox from './FileSelectionBox.vue'
import FileContextMenu from './FileContextMenu.vue'
import FileDetailsSidebar from './FileDetailsSidebar.vue'
import FileDropZone from './FileDropZone.vue'
import FileGrid from './FileGrid.vue'
import FileList from './FileList.vue'
import { useLasso } from '../../composables/useLasso'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useFavorites } from '../../composables/useFavorites'
import { useShares } from '../../composables/useShares'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  files: { type: Array, default: () => [] },
  currentPath: { type: String, default: '' },
  viewMode: { type: String, default: 'list' },
  loading: { type: Boolean, default: false },
  isSearching: { type: Boolean, default: false }
})

const emit = defineEmits([
  'navigate',
  'refresh',
  'open-create-folder',
  'open-upload',
  'open-share-modal',
  'open-preview-modal',
  'open-editor-modal',
  'open-direct-link-modal',
  'open-rename-modal',
  'open-move-modal',
  'toggle-favorite',
  'clear-search',
  'upload-files',
  'delete-items',
  'move-items'
])

const { copyToClipboard } = useFileHelpers()
const { success, info, error } = useToast()
const { isFavorite, toggleFavorite, syncFavoritesFromFiles } = useFavorites()
const { syncSharesFromFiles, loadShares } = useShares()

onMounted(() => {
  loadShares()
})

// Sync favorites and shares reactively
watch(() => props.files, (newFiles) => {
  syncFavoritesFromFiles(newFiles)
  syncSharesFromFiles(newFiles)
}, { immediate: true })

const browserContainer = ref(null)
const selectedItems = ref(new Set())
const selectedDetailsItem = ref(null)
const dragOverFolder = ref(null)
const isDraggingUpload = ref(false)
const renamingItemName = ref(null)

// Sorting
const sortBy = ref('name')
const sortOrder = ref('asc')

const handleSort = (column) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
}

const sortedFiles = computed(() => {
  const list = [...props.files]
  return list.sort((a, b) => {
    // Folders always first
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1

    let res = 0
    if (sortBy.value === 'name') {
      res = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    } else if (sortBy.value === 'size') {
      res = (a.size || 0) - (b.size || 0)
    } else if (sortBy.value === 'date') {
      const dateA = new Date(a.modifiedAt || a.createdAt).getTime()
      const dateB = new Date(b.modifiedAt || b.createdAt).getTime()
      res = dateA - dateB
    }

    return sortOrder.value === 'asc' ? res : -res
  })
})

// Lasso Selection
const { lasso, startLasso, stopLasso } = useLasso(() => browserContainer.value, selectedItems)

const handleCanvasMouseDown = (e) => {
  startLasso(e)
}

// Selection handlers
const allSelected = computed(() => {
  if (!props.files || props.files.length === 0) return false
  return selectedItems.value.size === props.files.length
})

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    props.files.forEach(f => selectedItems.value.add(f.name))
  } else {
    clearSelection()
  }
}

const toggleItemSelect = (name, event) => {
  if (selectedItems.value.has(name)) {
    selectedItems.value.delete(name)
  } else {
    selectedItems.value.add(name)
  }
}

const clearSelection = () => {
  selectedItems.value.clear()
}

// Single Click Handler: Navigate for folders, animated details sidebar for files!
const handleItemClick = (item, e) => {
  if (e.ctrlKey || e.metaKey || e.shiftKey) {
    toggleItemSelect(item.name)
    return
  }

  if (item.isDirectory) {
    const newPath = props.currentPath ? `${props.currentPath}/${item.name}` : item.name
    emit('navigate', newPath)
    clearSelection()
  } else {
    // Open details sidebar animated with preview, link, QR code, metadata
    selectedDetailsItem.value = item
  }
}

// Double Click Handler: Full file preview modal!
const handleItemDoubleClick = (item) => {
  if (item.isDirectory) {
    const newPath = props.currentPath ? `${props.currentPath}/${item.name}` : item.name
    emit('navigate', newPath)
    clearSelection()
  } else {
    emit('open-preview-modal', item)
  }
}

// Context Menu
const contextMenu = ref({
  visible: false,
  position: { x: 0, y: 0 },
  item: null
})

const handleItemContextMenu = (e, item) => {
  if (!selectedItems.value.has(item.name)) {
    clearSelection()
    selectedItems.value.add(item.name)
  }

  // Position context menu with boundary safety
  const menuWidth = 220
  const menuHeight = 360
  let x = e.clientX
  let y = e.clientY

  if (typeof window !== 'undefined') {
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10
  }

  contextMenu.value = {
    visible: true,
    position: { x, y },
    item
  }
}

const handleContextMenuAction = ({ action, item }) => {
  handleItemAction({ action, item })
}

const handleItemAction = async ({ action, item }) => {
  if (!item) return

  if (action === 'open') {
    handleItemDoubleClick(item)
  } else if (action === 'share') {
    emit('open-share-modal', item)
  } else if (action === 'direct-link' || action === 'copy-direct-url') {
    emit('open-direct-link-modal', item)
  } else if (action === 'toggle-favorite') {
    toggleFavorite(item)
    emit('toggle-favorite', item)
  } else if (action === 'download') {
    if (item.isDirectory) {
      // Download folder as ZIP
      emit('download-zip', [item.relativePath || item.name], item.name)
    } else if (item.url) {
      window.open(`${item.url}?download=1`, '_blank')
    }
  } else if (action === 'edit-code') {
    emit('open-editor-modal', item)
  } else if (action === 'details') {
    selectedDetailsItem.value = item
  } else if (action === 'rename') {
    renamingItemName.value = item.name
  } else if (action === 'move') {
    emit('open-move-modal', [item.relativePath || item.name])
  } else if (action === 'delete') {
    emit('delete-items', [item.relativePath || item.name])
  }
}

// Inline Rename Handler (No modal, inline instant save)
const handleInlineRename = async ({ item, newName }) => {
  renamingItemName.value = null
  if (!newName || newName.trim() === '' || newName === item.name) return

  try {
    await $fetch('/api/rename', {
      method: 'POST',
      body: {
        path: item.relativePath || item.name,
        newName: newName.trim()
      }
    })
    success('Renamed', `"${item.name}" renamed to "${newName.trim()}"`)
    emit('refresh')
  } catch (err) {
    error('Rename failed', err?.data?.statusMessage || 'Could not rename item')
  }
}

// F2 Keyboard Shortcut for Quick Rename
onMounted(() => {
  const onKeyDown = (e) => {
    // If inside an active input, ignore
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return

    if (e.key === 'F2') {
      if (selectedItems.value.size === 1) {
        const selectedName = Array.from(selectedItems.value)[0]
        renamingItemName.value = selectedName
        e.preventDefault()
      }
    }
  }
  window.addEventListener('keydown', onKeyDown)
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
  })
})

// Drag and drop moving
const handleDragStart = (e, item) => {
  if (!selectedItems.value.has(item.name)) {
    clearSelection()
    selectedItems.value.add(item.name)
  }

  const names = Array.from(selectedItems.value)
  const paths = names.map(n => props.currentPath ? `${props.currentPath}/${n}` : n)

  e.dataTransfer.setData('text/plain', JSON.stringify({
    sourcePath: props.currentPath,
    names,
    paths
  }))
}

const handleDragOver = (e, item) => {
  if (item.isDirectory && !selectedItems.value.has(item.name)) {
    dragOverFolder.value = item.name
  }
}

const handleDragLeave = () => {
  dragOverFolder.value = null
}

const handleDropOnItem = (e, targetFolder) => {
  dragOverFolder.value = null
  if (!targetFolder.isDirectory) return

  try {
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw) return
    const data = JSON.parse(raw)
    if (!data.names || data.names.length === 0) return

    const targetFolderPath = props.currentPath ? `${props.currentPath}/${targetFolder.name}` : targetFolder.name

    emit('move-items', {
      sourcePath: data.sourcePath,
      names: data.names,
      destinationPath: targetFolderPath
    })
    clearSelection()
  } catch (err) {
    console.error(err)
  }
}

const handleBreadcrumbDrop = (targetPath) => {
  try {
    const raw = window.__activeDragData || localStorage.getItem('fc_drag')
    if (!raw) return
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!data.names || data.names.length === 0) return

    emit('move-items', {
      sourcePath: data.sourcePath,
      names: data.names,
      destinationPath: targetPath
    })
    clearSelection()
  } catch (err) {
    console.error(err)
  }
}

// Batch Actions
const handleBatchDownloadZip = () => {
  const paths = Array.from(selectedItems.value).map(n => props.currentPath ? `${props.currentPath}/${n}` : n)
  emit('download-zip', paths, 'fluxcloud_selection')
}

const handleBatchDelete = () => {
  const paths = Array.from(selectedItems.value).map(n => props.currentPath ? `${props.currentPath}/${n}` : n)
  emit('delete-items', paths)
  clearSelection()
}

// File drop upload
const handleUploadFilesDrop = (e) => {
  isDraggingUpload.value = false
  const dropped = e.dataTransfer.files
  if (dropped && dropped.length > 0) {
    emit('upload-files', dropped)
  }
}
</script>
