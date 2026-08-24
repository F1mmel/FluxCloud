<template>
  <aside class="w-64 border-r border-[#e2e8f0]/80 dark:border-[#27272a]/80 glass-sidebar flex flex-col shrink-0 select-none transition-all duration-200 z-20">
    <!-- Brand Header -->
    <div class="h-16 flex items-center px-6 gap-3 border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80">
      <img :src="config?.logo || '/fluxcloud_icon.png'" alt="FluxCloud Logo" class="w-8 h-8 rounded-lg object-contain bg-white/80 dark:bg-[#18181b]/80 p-0.5 border border-[#e2e8f0]/80 dark:border-[#27272a]/80 shadow-sm" />
      <div class="flex flex-col">
        <span class="font-bold text-base tracking-tight accent-text">{{ config?.siteName || 'FluxCloud' }}</span>
        <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1] font-medium tracking-wider uppercase">Cloud &amp; CDN</span>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 p-3 space-y-1.5 overflow-y-auto">
      <a 
        href="#" 
        @click.prevent="$emit('update:activeTab', 'files')" 
        :class="activeTab === 'files' ? 'bg-white/90 dark:bg-white/15 text-[#0f172a] dark:text-[#fafafa] font-semibold border-l-2 accent-border shadow-sm' : 'text-[#475569] dark:text-[#cbd5e1] hover:bg-white/60 dark:hover:bg-white/10 hover:text-[#0f172a] dark:hover:text-[#fafafa] font-medium'"
        class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98]"
      >
        <FolderIcon class="w-4.5 h-4.5 shrink-0" :class="activeTab === 'files' ? 'accent-text' : ''" />
        <span>My Files</span>
      </a>

      <a 
        href="#" 
        @click.prevent="$emit('update:activeTab', 'shared')" 
        :class="activeTab === 'shared' ? 'bg-white/90 dark:bg-white/15 text-[#0f172a] dark:text-[#fafafa] font-semibold border-l-2 accent-border shadow-sm' : 'text-[#475569] dark:text-[#cbd5e1] hover:bg-white/60 dark:hover:bg-white/10 hover:text-[#0f172a] dark:hover:text-[#fafafa] font-medium'"
        class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98]"
      >
        <div class="flex items-center gap-3">
          <Share2Icon class="w-4.5 h-4.5 shrink-0" :class="activeTab === 'shared' ? 'accent-text' : ''" />
          <span>Shared Links</span>
        </div>
        <span v-if="sharedCount > 0" class="text-xs px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/15 text-[#475569] dark:text-[#cbd5e1] font-medium">
          {{ sharedCount }}
        </span>
      </a>

      <a 
        href="#" 
        @click.prevent="$emit('update:activeTab', 'favorites')" 
        :class="activeTab === 'favorites' ? 'bg-white/90 dark:bg-white/15 text-[#0f172a] dark:text-[#fafafa] font-semibold border-l-2 accent-border shadow-sm' : 'text-[#475569] dark:text-[#cbd5e1] hover:bg-white/60 dark:hover:bg-white/10 hover:text-[#0f172a] dark:hover:text-[#fafafa] font-medium'"
        class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98]"
      >
        <StarIcon class="w-4.5 h-4.5 shrink-0" :class="activeTab === 'favorites' ? 'text-amber-400 fill-amber-400' : ''" />
        <span>Favorites</span>
      </a>

      <a 
        href="#" 
        @click.prevent="$emit('update:activeTab', 'trash')" 
        :class="activeTab === 'trash' ? 'bg-white/90 dark:bg-white/15 text-[#0f172a] dark:text-[#fafafa] font-semibold border-l-2 accent-border shadow-sm' : 'text-[#475569] dark:text-[#cbd5e1] hover:bg-white/60 dark:hover:bg-white/10 hover:text-[#0f172a] dark:hover:text-[#fafafa] font-medium'"
        class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98]"
      >
        <div class="flex items-center gap-3">
          <Trash2Icon class="w-4.5 h-4.5 shrink-0" :class="activeTab === 'trash' ? 'text-red-500' : ''" />
          <span>Trash</span>
        </div>
        <span v-if="trashCount > 0" class="text-xs px-1.5 py-0.5 rounded-full bg-red-100/90 dark:bg-red-950/70 text-red-600 dark:text-red-300 font-medium">
          {{ trashCount }}
        </span>
      </a>

      <div class="pt-4 pb-1 px-3 text-[11px] font-semibold tracking-wider text-[#64748b] dark:text-[#cbd5e1] uppercase">Administration</div>

      <a 
        href="#" 
        @click.prevent="$emit('update:activeTab', 'settings')" 
        :class="activeTab === 'settings' ? 'bg-white/90 dark:bg-white/15 text-[#0f172a] dark:text-[#fafafa] font-semibold border-l-2 accent-border shadow-sm' : 'text-[#475569] dark:text-[#cbd5e1] hover:bg-white/60 dark:hover:bg-white/10 hover:text-[#0f172a] dark:hover:text-[#fafafa] font-medium'"
        class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98]"
      >
        <SettingsIcon class="w-4.5 h-4.5 shrink-0" :class="activeTab === 'settings' ? 'accent-text' : ''" />
        <span>Settings</span>
      </a>
    </nav>

    <!-- Theme Switcher Bar -->
    <div class="px-4 py-2 border-t border-[#e2e8f0]/80 dark:border-[#27272a]/80 bg-transparent">
      <div class="flex items-center justify-between p-1 bg-white/70 dark:bg-white/10 rounded-xl border border-black/10 dark:border-white/10 shadow-sm">
        <button 
          @click="setTheme('system')" 
          class="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-all"
          :class="themeMode === 'system' ? 'bg-white dark:bg-white/20 text-[#0f172a] dark:text-white shadow-sm font-semibold' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa]'"
          title="System Default Theme"
        >
          <MonitorIcon class="w-3.5 h-3.5" />
          <span class="text-[11px]">System</span>
        </button>

        <button 
          @click="setTheme('light')" 
          class="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-all"
          :class="themeMode === 'light' ? 'bg-white dark:bg-white/20 text-[#0f172a] dark:text-white shadow-sm font-semibold' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa]'"
          title="Light Theme"
        >
          <SunIcon class="w-3.5 h-3.5" />
          <span class="text-[11px]">Light</span>
        </button>

        <button 
          @click="setTheme('dark')" 
          class="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-all"
          :class="themeMode === 'dark' ? 'bg-white dark:bg-white/20 text-[#0f172a] dark:text-white shadow-sm font-semibold' : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa]'"
          title="Dark Theme"
        >
          <MoonIcon class="w-3.5 h-3.5" />
          <span class="text-[11px]">Dark</span>
        </button>
      </div>
    </div>

    <!-- Storage Usage Meter (Click to view breakdown) -->
    <div 
      @click="$emit('open-storage-breakdown')"
      class="p-4 border-t border-[#e2e8f0]/80 dark:border-[#27272a]/80 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all group select-none"
      title="Click to view detailed storage analytics"
    >
      <div class="flex items-center justify-between text-xs mb-2">
        <div class="flex items-center gap-1.5 text-[#475569] dark:text-[#cbd5e1] group-hover:text-indigo-500 transition-colors">
          <HardDriveIcon class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span class="font-medium">My Storage</span>
        </div>
        <span class="font-medium text-[#0f172a] dark:text-[#fafafa]">{{ formatBytes(stats?.totalBytes || 0) }}</span>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-black/10 dark:bg-white/15 rounded-full h-1.5 overflow-hidden group-hover:ring-2 ring-indigo-500/30 transition-all">
        <div 
          class="accent-bg h-full transition-all duration-500 rounded-full" 
          :style="{ width: `${Math.max(2, stats?.quotaUsedPercentage || 0)}%` }"
        ></div>
      </div>

      <div class="flex items-center justify-between text-[11px] text-[#64748b] dark:text-[#cbd5e1] mt-2">
        <span>{{ stats?.fileCount || 0 }} files, {{ stats?.folderCount || 0 }} folders</span>
        <span class="font-medium group-hover:text-indigo-500 transition-colors">{{ stats?.quotaUsedPercentage || 0 }}%</span>
      </div>
    </div>

    <!-- User Profile & Logout Bar -->
    <div class="p-3 border-t border-[#e2e8f0]/80 dark:border-[#27272a]/80 flex items-center justify-between bg-transparent">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-xl accent-bg flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm shrink-0">
          {{ (currentUser?.username || 'U').charAt(0) }}
        </div>
        <div class="flex flex-col min-w-0">
          <span class="font-semibold text-xs text-[#0f172a] dark:text-[#fafafa] truncate">{{ currentUser?.username || 'User' }}</span>
          <span class="text-[10px] text-[#64748b] dark:text-[#71717a] capitalize">{{ currentUser?.role || 'user' }}</span>
        </div>
      </div>

      <button 
        @click="handleLogout" 
        class="p-2 text-[#64748b] dark:text-[#71717a] hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
        title="Sign Out"
      >
        <LogOutIcon class="w-4 h-4" />
      </button>
    </div>
  </aside>
</template>

<script setup>
import { onMounted } from 'vue'
import { 
  Folder as FolderIcon, 
  Share2 as Share2Icon, 
  Star as StarIcon, 
  Trash2 as Trash2Icon, 
  Settings as SettingsIcon,
  HardDrive as HardDriveIcon,
  Monitor as MonitorIcon, 
  Sun as SunIcon, 
  Moon as MoonIcon,
  LogOut as LogOutIcon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useTheme } from '../../composables/useTheme'
import { useAuth } from '../../composables/useAuth'

const props = defineProps({
  activeTab: { type: String, required: true },
  config: { type: Object, default: () => ({}) },
  stats: { type: Object, default: () => ({}) },
  sharedCount: { type: Number, default: 0 },
  trashCount: { type: Number, default: 0 }
})

const emit = defineEmits(['update:activeTab', 'logout', 'open-storage-breakdown'])

const { formatBytes } = useFileHelpers()
const { themeMode, setTheme, initTheme } = useTheme()
const { currentUser, logout } = useAuth()

const handleLogout = async () => {
  await logout()
  emit('logout')
}

onMounted(() => {
  initTheme()
})
</script>
