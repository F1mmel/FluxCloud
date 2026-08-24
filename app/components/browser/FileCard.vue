<template>
  <div 
    :data-name="item.name"
    class="file-item-element group relative rounded-2xl p-3.5 flex flex-col items-center text-center cursor-pointer transition-all duration-200 glass-card border select-none hover:border-indigo-400 dark:hover:border-white/30 hover:-translate-y-1 active:scale-[0.98] shadow-sm hover:shadow-lg"
    :class="[
      isSelected ? 'accent-border shadow-md ring-1' : 'border-white/60 dark:border-white/10',
      isDragOver ? 'border-dashed border-2 accent-border scale-105' : ''
    ]"
    :style="isSelected ? 'background-color: var(--accent-bg-alpha); ring-color: var(--accent-color)' : (isDragOver ? 'background-color: var(--accent-bg-alpha)' : '')"
    @click="$emit('item-click', item, $event)"
    @mousedown.stop="$emit('item-mousedown', $event, item)"
    @mouseup.stop="$emit('item-mouseup', $event, item)"
    @dblclick="$emit('item-dblclick', item)"
    @contextmenu.prevent="$emit('item-contextmenu', $event, item)"
    draggable="true"
    @dragstart="$emit('item-dragstart', $event, item)"
    @dragover.prevent="$emit('item-dragover', $event, item)"
    @dragleave="$emit('item-dragleave', $event, item)"
    @drop.prevent="$emit('item-drop', $event, item)"
  >
    <!-- Top Action Buttons (Hover or Selected or Shared or Fav) -->
    <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10" :class="{ '!opacity-100': isSelected || isFav || isShared(item) }">
      <!-- Checkbox -->
      <div @click.stop>
        <AppCheckbox 
          :checked="isSelected" 
          @change="$emit('toggle-select', item.name, $event)"
        />
      </div>

      <!-- Right Action Badges: Shared & Star -->
      <div class="flex items-center gap-1">
        <!-- Shared Indicator Button -->
        <button 
          v-if="isShared(item)"
          @click.stop="$emit('item-action', { action: 'share', item })" 
          class="p-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-xs cursor-pointer z-10 !opacity-100 active:scale-95 border border-emerald-500/30"
          title="Shared link active. Click to view link & QR code"
        >
          <Share2Icon class="w-3.5 h-3.5" />
        </button>

        <!-- Favorite Star -->
        <button 
          @click.stop="onToggleFavorite" 
          class="p-1 rounded-lg bg-white/90 dark:bg-white/20 hover:bg-white dark:hover:bg-white/30 text-[#94a3b8] dark:text-[#a1a1aa] hover:text-amber-500 transition-colors shadow-sm"
          :class="{ '!opacity-100 text-amber-500 fill-amber-500': isFav }"
          title="Favorite"
        >
          <StarIcon class="w-3.5 h-3.5" :class="{ 'fill-amber-500 text-amber-500': isFav }" />
        </button>
      </div>
    </div>

    <!-- Thumbnail or Icon: Perfectly Centered -->
    <div class="w-full h-24 my-2 flex items-center justify-center overflow-hidden rounded-xl bg-white/60 dark:bg-white/10 border border-black/5 dark:border-white/10">
      <img 
        v-if="isImage(item.name) && item.url" 
        :src="item.url" 
        :alt="item.name" 
        loading="lazy"
        class="h-full w-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-105"
      />
      <div v-else class="p-3 transition-transform duration-200 group-hover:scale-110 flex items-center justify-center">
        <FolderIcon v-if="item.isDirectory" class="w-12 h-12 accent-text folder-item-icon" :style="'fill: var(--accent-color); fill-opacity: 0.12'" />
        <VideoIcon v-else-if="isVideo(item.name)" class="w-12 h-12 text-slate-700 dark:text-white file-item-icon" />
        <MusicIcon v-else-if="isAudio(item.name)" class="w-12 h-12 text-slate-700 dark:text-white file-item-icon" />
        <FileTextIcon v-else-if="isPdf(item.name) || isCodeOrText(item.name)" class="w-12 h-12 text-slate-700 dark:text-white file-item-icon" />
        <ArchiveIcon v-else-if="getFileCategory(item.name, false) === 'archive'" class="w-12 h-12 text-slate-700 dark:text-white file-item-icon" />
        <FileIcon v-else class="w-12 h-12 text-slate-700 dark:text-white file-item-icon" />
      </div>
    </div>

    <!-- Name & Size -->
    <!-- Inline Rename Input Field -->
    <form 
      v-if="isRenaming" 
      @submit.prevent="saveRename" 
      class="w-full px-1 py-0.5 z-20"
      @click.stop
      @dblclick.stop
    >
      <input 
        ref="renameInputRef"
        v-model="editName"
        type="text"
        class="w-full text-xs text-center px-1.5 py-1 bg-white dark:bg-[#18181b] border-2 border-indigo-500 rounded-lg text-[#0f172a] dark:text-[#fafafa] focus:outline-none shadow-md font-semibold select-text"
        @blur="saveRename"
        @keydown.escape.stop="cancelRename"
        @keydown.enter.stop="saveRename"
        @click.stop
        @mousedown.stop
      />
    </form>

    <!-- Standard Name Label -->
    <span 
      v-else 
      class="text-xs font-semibold truncate w-full px-1 text-[#0f172a] dark:text-[#fafafa] leading-normal py-0.5" 
      :title="item.name"
    >
      {{ item.name }}
    </span>

    <div class="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#64748b] dark:text-[#cbd5e1]">
      <span>{{ item.isDirectory ? '--' : formatBytes(item.size) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { 
  Folder as FolderIcon, 
  File as FileIcon, 
  Star as StarIcon, 
  Share2 as Share2Icon,
  Video as VideoIcon, 
  Music as MusicIcon, 
  FileText as FileTextIcon, 
  Archive as ArchiveIcon 
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useFavorites } from '../../composables/useFavorites'
import { useShares } from '../../composables/useShares'
import AppCheckbox from '../ui/AppCheckbox.vue'

const props = defineProps({
  item: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  isDragOver: { type: Boolean, default: false },
  isRenaming: { type: Boolean, default: false }
})

const emit = defineEmits([
  'item-click',
  'item-mousedown',
  'item-mouseup',
  'item-dblclick',
  'item-contextmenu',
  'item-dragstart',
  'item-dragover',
  'item-dragleave',
  'item-drop',
  'toggle-select',
  'toggle-favorite',
  'item-action',
  'submit-rename',
  'cancel-rename'
])

const { formatBytes, isImage, isVideo, isAudio, isPdf, isCodeOrText, getFileCategory } = useFileHelpers()
const { isFavorite, toggleFavorite } = useFavorites()
const { isShared } = useShares()
const isFav = computed(() => isFavorite(props.item))

const onToggleFavorite = () => {
  toggleFavorite(props.item)
  emit('toggle-favorite', props.item)
}

const editName = ref(props.item.name)
const renameInputRef = ref(null)
let isSavingRename = false

watch(() => props.isRenaming, (renaming) => {
  if (renaming) {
    editName.value = props.item.name
    isSavingRename = false
    nextTick(() => {
      if (renameInputRef.value) {
        renameInputRef.value.focus()
        const name = props.item.name
        const lastDot = name.lastIndexOf('.')
        if (!props.item.isDirectory && lastDot > 0) {
          renameInputRef.value.setSelectionRange(0, lastDot)
        } else {
          renameInputRef.value.select()
        }
      }
    })
  }
}, { immediate: true })

const saveRename = () => {
  if (isSavingRename) return
  isSavingRename = true
  const trimmed = editName.value.trim()
  if (!trimmed || trimmed === props.item.name) {
    emit('cancel-rename')
  } else {
    emit('submit-rename', { item: props.item, newName: trimmed })
  }
}

const cancelRename = () => {
  editName.value = props.item.name
  emit('cancel-rename')
}
</script>
