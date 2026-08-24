<template>
  <Transition name="modal-fade">
    <div 
      v-if="show" 
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none"
      @keydown.escape="handleCloseAttempt"
      @keydown="handleGlobalKeydown"
    >
      <div 
        class="glass-modal border border-white/20 dark:border-white/10 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <!-- Editor Header -->
        <div class="h-14 px-5 border-b border-[#e2e8f0] dark:border-[#27272a] flex items-center justify-between glass-header shrink-0 gap-4">
          <!-- Left: File Info & Unsaved Status -->
          <div class="flex items-center gap-3 min-w-0">
            <div class="p-2 rounded-xl bg-black/5 dark:bg-white/10 text-indigo-500 shrink-0">
              <CodeIcon class="w-4 h-4" />
            </div>
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-[#0f172a] dark:text-[#fafafa] truncate max-w-[280px] sm:max-w-md">{{ item?.name }}</span>
                <span 
                  v-if="hasUnsavedChanges" 
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold animate-pulse"
                >
                  ● Unsaved
                </span>
              </div>
              <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] font-mono truncate max-w-sm">/{{ item?.relativePath || item?.name }}</span>
            </div>
          </div>

          <!-- Center/Right: Editor Controls & Actions -->
          <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            <!-- Language Badge -->
            <span class="hidden md:inline-flex px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-[11px] font-mono text-[#64748b] dark:text-[#cbd5e1] uppercase font-semibold">
              {{ detectedLanguage }}
            </span>

            <!-- Wrap Toggle -->
            <button 
              @click="wordWrap = !wordWrap" 
              class="p-2 rounded-xl text-xs border transition-all active:scale-95 flex items-center gap-1.5"
              :class="wordWrap ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'border-black/10 dark:border-white/15 text-[#64748b] dark:text-[#cbd5e1] hover:bg-black/5 dark:hover:bg-white/10'"
              title="Toggle Word Wrap"
            >
              <WrapTextIcon class="w-3.5 h-3.5" />
              <span class="hidden sm:inline text-[11px]">Wrap</span>
            </button>

            <!-- Font Size -->
            <div class="hidden sm:flex items-center border border-black/10 dark:border-white/15 rounded-xl p-0.5 bg-black/5 dark:bg-white/10 text-xs">
              <button 
                @click="fontSize = Math.max(11, fontSize - 1)" 
                class="px-2 py-1 hover:bg-white dark:hover:bg-white/20 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white"
                title="Decrease Font Size"
              >
                A-
              </button>
              <span class="px-1.5 text-[11px] font-mono font-medium text-[#0f172a] dark:text-[#fafafa]">{{ fontSize }}px</span>
              <button 
                @click="fontSize = Math.min(22, fontSize + 1)" 
                class="px-2 py-1 hover:bg-white dark:hover:bg-white/20 rounded-lg text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white"
                title="Increase Font Size"
              >
                A+
              </button>
            </div>

            <!-- Save Button -->
            <button 
              @click="saveFile" 
              :disabled="isSaving || !hasUnsavedChanges" 
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              :class="hasUnsavedChanges ? 'accent-bg accent-bg-hover' : 'bg-emerald-600 dark:bg-emerald-700'"
            >
              <Loader2Icon v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
              <SaveIcon v-else class="w-3.5 h-3.5" />
              <span>{{ isSaving ? 'Saving...' : 'Save' }}</span>
              <span class="hidden md:inline text-[10px] opacity-75 font-mono ml-0.5">Ctrl+S</span>
            </button>

            <!-- Close Button -->
            <button 
              @click="handleCloseAttempt" 
              class="p-2 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors active:scale-95"
              title="Close Editor"
            >
              <XIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Editor Body -->
        <div class="flex-1 min-h-0 relative flex bg-[#fafafa] dark:bg-[#09090b] text-[#0f172a] dark:text-[#fafafa] font-mono text-sm overflow-hidden select-text">
          <!-- Loading State -->
          <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 dark:bg-[#09090b]/80 z-20 backdrop-blur-xs">
            <Loader2Icon class="w-8 h-8 animate-spin accent-text" />
            <span class="text-xs font-sans text-[#64748b] dark:text-[#cbd5e1]">Loading file content...</span>
          </div>

          <!-- Line Numbers Gutter -->
          <div 
            ref="gutterRef"
            class="w-12 sm:w-14 shrink-0 py-3 pr-2 select-none text-right font-mono text-[11px] text-[#94a3b8] dark:text-[#52525b] border-r border-[#e2e8f0] dark:border-[#27272a] bg-[#f1f5f9]/60 dark:bg-[#12131a]/80 overflow-hidden leading-normal"
          >
            <div v-for="line in totalLinesCount" :key="line" class="px-1" :style="{ fontSize: `${fontSize}px`, lineHeight: '1.5' }">
              {{ line }}
            </div>
          </div>

          <!-- Main Textarea -->
          <div class="flex-1 relative h-full overflow-hidden">
            <textarea
              ref="textareaRef"
              v-model="fileContent"
              class="w-full h-full p-3 font-mono bg-transparent text-[#0f172a] dark:text-[#fafafa] focus:outline-none resize-none overflow-auto select-text leading-normal"
              :class="{ 'whitespace-pre': !wordWrap, 'whitespace-pre-wrap break-words': wordWrap }"
              :style="{ fontSize: `${fontSize}px`, lineHeight: '1.5', tabSize: 2 }"
              spellcheck="false"
              autocapitalize="off"
              autocomplete="off"
              @scroll="syncGutterScroll"
              @keydown="handleTextareaKeydown"
              @input="onContentChange"
              @click="updateCursorInfo"
              @keyup="updateCursorInfo"
            ></textarea>
          </div>
        </div>

        <!-- Editor Status Bar -->
        <div class="h-8 px-4 border-t border-[#e2e8f0] dark:border-[#27272a] bg-black/5 dark:bg-white/5 flex items-center justify-between text-[11px] font-mono text-[#64748b] dark:text-[#cbd5e1] shrink-0">
          <div class="flex items-center gap-4">
            <span>Ln {{ cursorLine }}, Col {{ cursorCol }}</span>
            <span>{{ totalLinesCount }} lines</span>
            <span>{{ fileContent.length }} chars</span>
          </div>

          <div class="flex items-center gap-3">
            <span>UTF-8</span>
            <span>{{ formatBytes(fileContent.length) }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { 
  Code as CodeIcon, 
  Save as SaveIcon, 
  X as XIcon, 
  WrapText as WrapTextIcon, 
  Loader2 as Loader2Icon 
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])

const { formatBytes } = useFileHelpers()
const { success, error } = useToast()

const fileContent = ref('')
const initialContent = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const wordWrap = ref(true)
const fontSize = ref(13)

const textareaRef = ref(null)
const gutterRef = ref(null)

const cursorLine = ref(1)
const cursorCol = ref(1)

const hasUnsavedChanges = computed(() => fileContent.value !== initialContent.value)

const totalLinesCount = computed(() => {
  if (!fileContent.value) return 1
  return fileContent.value.split('\n').length
})

const detectedLanguage = computed(() => {
  const name = props.item?.name || ''
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const map = {
    js: 'JavaScript',
    ts: 'TypeScript',
    vue: 'Vue',
    json: 'JSON',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    py: 'Python',
    md: 'Markdown',
    sh: 'Bash / Shell',
    env: 'Env Config',
    yml: 'YAML',
    yaml: 'YAML',
    xml: 'XML',
    sql: 'SQL',
    php: 'PHP',
    txt: 'Plain Text'
  }
  return map[ext] || 'Text'
})

watch(() => props.show, async (newVal) => {
  if (newVal && props.item) {
    await loadFileContent()
  } else {
    fileContent.value = ''
    initialContent.value = ''
  }
})

const loadFileContent = async () => {
  if (!props.item) return
  isLoading.value = true
  try {
    const res = await $fetch(`/api/file-content?path=${encodeURIComponent(props.item.relativePath || props.item.name)}`)
    fileContent.value = res.content || ''
    initialContent.value = res.content || ''
    cursorLine.value = 1
    cursorCol.value = 1
    nextTick(() => {
      textareaRef.value?.focus()
    })
  } catch (err) {
    error('Open Failed', err?.data?.statusMessage || 'Could not load file content')
    emit('close')
  } finally {
    isLoading.value = false
  }
}

const saveFile = async () => {
  if (!props.item || isSaving.value || !hasUnsavedChanges.value) return
  isSaving.value = true
  try {
    const res = await $fetch('/api/file-content', {
      method: 'POST',
      body: {
        path: props.item.relativePath || props.item.name,
        content: fileContent.value
      }
    })
    initialContent.value = fileContent.value
    success('Saved', `Saved "${props.item.name}" (${formatBytes(res.size)})`)
    emit('saved', { item: props.item, size: res.size })
  } catch (err) {
    error('Save Failed', err?.data?.statusMessage || 'Could not save file')
  } finally {
    isSaving.value = false
  }
}

const syncGutterScroll = () => {
  if (gutterRef.value && textareaRef.value) {
    gutterRef.value.scrollTop = textareaRef.value.scrollTop
  }
}

const updateCursorInfo = () => {
  const el = textareaRef.value
  if (!el) return
  const textBefore = el.value.substring(0, el.selectionStart)
  const lines = textBefore.split('\n')
  cursorLine.value = lines.length
  cursorCol.value = (lines[lines.length - 1]?.length || 0) + 1
}

const onContentChange = () => {
  updateCursorInfo()
}

const handleTextareaKeydown = (e) => {
  // Tab key indentation support (insert 2 spaces)
  if (e.key === 'Tab') {
    e.preventDefault()
    const el = textareaRef.value
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const val = fileContent.value
    fileContent.value = val.substring(0, start) + '  ' + val.substring(end)
    nextTick(() => {
      el.selectionStart = el.selectionEnd = start + 2
      updateCursorInfo()
    })
  }
}

const handleGlobalKeydown = (e) => {
  // Ctrl + S / Cmd + S to save
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    saveFile()
  }
}

const handleCloseAttempt = () => {
  if (hasUnsavedChanges.value) {
    if (confirm('You have unsaved changes in this file. Are you sure you want to discard them and close?')) {
      emit('close')
    }
  } else {
    emit('close')
  }
}
</script>
