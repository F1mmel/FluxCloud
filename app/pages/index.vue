<template>
  <div class="h-screen bg-transparent text-[#0f172a] dark:text-[#fafafa] font-sans antialiased overflow-hidden select-none transition-colors duration-200">
    <!-- 0. Loading Auth State -->
    <div v-if="isAuthLoading" class="h-screen w-full flex flex-col items-center justify-center gap-3">
      <Loader2Icon class="w-8 h-8 animate-spin accent-text" />
      <span class="text-xs text-[#64748b] dark:text-[#71717a]">Loading FluxCloud...</span>
    </div>

    <!-- 1. First-Run Setup / Login Screen (When Not Authenticated) -->
    <AuthView 
      v-else-if="!currentUser" 
      :config="config"
      @authenticated="handleAuthenticated" 
    />

    <!-- 2. Main Authenticated App Workspace -->
    <div v-else class="flex h-screen overflow-hidden">
      <!-- Main Sidebar -->
      <AppSidebar 
        :active-tab="activeTab"
        :config="config"
        :stats="storageStats"
        :shared-count="sharesList.length"
        :shared-with-me-count="sharedWithMeList.length"
        :trash-count="trashCount"
        @update:active-tab="handleTabChange"
        @logout="handleLogout"
        @open-storage-breakdown="showStorageBreakdownModal = true"
      />

      <!-- Main Content Views Container with Animated Transitions -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent transition-colors duration-200">
        <Transition name="fade-slide" mode="out-in">
          <!-- 1. All Files View -->
          <FilesView 
            v-if="activeTab === 'files'"
            key="tab-files"
            :files="files || []"
            :current-path="currentPath"
            :view-mode="viewMode"
            :search="searchQuery"
            :pending="filesPending"
            @navigate="navigateTo"
            @refresh="refreshAll"
            @update:search="searchQuery = $event"
            @update:view-mode="viewMode = $event"
            @clear-search="clearSearch"
            @open-create-folder="showCreateFolderModal = true"
            @open-upload="showUploadModal = true"
            @open-share-modal="openShareModal"
            @open-preview-modal="openPreviewModal"
            @open-editor-modal="openEditorModal"
            @open-direct-link-modal="openDirectLinkModal"
            @open-rename-modal="openRenameModal"
            @open-move-modal="openMoveModal"
            @toggle-favorite="handleToggleFavorite"
            @upload-files="handleUploadFiles"
            @delete-items="handleDeleteItems"
            @delete-items-permanent="handleDeleteItemsPermanent"
            @move-items="handleMoveItems"
            @download-zip="handleDownloadZip"
          />

          <!-- 2. Photos & Gallery View -->
          <PhotosView 
            v-else-if="activeTab === 'photos'"
            key="tab-photos"
            ref="photosViewRef"
          />

          <!-- 3. Shared with Me View -->
          <SharedWithMeView 
            v-else-if="activeTab === 'shared-with-me'"
            key="tab-shared-with-me"
            ref="sharedWithMeViewRef"
            @open-preview="openPreviewModal"
          />

          <!-- 4. Shared Links Manager View -->
          <SharedView 
            v-else-if="activeTab === 'shared'"
            key="tab-shared"
            ref="sharedViewRef"
            @edit-share="openShareModalFromShare"
          />

          <!-- 5. Favorites View -->
          <FavoritesView 
            v-else-if="activeTab === 'favorites'"
            key="tab-favorites"
            ref="favoritesViewRef"
            @navigate-to-folder="handleNavigateToFolder"
            @open-preview="openPreviewModal"
          />

          <!-- 6. Trash View -->
          <TrashView 
            v-else-if="activeTab === 'trash'"
            key="tab-trash"
            ref="trashViewRef"
            @trash-updated="trashCount = $event"
          />

          <!-- 7. Settings View -->
          <SettingsView 
            v-else-if="activeTab === 'settings'"
            key="tab-settings"
            ref="settingsViewRef"
            :config="config"
            @saved="handleConfigSaved"
          />
        </Transition>
      </div>

      <!-- Floating Resumable Upload Manager Widget -->
      <UploadManagerWidget />

      <!-- Modals -->
      <CreateFolderModal 
        :show="showCreateFolderModal"
        :current-path="currentPath"
        :is-submitting="isCreatingFolder"
        @close="showCreateFolderModal = false"
        @create="handleCreateFolder"
      />

      <UploadModal 
        :show="showUploadModal"
        :current-path="currentPath"
        :uploading="isUploading"
        @close="showUploadModal = false"
        @upload="handleUploadFiles"
      />

      <ShareModal 
        :show="showShareModal"
        :item="targetShareItem"
        @close="showShareModal = false"
        @created="handleShareCreated"
        @revoked="handleShareRevoked"
      />

      <DirectLinkModal 
        :show="showDirectLinkModal"
        :item="targetDirectLinkItem"
        @close="showDirectLinkModal = false"
      />

      <FilePreviewModal 
        :show="showPreviewModal"
        :item="targetPreviewItem"
        @close="showPreviewModal = false"
        @share="openShareModal"
        @edit="openEditorModalFromPreview"
      />

      <FileEditorModal 
        :show="showEditorModal"
        :item="targetEditorItem"
        @close="showEditorModal = false"
        @saved="handleEditorSaved"
      />

      <StorageBreakdownModal 
        :show="showStorageBreakdownModal"
        @close="showStorageBreakdownModal = false"
        @open-file="openPreviewModal"
      />

      <RenameModal 
        :show="showRenameModal"
        :item="targetRenameItem"
        :is-submitting="isRenaming"
        @close="showRenameModal = false"
        @rename="handleRenameItem"
      />

      <MoveModal 
        :show="showMoveModal"
        :items="targetMoveItems"
        :is-submitting="isMoving"
        @close="showMoveModal = false"
        @move="handleModalMove"
      />

      <!-- Dedicated PDF Viewer Modal -->
      <PdfViewerModal 
        :show="showPdfModal"
        :item="targetPdfItem"
        @close="showPdfModal = false"
      />

      <!-- Glassmorphic Confirmation Modal -->
      <ConfirmModal />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 as Loader2Icon } from 'lucide-vue-next'
import AppSidebar from '../components/layout/AppSidebar.vue'
import AuthView from '../components/auth/AuthView.vue'
import FilesView from '../components/views/FilesView.vue'
import PhotosView from '../components/views/PhotosView.vue'
import SharedWithMeView from '../components/views/SharedWithMeView.vue'
import SharedView from '../components/views/SharedView.vue'
import FavoritesView from '../components/views/FavoritesView.vue'
import TrashView from '../components/views/TrashView.vue'
import SettingsView from '../components/views/SettingsView.vue'
import CreateFolderModal from '../components/modals/CreateFolderModal.vue'
import UploadModal from '../components/modals/UploadModal.vue'
import ShareModal from '../components/modals/ShareModal.vue'
import DirectLinkModal from '../components/modals/DirectLinkModal.vue'
import FilePreviewModal from '../components/modals/FilePreviewModal.vue'
import FileEditorModal from '../components/modals/FileEditorModal.vue'
import StorageBreakdownModal from '../components/modals/StorageBreakdownModal.vue'
import RenameModal from '../components/modals/RenameModal.vue'
import MoveModal from '../components/modals/MoveModal.vue'
import UploadManagerWidget from '../components/upload/UploadManagerWidget.vue'
import ConfirmModal from '../components/modals/ConfirmModal.vue'
import PdfViewerModal from '../components/modals/PdfViewerModal.vue'
import { useToast } from '../composables/useToast'
import { useTheme } from '../composables/useTheme'
import { useAuth } from '../composables/useAuth'
import { useUploadManager } from '../composables/useUploadManager'
import { useConfirm } from '../composables/useConfirm'
import { useFileHelpers } from '../composables/useFileHelpers'

const route = useRoute()
const router = useRouter()
const { success, error, info } = useToast()
const { initTheme } = useTheme()
const { currentUser, isAuthLoading, checkAuthStatus } = useAuth()
const { enqueueFiles, completedCount } = useUploadManager()
const { askConfirm } = useConfirm()

// Global App State from URL Query params
const validTabs = ['files', 'photos', 'shared-with-me', 'shared', 'favorites', 'trash', 'settings']
const initialTab = typeof route.query.tab === 'string' && validTabs.includes(route.query.tab) ? route.query.tab : 'files'
const initialPath = typeof route.query.path === 'string' ? route.query.path : ''

const activeTab = ref(initialTab)
const currentPath = ref(initialPath)
const viewMode = ref('list')
const searchQuery = ref('')
const categoryFilter = ref('all')
const trashCount = ref(0)
const sharesList = ref([])
const sharedWithMeList = ref([])
const photosViewRef = ref(null)
const sharedWithMeViewRef = ref(null)

// Sync URL query params with tab and folder path changes
const syncUrlParams = () => {
  const query = { ...route.query }
  query.tab = activeTab.value
  if (activeTab.value === 'files' && currentPath.value) {
    query.path = currentPath.value
  } else {
    delete query.path
  }
  router.replace({ query })
}

// Watch state changes to update URL
watch([activeTab, currentPath], () => {
  syncUrlParams()
})

// Watch route back/forward navigation
watch(() => route.query, (newQuery) => {
  const tabStr = typeof newQuery.tab === 'string' ? newQuery.tab : ''
  if (tabStr && validTabs.includes(tabStr) && tabStr !== activeTab.value) {
    activeTab.value = tabStr
  }
  const queryPath = typeof newQuery.path === 'string' ? newQuery.path : ''
  if (queryPath !== currentPath.value) {
    currentPath.value = queryPath
  }
})

// Refs to views
const sharedViewRef = ref(null)
const favoritesViewRef = ref(null)
const trashViewRef = ref(null)

// Config & Server Stats
const { data: config, refresh: refreshConfig } = useFetch('/api/config')
const { data: storageStats, refresh: refreshStats } = useFetch('/api/storage-stats')

// Files Fetching
const { data: files, pending: filesPending, refresh: refreshFiles } = useFetch(
  () => `/api/files?path=${encodeURIComponent(currentPath.value)}&search=${encodeURIComponent(searchQuery.value)}&category=${encodeURIComponent(categoryFilter.value)}`,
  { watch: [currentPath, searchQuery, categoryFilter] }
)

const loadSharesCount = async () => {
  try {
    const res = await $fetch('/api/shares')
    sharesList.value = res || []
  } catch {}
}

const loadTrashCount = async () => {
  try {
    const res = await $fetch('/api/trash')
    trashCount.value = (res || []).length
  } catch {}
}

const handleAuthenticated = async (user) => {
  currentUser.value = user
  await refreshAll()
}

const handleLogout = () => {
  currentUser.value = null
}

onMounted(async () => {
  initTheme()
  await checkAuthStatus()
  syncUrlParams()
  if (currentUser.value) {
    loadSharesCount()
    loadSharedWithMe()
    loadTrashCount()
  }
})

const refreshAll = async () => {
  await Promise.all([
    refreshFiles(),
    refreshStats(),
    loadSharesCount(),
    loadSharedWithMe(),
    loadTrashCount()
  ])
}

const handleTabChange = async (tab) => {
  activeTab.value = tab
  if (tab === 'files') {
    await refreshFiles()
  } else if (tab === 'photos') {
    photosViewRef.value?.loadPhotos()
  } else if (tab === 'shared-with-me') {
    sharedWithMeViewRef.value?.loadSharedWithMe()
  } else if (tab === 'shared') {
    sharedViewRef.value?.loadShares()
  } else if (tab === 'favorites') {
    favoritesViewRef.value?.loadFavorites()
  } else if (tab === 'trash') {
    trashViewRef.value?.loadTrash()
  } else if (tab === 'settings') {
    await refreshConfig()
  }
}

const navigateTo = (path) => {
  currentPath.value = path
  searchQuery.value = ''
  categoryFilter.value = 'all'
}

const clearSearch = () => {
  searchQuery.value = ''
  categoryFilter.value = 'all'
}

const handleNavigateToFolder = (relPath) => {
  activeTab.value = 'files'
  currentPath.value = relPath
}

// Modals State
const showCreateFolderModal = ref(false)
const isCreatingFolder = ref(false)
const showUploadModal = ref(false)
const isUploading = ref(false)
const showShareModal = ref(false)
const targetShareItem = ref(null)
const showDirectLinkModal = ref(false)
const targetDirectLinkItem = ref(null)
const showPreviewModal = ref(false)
const targetPreviewItem = ref(null)
const showPdfModal = ref(false)
const targetPdfItem = ref(null)
const showEditorModal = ref(false)
const targetEditorItem = ref(null)
const showStorageBreakdownModal = ref(false)
const showRenameModal = ref(false)
const targetRenameItem = ref(null)
const isRenaming = ref(false)
const showMoveModal = ref(false)
const targetMoveItems = ref([])
const isMoving = ref(false)

const { isPdf } = useFileHelpers()

const openShareModal = (item) => {
  targetShareItem.value = item
  showShareModal.value = true
}

const openDirectLinkModal = (item) => {
  targetDirectLinkItem.value = item
  showDirectLinkModal.value = true
}

const openShareModalFromShare = (share) => {
  targetShareItem.value = {
    name: share.fileName,
    relativePath: share.displayPath || share.targetPath,
    isDirectory: share.isDirectory,
    shareId: share.id,
    isShared: true,
    shareData: share,
    openConfigure: true
  }
  showShareModal.value = true
}

const handleShareCreated = (share) => {
  loadSharesCount()
  if (sharedViewRef.value?.loadShares) {
    sharedViewRef.value.loadShares()
  }
}

const handleShareRevoked = async (shareId) => {
  await loadSharesCount()
  if (sharedViewRef.value?.loadShares) {
    await sharedViewRef.value.loadShares()
  }
  await refreshFiles()
}

const openPreviewModal = (item) => {
  if (item && !item.isDirectory && isPdf(item.name)) {
    targetPdfItem.value = item
    showPdfModal.value = true
    return
  }
  targetPreviewItem.value = item
  showPreviewModal.value = true
}

const openEditorModal = (item) => {
  targetEditorItem.value = item
  showEditorModal.value = true
}

const openEditorModalFromPreview = (item) => {
  showPreviewModal.value = false
  openEditorModal(item)
}

const handleEditorSaved = async () => {
  await refreshFiles()
  await refreshStats()
}

const openRenameModal = (item) => {
  targetRenameItem.value = item
  showRenameModal.value = true
}

const openMoveModal = (items) => {
  targetMoveItems.value = items
  showMoveModal.value = true
}

// Auth Error Interceptor
const checkAuthError = (err) => {
  if (err?.statusCode === 401 || err?.data?.statusCode === 401) {
    currentUser.value = null
    error('Access Denied', 'Your user account no longer exists or session has expired.')
    return true
  }
  return false
}

// File Actions
const handleCreateFolder = async (folderName) => {
  isCreatingFolder.value = true
  try {
    await $fetch('/api/folder', {
      method: 'POST',
      body: {
        path: currentPath.value,
        name: folderName
      }
    })
    showCreateFolderModal.value = false
    await refreshFiles()
    await refreshStats()
    success('Folder created', `Created folder "${folderName}"`)
  } catch (err) {
    if (!checkAuthError(err)) {
      error('Error', err?.data?.statusMessage || 'Failed to create folder')
    }
  } finally {
    isCreatingFolder.value = false
  }
}

const handleUploadFiles = (fileList) => {
  showUploadModal.value = false
  enqueueFiles(fileList, currentPath.value)
  info('Upload started', `Queued ${fileList.length} files in Upload Manager`)
}

watch(completedCount, (newVal, oldVal) => {
  if (newVal > oldVal) {
    refreshFiles()
    refreshStats()
    if (photosViewRef.value?.loadPhotos) {
      photosViewRef.value.loadPhotos()
    }
  }
})

const loadSharedWithMe = async () => {
  try {
    const res = await $fetch('/api/shared-with-me')
    sharedWithMeList.value = res || []
  } catch {
    sharedWithMeList.value = []
  }
}

const handleDeleteItems = async (paths) => {
  const isMulti = paths.length > 1
  const confirmed = await askConfirm({
    title: isMulti ? `Move ${paths.length} items to Trash?` : 'Move item to Trash?',
    message: isMulti 
      ? `Are you sure you want to move these ${paths.length} items to the Trash bin?` 
      : `Are you sure you want to move "${paths[0].split('/').pop()}" to the Trash bin?`,
    confirmText: 'Move to Trash',
    type: 'warning',
    icon: 'trash'
  })
  if (!confirmed) return

  try {
    await $fetch('/api/delete', {
      method: 'POST',
      body: { paths }
    })
    await refreshFiles()
    await refreshStats()
    await loadTrashCount()
    success('Moved to Trash', `${paths.length} ${isMulti ? 'items' : 'item'} moved to trash`)
  } catch (err) {
    if (!checkAuthError(err)) {
      error('Delete failed', 'Could not move items to trash')
    }
  }
}

const handleDeleteItemsPermanent = async (paths) => {
  const isMulti = paths.length > 1
  const confirmed = await askConfirm({
    title: isMulti ? `Permanently delete ${paths.length} items?` : 'Permanently delete item?',
    message: isMulti 
      ? `⚠️ This will permanently remove ${paths.length} items from your server disk.\nThis action CANNOT be undone!` 
      : `⚠️ This will permanently remove "${paths[0].split('/').pop()}" from your server disk.\nThis action CANNOT be undone!`,
    confirmText: 'Delete Permanently',
    type: 'danger',
    icon: 'flame'
  })
  if (!confirmed) return

  try {
    await $fetch('/api/delete', {
      method: 'POST',
      body: { paths, permanent: true }
    })
    await refreshFiles()
    await refreshStats()
    success('Permanently Deleted', `${paths.length} ${isMulti ? 'items' : 'item'} permanently deleted from disk`)
  } catch (err) {
    if (!checkAuthError(err)) {
      error('Delete failed', err?.data?.statusMessage || 'Could not permanently delete items')
    }
  }
}

const handleRenameItem = async ({ item, newName }) => {
  isRenaming.value = true
  try {
    await $fetch('/api/rename', {
      method: 'POST',
      body: {
        path: item.relativePath || item.name,
        newName
      }
    })
    showRenameModal.value = false
    await refreshFiles()
    success('Renamed', `Item renamed to "${newName}"`)
  } catch (err) {
    if (!checkAuthError(err)) {
      error('Rename failed', err?.data?.statusMessage || 'Could not rename item')
    }
  } finally {
    isRenaming.value = false
  }
}

const handleMoveItems = async ({ sourcePath, names, destinationPath }) => {
  try {
    for (const name of names) {
      const fromPath = sourcePath ? `${sourcePath}/${name}` : name
      const toPath = destinationPath ? `${destinationPath}/${name}` : name
      if (fromPath !== toPath) {
        await $fetch('/api/move', {
          method: 'POST',
          body: { from: fromPath, to: toPath }
        })
      }
    }
    await refreshFiles()
    success('Moved', `Moved ${names.length} items to /${destinationPath || 'root'}`)
  } catch (err) {
    if (!checkAuthError(err)) {
      error('Move failed', 'Could not move items')
    }
  }
}

const handleModalMove = async ({ items, destination }) => {
  isMoving.value = true
  try {
    for (const itemPath of items) {
      const fileName = itemPath.split('/').pop()
      const toPath = destination ? `${destination}/${fileName}` : fileName
      if (itemPath !== toPath) {
        await $fetch('/api/move', {
          method: 'POST',
          body: { from: itemPath, to: toPath }
        })
      }
    }
    showMoveModal.value = false
    await refreshFiles()
    success('Moved', `Moved ${items.length} items`)
  } catch (err) {
    if (!checkAuthError(err)) {
      error('Move failed', 'Could not move items')
    }
  } finally {
    isMoving.value = false
  }
}

const handleToggleFavorite = async (item) => {
  if (favoritesViewRef.value?.loadFavorites) {
    favoritesViewRef.value.loadFavorites()
  }
}

const handleDownloadZip = (paths, archiveName = 'fluxcloud_download') => {
  if (!paths || paths.length === 0) return

  // Direct browser stream download in 0ms without waiting or memory buffering
  if (paths.length <= 10) {
    const params = new URLSearchParams()
    params.set('zipName', archiveName)
    for (const p of paths) {
      params.append('path', p)
    }
    const a = document.createElement('a')
    a.href = `/api/download-zip?${params.toString()}`
    a.download = `${archiveName.endsWith('.zip') ? archiveName : archiveName + '.zip'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } else {
    // Hidden form submission for large selections
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/api/download-zip'
    form.style.display = 'none'

    const inputPaths = document.createElement('input')
    inputPaths.type = 'hidden'
    inputPaths.name = 'paths'
    inputPaths.value = JSON.stringify(paths)
    form.appendChild(inputPaths)

    const inputName = document.createElement('input')
    inputName.type = 'hidden'
    inputName.name = 'zipName'
    inputName.value = archiveName
    form.appendChild(inputName)

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  success('Download started', `Streaming ${paths.length} item(s) directly...`)
}

const { setAccentColor } = useTheme()

const handleConfigSaved = (newConfig) => {
  config.value = newConfig
  if (newConfig?.color) {
    setAccentColor(newConfig.color)
  }
}
</script>
