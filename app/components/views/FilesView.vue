<template>
  <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
    <!-- Top Header -->
    <AppHeader 
      :search="search"
      :view-mode="viewMode"
      :is-refreshing="pending"
      @update:search="(v) => $emit('update:search', v)"
      @update:view-mode="(v) => $emit('update:view-mode', v)"
      @refresh="$emit('refresh')"
      @open-create-folder="$emit('open-create-folder')"
      @open-upload="$emit('open-upload')"
    />

    <!-- File Browser Coordinator -->
    <FileBrowser 
      :files="files"
      :current-path="currentPath"
      :view-mode="viewMode"
      :loading="pending"
      :is-searching="!!search"
      @navigate="(p) => $emit('navigate', p)"
      @refresh="$emit('refresh')"
      @open-create-folder="$emit('open-create-folder')"
      @open-upload="$emit('open-upload')"
      @open-share-modal="(it) => $emit('open-share-modal', it)"
      @open-preview-modal="(it) => $emit('open-preview-modal', it)"
      @open-editor-modal="(it) => $emit('open-editor-modal', it)"
      @open-direct-link-modal="(it) => $emit('open-direct-link-modal', it)"
      @open-rename-modal="(it) => $emit('open-rename-modal', it)"
      @open-move-modal="(items) => $emit('open-move-modal', items)"
      @toggle-favorite="(it) => $emit('toggle-favorite', it)"
      @clear-search="$emit('clear-search')"
      @upload-files="(files) => $emit('upload-files', files)"
      @delete-items="(paths) => $emit('delete-items', paths)"
      @move-items="(payload) => $emit('move-items', payload)"
      @download-zip="(paths, name) => $emit('download-zip', paths, name)"
    />
  </div>
</template>

<script setup>
import AppHeader from '../layout/AppHeader.vue'
import FileBrowser from '../browser/FileBrowser.vue'

defineProps({
  files: { type: Array, default: () => [] },
  currentPath: { type: String, default: '' },
  viewMode: { type: String, default: 'list' },
  search: { type: String, default: '' },
  category: { type: String, default: 'all' },
  pending: { type: Boolean, default: false }
})

defineEmits([
  'navigate',
  'refresh',
  'update:search',
  'update:category',
  'update:view-mode',
  'clear-search',
  'open-create-folder',
  'open-upload',
  'open-share-modal',
  'open-preview-modal',
  'open-editor-modal',
  'open-direct-link-modal',
  'open-rename-modal',
  'open-move-modal',
  'toggle-favorite',
  'upload-files',
  'delete-items',
  'move-items',
  'download-zip'
])
</script>
