<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3.5">
    <FileCard 
      v-for="item in files" 
      :key="item.name"
      :item="item"
      :is-selected="selectedItems.has(item.name)"
      :is-drag-over="dragOverFolder === item.name"
      :is-renaming="renamingItemName === item.name"
      @item-click="(it, e) => $emit('item-click', it, e)"
      @item-mousedown="(e, it) => $emit('item-mousedown', e, it)"
      @item-mouseup="(e, it) => $emit('item-mouseup', e, it)"
      @item-dblclick="(it) => $emit('item-dblclick', it)"
      @item-contextmenu="(e, it) => $emit('item-contextmenu', e, it)"
      @item-dragstart="(e, it) => $emit('item-dragstart', e, it)"
      @item-dragend="(e, it) => $emit('item-dragend', e, it)"
      @item-dragover="(e, it) => $emit('item-dragover', e, it)"
      @item-dragleave="(e, it) => $emit('item-dragleave', e, it)"
      @item-drop="(e, it) => $emit('item-drop', e, it)"
      @toggle-select="(name, e) => $emit('toggle-select', name, e)"
      @toggle-favorite="(it) => $emit('toggle-favorite', it)"
      @item-action="(a) => $emit('item-action', a)"
      @submit-rename="(payload) => $emit('submit-rename', payload)"
      @cancel-rename="$emit('cancel-rename')"
    />
  </div>
</template>

<script setup>
import FileCard from './FileCard.vue'

defineProps({
  files: { type: Array, default: () => [] },
  selectedItems: { type: Object, default: () => new Set() },
  dragOverFolder: { type: String, default: null },
  renamingItemName: { type: String, default: null }
})

defineEmits([
  'item-click',
  'item-mousedown',
  'item-mouseup',
  'item-dblclick',
  'item-contextmenu',
  'item-dragstart',
  'item-dragend',
  'item-dragover',
  'item-dragleave',
  'item-drop',
  'toggle-select',
  'toggle-favorite',
  'item-action',
  'submit-rename',
  'cancel-rename'
])
</script>
