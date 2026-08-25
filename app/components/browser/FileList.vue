<template>
  <div class="border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden glass-card shadow-xl transition-all duration-200">
    <table class="w-full text-left text-sm border-collapse">
      <thead>
        <tr class="border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/10 text-[#475569] dark:text-[#cbd5e1] font-semibold text-xs">
          <th class="py-3 px-4 w-12 align-middle">
            <AppCheckbox 
              :checked="allSelected" 
              @change="$emit('toggle-select-all', $event)" 
            />
          </th>
          <th class="py-3 px-4 cursor-pointer hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-colors align-middle" @click="$emit('sort', 'name')">
            <div class="flex items-center gap-1.5">
              <span>Name</span>
              <ArrowUpDownIcon class="w-3 h-3" />
            </div>
          </th>
          <th class="py-3 px-4 cursor-pointer hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-colors w-32 align-middle" @click="$emit('sort', 'size')">
            <div class="flex items-center gap-1.5">
              <span>Size</span>
              <ArrowUpDownIcon class="w-3 h-3" />
            </div>
          </th>
          <th class="py-3 px-4 cursor-pointer hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-colors w-48 align-middle" @click="$emit('sort', 'date')">
            <div class="flex items-center gap-1.5">
              <span>Modified</span>
              <ArrowUpDownIcon class="w-3 h-3" />
            </div>
          </th>
          <th class="py-3 px-4 text-right w-28 align-middle">Actions</th>
        </tr>
      </thead>
      <tbody>
        <FileRow 
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
          @item-action="(payload) => $emit('item-action', payload)"
          @submit-rename="(payload) => $emit('submit-rename', payload)"
          @cancel-rename="$emit('cancel-rename')"
        />
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ArrowUpDown as ArrowUpDownIcon } from 'lucide-vue-next'
import FileRow from './FileRow.vue'
import AppCheckbox from '../ui/AppCheckbox.vue'

defineProps({
  files: { type: Array, default: () => [] },
  selectedItems: { type: Object, default: () => new Set() },
  dragOverFolder: { type: String, default: null },
  allSelected: { type: Boolean, default: false },
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
  'toggle-select-all',
  'toggle-favorite',
  'item-action',
  'submit-rename',
  'cancel-rename',
  'sort'
])
</script>
