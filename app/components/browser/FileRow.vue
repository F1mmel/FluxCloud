<template>
  <tr 
    :data-name="item.name"
    class="file-item-element border-b border-[#e2e8f0] dark:border-[#27272a] last:border-0 hover:bg-[#f1f5f9]/80 dark:hover:bg-[#18181b]/60 transition-colors select-none group cursor-pointer"
    :class="{
      'border-dashed border-2 accent-border': isDragOver
    }"
    :style="isSelected ? 'background-color: var(--accent-bg-alpha)' : ''"
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
    <!-- Checkbox & Star -->
    <td class="py-3 px-4 w-12 align-middle" @click.stop>
      <div class="flex items-center gap-2">
        <AppCheckbox 
          :checked="isSelected" 
          @change="$emit('toggle-select', item.name, $event)"
        />
        <button 
          @click.stop="onToggleFavorite" 
          class="text-[#94a3b8] dark:text-[#71717a] hover:text-amber-500 p-0.5 transition-colors"
          :class="{ '!text-amber-500 fill-amber-500': isFav }"
          title="Favorite"
        >
          <StarIcon class="w-3.5 h-3.5" :class="{ 'fill-amber-500 text-amber-500': isFav }" />
        </button>
      </div>
    </td>

    <!-- Name & Icon: Perfectly Centered Vertically -->
    <td class="py-3 px-4 align-middle font-medium">
      <div class="flex items-center gap-3 min-w-0 py-0.5">
        <FolderIcon v-if="item.isDirectory" class="w-5 h-5 accent-text shrink-0 folder-item-icon" :style="'fill: var(--accent-color); fill-opacity: 0.15'" />
        <VideoIcon v-else-if="isVideo(item.name)" class="w-5 h-5 text-slate-700 dark:text-white shrink-0 file-item-icon" />
        <MusicIcon v-else-if="isAudio(item.name)" class="w-5 h-5 text-slate-700 dark:text-white shrink-0 file-item-icon" />
        <FileTextIcon v-else-if="isPdf(item.name) || isCodeOrText(item.name)" class="w-5 h-5 text-slate-700 dark:text-white shrink-0 file-item-icon" />
        <ArchiveIcon v-else-if="getFileCategory(item.name, false) === 'archive'" class="w-5 h-5 text-slate-700 dark:text-white shrink-0 file-item-icon" />
        <FileIcon v-else class="w-5 h-5 text-slate-700 dark:text-white shrink-0 file-item-icon" />

        <!-- Inline Rename Input Field -->
        <form 
          v-if="isRenaming" 
          @submit.prevent="saveRename" 
          class="flex items-center flex-1 max-w-[420px]"
          @click.stop
          @dblclick.stop
        >
          <input 
            ref="renameInputRef"
            v-model="editName"
            type="text"
            class="w-full px-2.5 py-1 text-sm bg-white dark:bg-[#18181b] border-2 border-indigo-500 rounded-lg text-[#0f172a] dark:text-[#fafafa] focus:outline-none shadow-md font-medium select-text z-20"
            @blur="saveRename"
            @keydown.escape.stop="cancelRename"
            @keydown.enter.stop="saveRename"
            @click.stop
            @mousedown.stop
          />
        </form>

        <!-- Standard Label & Shared Indicator -->
        <div v-else class="flex items-center gap-2 min-w-0">
          <span 
            class="truncate max-w-[420px] text-[#0f172a] dark:text-[#fafafa] text-sm leading-normal py-0.5" 
            :title="item.name"
          >
            {{ item.name }}
          </span>

          <!-- Shared Indicator Pill -->
          <button 
            v-if="isShared(item)"
            @click.stop="$emit('item-action', { action: 'share', item })" 
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-all text-[10px] font-semibold shrink-0 cursor-pointer shadow-xs active:scale-95"
            title="Shared link active. Click to view link & QR code"
          >
            <Share2Icon class="w-3 h-3 text-emerald-500" />
            <span>Shared</span>
          </button>
        </div>
      </div>
    </td>

    <!-- Size -->
    <td class="py-3 px-4 align-middle text-xs text-[#64748b] dark:text-[#cbd5e1]">
      {{ item.isDirectory ? '--' : formatBytes(item.size) }}
    </td>

    <!-- Modified Date -->
    <td class="py-3 px-4 align-middle text-xs text-[#64748b] dark:text-[#cbd5e1]">
      {{ formatDate(item.modifiedAt || item.createdAt) }}
    </td>

    <!-- Actions -->
    <td class="py-3 px-4 text-right w-28 align-middle" @click.stop>
      <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button 
          @click="$emit('item-action', { action: 'open', item })" 
          class="p-1.5 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
          :title="item.isDirectory ? 'Open' : 'Preview'"
        >
          <EyeIcon class="w-4 h-4" />
        </button>

        <button 
          @click="$emit('item-action', { action: 'share', item })" 
          class="p-1.5 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
          title="Share"
        >
          <Share2Icon class="w-4 h-4" />
        </button>

        <button 
          @click="$emit('item-action', { action: 'download', item })" 
          class="p-1.5 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-blue-500 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
          :title="item.isDirectory ? 'Download ZIP' : 'Download'"
        >
          <DownloadIcon class="w-4 h-4" />
        </button>

        <button 
          @click="$emit('item-contextmenu', $event, item)" 
          class="p-1.5 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa] hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
          title="More options"
        >
          <MoreVerticalIcon class="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { 
  Folder as FolderIcon, 
  File as FileIcon, 
  Star as StarIcon, 
  Eye as EyeIcon, 
  Share2 as Share2Icon, 
  Download as DownloadIcon, 
  MoreVertical as MoreVerticalIcon, 
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

const { formatBytes, formatDate, isVideo, isAudio, isPdf, isCodeOrText, getFileCategory } = useFileHelpers()
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
