<template>
  <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
    <!-- Top Header with Settings Tabs -->
    <header class="relative z-30 h-16 border-b border-black/5 dark:border-white/10 px-6 flex items-center justify-between glass-card bg-white/40 dark:bg-white/10 shrink-0 transition-all duration-200 gap-4">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30">
          <SettingsIcon class="w-5 h-5 accent-text" />
        </div>
        <div>
          <h2 class="text-base font-bold text-[#0f172a] dark:text-[#fafafa]">Settings</h2>
          <p class="text-xs text-[#64748b] dark:text-[#cbd5e1]">Manage appearance, uploads, WebDAV, API, and users</p>
        </div>
      </div>

      <!-- Segmented Tab Navigation (Shadcn Glass Style) -->
      <div class="flex items-center p-1 bg-black/5 dark:bg-white/10 rounded-2xl border border-black/10 dark:border-white/15 gap-1 shadow-sm">
        <button
          v-for="tab in availableTabs"
          :key="tab.id"
          type="button"
          @click="activeTab = tab.id"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 active:scale-95 select-none cursor-pointer"
          :class="[
            activeTab === tab.id
              ? 'bg-white dark:bg-white/20 text-[#0f172a] dark:text-white font-semibold shadow-sm'
              : 'text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          ]"
        >
          <component :is="tab.icon" class="w-3.5 h-3.5" :class="activeTab === tab.id ? 'accent-text' : ''" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Concave Inner Corner -->
      <div class="absolute top-full left-0 w-5 h-5 pointer-events-none z-30 overflow-hidden">
        <div class="w-full h-full glass-card bg-white/40 dark:bg-white/10 concave-glass-corner"></div>
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 20 20" fill="none">
          <path d="M20,0 A20,20 0 0,0 0,20" fill="none" stroke="currentColor" class="text-black/5 dark:text-white/10" stroke-width="1.2" />
        </svg>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-y-auto p-6 select-none">
      <div class="max-w-4xl mx-auto w-full">
        <Transition name="fade-slide" mode="out-in">
          
          <!-- TAB 1: CUSTOMIZATION -->
          <div v-if="activeTab === 'customization'" key="tab-customization" class="space-y-6">
            <!-- 1. Background Wallpaper (Nextcloud Style) -->
            <div class="glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 rounded-2xl p-6 space-y-5 shadow-lg">
              <div class="flex items-center justify-between border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 pb-3">
                <h3 class="text-sm font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
                  <ImageIcon class="w-4 h-4 text-indigo-500" />
                  <span>Background Wallpaper (Nextcloud Style)</span>
                </h3>
                <button 
                  v-if="currentBackground" 
                  @click="clearCustomBackground" 
                  class="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                >
                  Reset to None
                </button>
              </div>

              <p class="text-xs text-[#475569] dark:text-[#e2e8f0] font-normal leading-relaxed">
                Choose a scenic Nextcloud wallpaper preset or upload your own image. All windows and menus automatically render with translucent glassmorphic blur.
              </p>

              <!-- Wallpaper Presets Grid -->
              <div class="space-y-2">
                <label class="text-xs font-semibold text-[#475569] dark:text-[#e2e8f0] block">Curated Wallpapers</label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    v-for="preset in WALLPAPER_PRESETS"
                    :key="preset.id"
                    type="button"
                    @click="selectPreset(preset)"
                    class="group relative rounded-xl overflow-hidden border transition-all duration-200 text-left flex flex-col h-24 shadow-sm hover:shadow-md active:scale-95"
                    :class="currentBackground === preset.url ? 'ring-2 ring-indigo-500 border-indigo-500 scale-[1.02]' : 'border-black/10 dark:border-white/10 hover:border-indigo-400/60'"
                  >
                    <div 
                      v-if="preset.thumbnail" 
                      class="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                      :style="{ backgroundImage: `url(${preset.thumbnail})` }"
                    ></div>
                    <div 
                      v-else 
                      class="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-zinc-800 dark:to-zinc-950"
                    ></div>

                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                    <div v-if="currentBackground === preset.url" class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full accent-bg flex items-center justify-center text-white shadow-md z-10">
                      <CheckIcon class="w-3 h-3 stroke-[3]" />
                    </div>

                    <div class="relative mt-auto p-2 text-white z-10">
                      <span class="text-[11px] font-bold block truncate drop-shadow-sm">{{ preset.name }}</span>
                      <span class="text-[9px] text-white/75 font-medium block truncate">{{ preset.category }}</span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Custom Upload or Custom URL -->
              <div class="space-y-3 pt-2 border-t border-[#e2e8f0]/80 dark:border-[#27272a]/80">
                <label class="text-xs font-semibold text-[#475569] dark:text-[#e2e8f0] block">Custom Wallpaper</label>
                
                <div class="flex flex-col sm:flex-row gap-2">
                  <button 
                    type="button" 
                    @click="$refs.bgFileInput.click()" 
                    class="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium text-[#0f172a] dark:text-[#fafafa] transition-all"
                  >
                    <UploadIcon class="w-3.5 h-3.5 text-indigo-500" />
                    <span>Upload Local Image</span>
                  </button>
                  <input type="file" ref="bgFileInput" class="hidden" accept="image/*" @change="handleCustomBgUpload" />

                  <div class="flex items-center gap-1.5 flex-1">
                    <input 
                      v-model="customUrlInput" 
                      type="url" 
                      placeholder="Or paste Image URL..." 
                      class="flex-1 px-3 py-2 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:border-indigo-500 rounded-xl text-xs text-[#0f172a] dark:text-[#fafafa] focus:outline-none"
                      @keyup.enter="applyCustomUrl"
                    />
                    <button 
                      type="button" 
                      @click="applyCustomUrl" 
                      class="px-3 py-2 accent-bg accent-bg-hover text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <!-- Background Blur & Overlay Opacity -->
              <div v-if="currentBackground" class="space-y-4 pt-3 border-t border-[#e2e8f0]/80 dark:border-[#27272a]/80">
                <!-- Blur Slider -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-semibold text-[#475569] dark:text-[#e2e8f0]">Wallpaper Soft Blur</label>
                    <span class="text-xs text-[#64748b] dark:text-[#cbd5e1] font-mono">{{ backgroundBlur }}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    step="1"
                    v-model.number="backgroundBlur" 
                    @input="setBlur(backgroundBlur)"
                    class="w-full accent-text cursor-pointer"
                  />
                </div>

                <!-- Background Brightness Slider -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-semibold text-[#475569] dark:text-[#e2e8f0]">Background Brightness</label>
                    <span class="text-xs text-[#64748b] dark:text-[#cbd5e1] font-mono">{{ backgroundBrightness }}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="100" 
                    step="5"
                    v-model.number="backgroundBrightness" 
                    @input="setBrightness(backgroundBrightness)"
                    class="w-full accent-text cursor-pointer"
                  />
                </div>

                <!-- Public Share Page Wallpaper Option -->
                <div class="pt-3 border-t border-[#e2e8f0]/80 dark:border-[#27272a]/80">
                  <div 
                    class="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 cursor-pointer hover:bg-black/[0.07] dark:hover:bg-white/[0.07] transition-all"
                    @click="customSharePageBackgroundEnabled = !customSharePageBackgroundEnabled"
                  >
                    <div class="flex flex-col min-w-0 pr-3">
                      <span class="text-xs font-bold text-[#0f172a] dark:text-[#fafafa]">Apply Wallpaper to Public Share Pages</span>
                      <span class="text-[11px] text-[#64748b] dark:text-[#cbd5e1]">Show background image &amp; blur on public /s/ links (Default: Off)</span>
                    </div>
                    <AppCheckbox v-model="customSharePageBackgroundEnabled" @click.stop />
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Theme & Branding -->
            <div class="glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 rounded-2xl p-6 space-y-5 shadow-lg">
              <h3 class="text-sm font-bold text-[#0f172a] dark:text-[#fafafa] border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 pb-3 flex items-center gap-2">
                <SparklesIcon class="w-4 h-4 accent-text" />
                <span>Theme &amp; Branding</span>
              </h3>

              <!-- Theme Mode Switcher -->
              <div class="space-y-2">
                <label class="text-xs font-semibold text-[#475569] dark:text-[#e2e8f0] block">Interface Mode</label>
                <div class="grid grid-cols-3 gap-3">
                  <button 
                    type="button"
                    @click="setTheme('system')"
                    class="flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all duration-200"
                    :class="themeMode === 'system' ? 'border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa]'"
                  >
                    <MonitorIcon class="w-4 h-4" />
                    <span>System</span>
                  </button>

                  <button 
                    type="button"
                    @click="setTheme('light')"
                    class="flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all duration-200"
                    :class="themeMode === 'light' ? 'border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa]'"
                  >
                    <SunIcon class="w-4 h-4" />
                    <span>Light</span>
                  </button>

                  <button 
                    type="button"
                    @click="setTheme('dark')"
                    class="flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all duration-200"
                    :class="themeMode === 'dark' ? 'border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#64748b] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-[#fafafa]'"
                  >
                    <MoonIcon class="w-4 h-4" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>
              
              <!-- Site Name -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-[#475569] dark:text-[#e2e8f0] block">Instance Name</label>
                <input 
                  v-model="customSiteName" 
                  type="text" 
                  placeholder="FluxCloud" 
                  class="w-full px-3.5 py-2 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 focus:border-indigo-500 rounded-xl text-xs text-[#0f172a] dark:text-[#fafafa] focus:outline-none shadow-sm"
                />
              </div>

              <!-- Color Picker -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-semibold text-[#475569] dark:text-[#e2e8f0] block">Accent Color</label>
                  <span class="text-xs font-mono accent-text font-bold">{{ customColor }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <input 
                    type="color" 
                    v-model="customColor" 
                    @input="handleColorChange(customColor)"
                    class="w-9 h-9 border border-black/10 dark:border-white/10 rounded-lg cursor-pointer bg-transparent" 
                  />
                  <div class="flex gap-2 flex-wrap">
                    <button 
                      v-for="c in ['#818CF8', '#3b82f6', '#06b6d4', '#10b981', '#14b8a6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308']" 
                      :key="c" 
                      type="button"
                      @click="handleColorChange(c)" 
                      class="w-6 h-6 rounded-full border border-black/20 dark:border-white/20 cursor-pointer transition-all hover:scale-110 shadow-sm"
                      :style="`background-color: ${c}; transform: ${customColor === c ? 'scale(1.25)' : 'scale(1)'}; box-shadow: ${customColor === c ? '0 0 0 2px white, 0 0 0 4px ' + c : 'none'}`"
                    ></button>
                  </div>
                </div>
              </div>

              <!-- Logo Picker -->
              <div class="space-y-2">
                <label class="text-xs font-semibold text-[#475569] dark:text-[#e2e8f0] block">Custom Brand Logo</label>
                <div class="flex items-center gap-4">
                  <img :src="customLogo || '/fluxcloud_icon.png'" alt="Brand Logo" class="w-14 h-14 rounded-xl border border-black/10 dark:border-white/10 object-contain bg-white/80 dark:bg-[#18181b]/80 p-1 shadow-sm" />
                  <div class="flex flex-col gap-1.5">
                    <button @click="$refs.logoInput.click()" class="px-3.5 py-1.5 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-xs font-medium text-[#0f172a] dark:text-[#fafafa] transition-all">
                      Choose New Image
                    </button>
                    <button v-if="customLogo" @click="resetLogo" class="px-3.5 py-1.5 bg-red-100/80 dark:bg-red-950/40 hover:bg-red-200 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-200 rounded-xl text-xs font-medium transition-all">
                      Reset to Default
                    </button>
                  </div>
                  <input type="file" ref="logoInput" class="hidden" accept="image/*" @change="handleLogoFile" />
                </div>
              </div>

              <!-- Accent Color for Folder Icons Toggle -->
              <div class="space-y-2 pt-3 border-t border-[#e2e8f0]/80 dark:border-[#27272a]/80">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <label class="text-xs font-semibold text-[#475569] dark:text-[#e2e8f0] block">Accent Color for Folder Icons</label>
                    <p class="text-[11px] text-[#64748b] dark:text-[#cbd5e1] leading-relaxed">Tint folder icons in your active accent color (Dateien und andere Icons bleiben immer weiß im Dark Mode).</p>
                  </div>
                  <AppCheckbox :model-value="accentIcons" @update:model-value="setAccentIcons" />
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: THUMBNAILS -->
          <div v-else-if="activeTab === 'thumbnails'" key="tab-thumbnails" class="space-y-6">
            <!-- 1. Enable / Disable Thumbnail Generation -->
            <div class="glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 rounded-2xl p-6 space-y-5 shadow-lg">
              <div class="flex items-center justify-between border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 pb-3">
                <h3 class="text-sm font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
                  <FilmIcon class="w-4 h-4 text-indigo-500" />
                  <span>Automatic Media Thumbnails</span>
                </h3>
                <span 
                  class="text-xs font-semibold px-2 py-0.5 rounded-md"
                  :class="customThumbnailsEnabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30'"
                >
                  {{ customThumbnailsEnabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>

              <div class="flex items-center justify-between gap-4">
                <div class="space-y-1">
                  <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] block">Enable Image & Video Thumbnail Generation</label>
                  <p class="text-xs text-[#475569] dark:text-[#cbd5e1] leading-relaxed">
                    When browsing files in grid or list view, FluxCloud automatically generates lightweight, optimized WebP previews for images and videos as they scroll into view.
                  </p>
                </div>
                <AppCheckbox 
                  :model-value="customThumbnailsEnabled" 
                  @update:model-value="(val) => { customThumbnailsEnabled = val; triggerAutoSave(true) }" 
                />
              </div>
            </div>

            <!-- 2. Worker Threads / Concurrency -->
            <div class="glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 rounded-2xl p-6 space-y-5 shadow-lg">
              <div class="flex items-center justify-between border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 pb-3">
                <h3 class="text-sm font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
                  <CpuIcon class="w-4 h-4 text-indigo-500" />
                  <span>Worker Threads & Concurrency</span>
                </h3>
                <span class="text-xs font-mono font-bold accent-text">{{ customThumbnailWorkers }} {{ customThumbnailWorkers === 1 ? 'Worker' : 'Workers' }}</span>
              </div>

              <p class="text-xs text-[#475569] dark:text-[#e2e8f0] font-normal leading-relaxed">
                Control how many thumbnail generation processes can run simultaneously in the background. Lower values save CPU on smaller servers, while higher values generate previews faster.
              </p>

              <!-- Workers Range Slider -->
              <div class="space-y-3">
                <div class="flex items-center justify-between text-xs text-[#64748b] dark:text-[#cbd5e1]">
                  <span>1 Worker (Low CPU)</span>
                  <span class="font-bold text-[#0f172a] dark:text-[#fafafa]">{{ customThumbnailWorkers }} Threads</span>
                  <span>16 Workers (Maximum)</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="16" 
                  step="1" 
                  v-model.number="customThumbnailWorkers" 
                  class="w-full accent-text cursor-pointer"
                />
              </div>

              <!-- Worker Presets -->
              <div class="space-y-1.5 pt-2">
                <label class="text-[11px] font-semibold text-[#475569] dark:text-[#e2e8f0] block">Recommended Presets</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="preset in [
                      { label: '1 Worker (Eco / NAS)', val: 1 },
                      { label: '2 Workers', val: 2 },
                      { label: '4 Workers (Recommended)', val: 4 },
                      { label: '8 Workers (Multi-core)', val: 8 },
                      { label: '16 Workers (High Performance)', val: 16 }
                    ]"
                    :key="preset.val"
                    type="button"
                    @click="customThumbnailWorkers = preset.val; triggerAutoSave(true)"
                    class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer"
                    :class="customThumbnailWorkers === preset.val ? 'accent-bg text-white border-transparent shadow-xs' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-indigo-400 text-[#0f172a] dark:text-[#cbd5e1]'"
                  >
                    {{ preset.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. FFmpeg System Requirement & Live Status -->
            <div class="glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 rounded-2xl p-6 space-y-5 shadow-lg">
              <div class="flex items-center justify-between border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 pb-3">
                <h3 class="text-sm font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
                  <component :is="ffmpegStatus?.available ? CheckCircle2Icon : AlertTriangleIcon" class="w-4 h-4" :class="ffmpegStatus?.available ? 'text-emerald-500' : 'text-amber-500'" />
                  <span>FFmpeg System Dependency</span>
                </h3>
                <div class="flex items-center gap-2">
                  <span 
                    class="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    :class="ffmpegStatus?.available ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'"
                  >
                    <span class="w-2 h-2 rounded-full" :class="ffmpegStatus?.available ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'"></span>
                    <span>{{ ffmpegStatus?.available ? `Installed (${ffmpegStatus.version})` : 'Not Found on Host' }}</span>
                  </span>
                  <button 
                    @click="loadFfmpegStatus" 
                    :disabled="isCheckingFfmpeg" 
                    class="p-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[#64748b] dark:text-[#cbd5e1] active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Re-check FFmpeg availability"
                  >
                    <RefreshCwIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': isCheckingFfmpeg }" />
                  </button>
                </div>
              </div>

              <p class="text-xs text-[#475569] dark:text-[#e2e8f0] font-normal leading-relaxed">
                FFmpeg is required for extracting high-performance video preview frames and converting media into compressed WebP thumbnails.
              </p>

              <!-- Notice / Installation Box -->
              <div 
                class="p-4 rounded-xl border text-xs space-y-3"
                :class="ffmpegStatus?.available ? 'bg-emerald-500/5 border-emerald-500/20 text-[#0f172a] dark:text-[#fafafa]' : 'bg-amber-500/10 border-amber-500/30 text-[#0f172a] dark:text-[#fafafa]'"
              >
                <div class="flex items-start gap-2.5">
                  <component :is="ffmpegStatus?.available ? CheckCircle2Icon : AlertTriangleIcon" class="w-4 h-4 shrink-0 mt-0.5" :class="ffmpegStatus?.available ? 'text-emerald-500' : 'text-amber-500'" />
                  <div class="space-y-1">
                    <p class="font-bold text-xs" :class="ffmpegStatus?.available ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'">
                      {{ ffmpegStatus?.available ? 'FFmpeg is ready and operational.' : 'FFmpeg is not installed or not in system PATH.' }}
                    </p>
                    <p class="text-[11px] text-[#475569] dark:text-[#cbd5e1] leading-relaxed">
                      {{ ffmpegStatus?.available ? 'Video frames and image thumbnails are actively generated on the fly.' : 'Please install FFmpeg on the server host so video and image thumbnails can be rendered:' }}
                    </p>
                  </div>
                </div>

                <!-- Copyable Install Commands -->
                <div v-if="!ffmpegStatus?.available" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <!-- Windows -->
                  <div class="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-1.5">
                    <span class="text-[11px] font-semibold text-[#0f172a] dark:text-white block">Windows (Winget)</span>
                    <div class="flex items-center justify-between gap-2 bg-black/10 dark:bg-black/30 px-2 py-1 rounded font-mono text-[10px]">
                      <span class="truncate select-all">winget install Gyan.FFmpeg</span>
                      <button @click="copyText('winget install Gyan.FFmpeg')" class="text-indigo-500 hover:text-indigo-400 shrink-0 cursor-pointer">
                        <CopyIcon class="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <!-- Linux / Ubuntu / Debian -->
                  <div class="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-1.5">
                    <span class="text-[11px] font-semibold text-[#0f172a] dark:text-white block">Linux (Ubuntu / Debian)</span>
                    <div class="flex items-center justify-between gap-2 bg-black/10 dark:bg-black/30 px-2 py-1 rounded font-mono text-[10px]">
                      <span class="truncate select-all">sudo apt install ffmpeg</span>
                      <button @click="copyText('sudo apt install ffmpeg')" class="text-indigo-500 hover:text-indigo-400 shrink-0 cursor-pointer">
                        <CopyIcon class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Thumbnail Storage & Cache Management -->
            <div class="glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 rounded-2xl p-6 space-y-5 shadow-lg">
              <div class="flex items-center justify-between border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 pb-3">
                <h3 class="text-sm font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
                  <Trash2Icon class="w-4 h-4 text-indigo-500" />
                  <span>Thumbnail Cache & Storage</span>
                </h3>
                <span class="text-xs font-mono font-bold text-[#64748b] dark:text-[#cbd5e1]">
                  {{ thumbStats.count }} {{ thumbStats.count === 1 ? 'file' : 'files' }} ({{ formatBytes(thumbStats.totalBytes) }})
                </span>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="space-y-1 max-w-xl">
                  <label class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] block">Stored in <code class="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[11px]">data/thumbnails/{user}/</code></label>
                  <p class="text-xs text-[#475569] dark:text-[#cbd5e1] leading-relaxed">
                    Thumbnails are safely stored and cached. You can clear the cache at any time; thumbnails will be automatically regenerated as files are viewed.
                  </p>
                </div>
                <button
                  type="button"
                  @click="handleClearThumbnails"
                  :disabled="isClearingThumbnails || thumbStats.count === 0"
                  class="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 justify-center cursor-pointer"
                >
                  <Trash2Icon class="w-3.5 h-3.5" />
                  <span>{{ isClearingThumbnails ? 'Clearing...' : 'Clear Thumbnail Cache' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 3: UPLOADS -->
          <div v-else-if="activeTab === 'uploads'" key="tab-uploads" class="space-y-6">
            <!-- 1. Max Upload Size Configuration -->
            <div class="glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 rounded-2xl p-6 space-y-5 shadow-lg">
              <div class="flex items-center justify-between border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 pb-3">
                <h3 class="text-sm font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
                  <HardDriveIcon class="w-4 h-4 text-indigo-500" />
                  <span>Maximum Upload File Size</span>
                </h3>
                <span class="text-xs font-mono font-bold accent-text">{{ formatUploadLimit(customMaxUploadSizeMB) }}</span>
              </div>

              <p class="text-xs text-[#475569] dark:text-[#e2e8f0] font-normal leading-relaxed">
                Define the maximum allowed file size for single uploads through the web interface and desktop client.
              </p>

              <!-- Upload Size Range Slider -->
              <div class="space-y-3">
                <div class="flex items-center justify-between text-xs text-[#64748b] dark:text-[#cbd5e1]">
                  <span>10 MB</span>
                  <span class="font-bold text-[#0f172a] dark:text-[#fafafa]">{{ customMaxUploadSizeMB }} MB ({{ (customMaxUploadSizeMB / 1024).toFixed(1) }} GB)</span>
                  <span>10,240 MB (10 GB)</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="10240" 
                  step="50" 
                  v-model.number="customMaxUploadSizeMB" 
                  class="w-full accent-text cursor-pointer"
                />
              </div>

              <!-- Quick Size Presets -->
              <div class="space-y-1.5 pt-2">
                <label class="text-[11px] font-semibold text-[#475569] dark:text-[#e2e8f0] block">Quick Presets</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="preset in [
                      { label: '50 MB', val: 50 },
                      { label: '250 MB', val: 250 },
                      { label: '500 MB', val: 500 },
                      { label: '1 GB', val: 1024 },
                      { label: '2 GB', val: 2048 },
                      { label: '5 GB', val: 5120 },
                      { label: '10 GB', val: 10240 }
                    ]"
                    :key="preset.val"
                    type="button"
                    @click="customMaxUploadSizeMB = preset.val"
                    class="px-3 py-1.5 rounded-xl border text-xs font-medium transition-all active:scale-95 shadow-xs"
                    :class="customMaxUploadSizeMB === preset.val ? 'accent-bg text-white border-transparent' : 'border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10 text-[#0f172a] dark:text-[#fafafa] hover:bg-black/5 dark:hover:bg-white/15'"
                  >
                    {{ preset.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: API & SYNC -->
          <div v-else-if="activeTab === 'api'" key="tab-api" class="space-y-6">
            <!-- 1. API Credentials -->
            <div class="glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 rounded-2xl p-6 space-y-4 shadow-lg">
              <h3 class="text-sm font-bold text-[#0f172a] dark:text-[#fafafa] border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 pb-3 flex items-center gap-2">
                <KeyIcon class="w-4 h-4 text-amber-500" />
                <span>API Key &amp; Synchronization Token</span>
              </h3>
              <p class="text-xs text-[#475569] dark:text-[#e2e8f0] font-normal leading-relaxed">This key authorizes your local C# Desktop client, CLI scripts, and headless daemons to synchronize and upload files directly.</p>
              
              <div class="flex items-center gap-2 pt-1">
                <input 
                  type="text" 
                  v-model="customApiKey" 
                  placeholder="No API Key generated yet" 
                  readonly 
                  class="flex-1 px-3.5 py-2 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 rounded-xl text-xs text-[#0f172a] dark:text-[#fafafa] font-mono focus:outline-none shadow-sm"
                />
                <button 
                  @click="copyKey" 
                  v-if="customApiKey"
                  class="px-3.5 py-2 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-xs text-[#0f172a] dark:text-[#fafafa] font-medium transition-all shadow-sm"
                >
                  Copy
                </button>
                <button 
                  @click="generateKey" 
                  class="px-4 py-2 accent-bg accent-bg-hover rounded-xl text-xs text-white font-semibold transition-all shadow-md active:scale-95 shrink-0"
                >
                  Generate Key
                </button>
              </div>
            </div>

            <!-- 2. Connect Desktop Client -->
            <div class="glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 rounded-2xl p-6 space-y-4 shadow-lg">
              <h3 class="text-sm font-bold text-[#0f172a] dark:text-[#fafafa] border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 pb-3 flex items-center gap-2">
                <ExternalLinkIcon class="w-4 h-4 text-indigo-500" />
                <span>Connect Desktop Sync Client</span>
              </h3>
              <p class="text-xs text-[#475569] dark:text-[#e2e8f0] font-normal leading-relaxed">Click the button below to automatically configure and link your local Windows C# Desktop sync client to this server via protocol handler.</p>
              
              <div class="pt-1">
                <a 
                  :href="`fluxcloud://connect?server=${encodeURIComponent(currentOrigin)}&key=${encodeURIComponent(customApiKey)}`" 
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs text-white font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <ExternalLinkIcon class="w-4 h-4" />
                  <span>Launch &amp; Connect Sync Client</span>
                </a>
              </div>
            </div>
          </div>

          <!-- TAB 4: WEBDAV -->
          <div v-else-if="activeTab === 'webdav'" key="tab-webdav" class="space-y-6">
            <div class="glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 rounded-2xl p-6 space-y-4 shadow-lg">
              <div class="flex items-center justify-between border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 pb-3">
                <h3 class="text-sm font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
                  <HardDriveIcon class="w-4 h-4 text-emerald-500" />
                  <span>WebDAV Server &amp; Network Drive</span>
                </h3>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold" :class="customWebdavEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#64748b] dark:text-[#cbd5e1]'">
                    {{ customWebdavEnabled ? 'Enabled' : 'Disabled' }}
                  </span>
                  <AppCheckbox v-model="customWebdavEnabled" />
                </div>
              </div>

              <p class="text-xs text-[#475569] dark:text-[#e2e8f0] font-normal leading-relaxed">
                Mount your private cloud storage directly as a native network drive in Windows Explorer, macOS Finder, Linux, Cyberduck, or mobile WebDAV apps.
              </p>

              <div v-if="customWebdavEnabled" class="space-y-4 pt-1 animate-in fade-in duration-200">
                <!-- WebDAV URL -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-semibold text-[#475569] dark:text-[#e2e8f0] block">WebDAV Endpoint URL</label>
                  <div class="flex items-center gap-2">
                    <input 
                      type="text" 
                      :value="webdavUrl" 
                      readonly 
                      class="flex-1 px-3.5 py-2 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 rounded-xl text-xs text-[#0f172a] dark:text-[#fafafa] font-mono select-all focus:outline-none shadow-sm"
                    />
                    <button 
                      @click="copyWebdavUrl" 
                      class="px-3.5 py-2 accent-bg accent-bg-hover rounded-xl text-xs text-white font-semibold transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0"
                    >
                      <CopyIcon class="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </button>
                  </div>
                </div>

                <!-- WebDAV Connection Instructions -->
                <div class="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2 text-xs text-[#475569] dark:text-[#cbd5e1]">
                  <div class="font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-1.5">
                    <span>💡 How to connect:</span>
                  </div>
                  <ul class="list-disc list-inside space-y-1 text-[11px]">
                    <li><strong>Windows Explorer</strong>: This PC &rarr; Map network drive &rarr; Paste WebDAV URL</li>
                    <li><strong>macOS Finder</strong>: Go &rarr; Connect to Server (⌘K) &rarr; Paste WebDAV URL</li>
                    <li><strong>Authentication</strong>: Use your personal account username and password</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 5: USERS (ADMIN ONLY) -->
          <div v-else-if="activeTab === 'users' && currentUser?.role === 'admin'" key="tab-users" class="space-y-6">
            <div class="glass-card border border-[#e2e8f0]/80 dark:border-[#27272a]/80 rounded-2xl p-6 space-y-4 shadow-lg">
              <div class="flex items-center justify-between border-b border-[#e2e8f0]/80 dark:border-[#27272a]/80 pb-3">
                <h3 class="text-sm font-bold text-[#0f172a] dark:text-[#fafafa] flex items-center gap-2">
                  <UsersIcon class="w-4 h-4 text-indigo-500" />
                  <span>User Accounts &amp; Access</span>
                </h3>
                <span class="text-xs text-[#64748b] dark:text-[#cbd5e1] font-medium">{{ usersList.length }} {{ usersList.length === 1 ? 'user' : 'users' }}</span>
              </div>

              <p class="text-xs text-[#475569] dark:text-[#e2e8f0] font-normal leading-relaxed">
                Create user accounts. When a new user logs in for the first time with their username, they will choose their password to activate their private isolated cloud space.
              </p>

              <!-- Create User Form -->
              <form @submit.prevent="handleCreateUser" class="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3">
                <span class="text-xs font-semibold text-[#0f172a] dark:text-[#fafafa] block">Add New User</span>
                <div class="flex items-center gap-2">
                  <input 
                    v-model="newUserName" 
                    type="text" 
                    placeholder="Username (e.g. john)" 
                    required
                    class="flex-1 px-3 py-1.5 bg-white/80 dark:bg-[#12131a]/80 border border-black/10 dark:border-white/10 focus:border-indigo-500 rounded-lg text-xs text-[#0f172a] dark:text-[#fafafa] focus:outline-none"
                  />
                  <AppSelect 
                    v-model="newUserRole" 
                    :options="roleOptions"
                  />
                  <button 
                    type="submit" 
                    :disabled="isCreatingUser || !newUserName.trim()"
                    class="px-3.5 py-1.5 accent-bg accent-bg-hover disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all active:scale-95 shrink-0"
                  >
                    {{ isCreatingUser ? 'Adding...' : 'Add User' }}
                  </button>
                </div>
              </form>

              <!-- Users List Table -->
              <div class="space-y-2 max-h-80 overflow-y-auto">
                <div 
                  v-for="u in usersList" 
                  :key="u.id"
                  class="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-xl accent-bg flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm shrink-0">
                      {{ u.username.charAt(0) }}
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="font-semibold text-[#0f172a] dark:text-[#fafafa] truncate">{{ u.username }}</span>
                      <span class="text-[10px] text-[#64748b] dark:text-[#cbd5e1]">
                        {{ u.hasPassword ? 'Active Account' : 'Pending First-Login Password' }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <span 
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                      :class="u.role === 'admin' ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                    >
                      {{ u.role }}
                    </span>

                    <button 
                      v-if="u.id !== currentUser?.id && u.username.toLowerCase() !== currentUser?.username.toLowerCase()" 
                      @click="handleDeleteUser(u)" 
                      class="p-1 text-[#94a3b8] dark:text-[#cbd5e1] hover:text-red-500 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      title="Delete User"
                    >
                      <Trash2Icon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  Settings as SettingsIcon, 
  Sparkles as SparklesIcon, 
  Key as KeyIcon, 
  ExternalLink as ExternalLinkIcon, 
  HardDrive as HardDriveIcon, 
  Users as UsersIcon, 
  Trash2 as Trash2Icon, 
  Copy as CopyIcon,
  Monitor as MonitorIcon, 
  Sun as SunIcon, 
  Moon as MoonIcon,
  Image as ImageIcon,
  Check as CheckIcon,
  Upload as UploadIcon,
  UploadCloud as UploadCloudIcon,
  Palette as PaletteIcon,
  Film as FilmIcon,
  Cpu as CpuIcon,
  RefreshCw as RefreshCwIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle2 as CheckCircle2Icon
} from 'lucide-vue-next'
import { useFileHelpers } from '../../composables/useFileHelpers'
import { useToast } from '../../composables/useToast'
import { useTheme } from '../../composables/useTheme'
import { useAuth } from '../../composables/useAuth'
import { useBackground } from '../../composables/useBackground'
import AppCheckbox from '../ui/AppCheckbox.vue'
import AppSelect from '../ui/AppSelect.vue'

const props = defineProps({
  config: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['saved'])

const { copyToClipboard, formatBytes } = useFileHelpers()
const { success, error } = useToast()
const { themeMode, setTheme, setAccentColor, accentIcons, setAccentIcons } = useTheme()
const { currentUser } = useAuth()
const { 
  WALLPAPER_PRESETS, 
  currentBackground, 
  backgroundBlur,
  backgroundBrightness, 
  setBackground, 
  setBlur,
  setBrightness, 
  uploadCustomBackground, 
  resetBackground 
} = useBackground()

// Active Tab Navigation
const activeTab = ref('customization')

const availableTabs = computed(() => {
  const tabs = [
    { id: 'customization', label: 'Customization', icon: PaletteIcon },
    { id: 'thumbnails', label: 'Thumbnails', icon: FilmIcon },
    { id: 'uploads', label: 'Uploads', icon: UploadCloudIcon },
    { id: 'api', label: 'API & Sync', icon: KeyIcon },
    { id: 'webdav', label: 'WebDAV', icon: HardDriveIcon }
  ]
  if (currentUser.value?.role === 'admin') {
    tabs.push({ id: 'users', label: 'Users', icon: UsersIcon })
  }
  return tabs
})

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' }
]

const customSiteName = ref(props.config?.siteName || 'FluxCloud')
const customColor = ref(props.config?.color || '#818CF8')
const customLogo = ref(props.config?.logo || '')
const customApiKey = ref(props.config?.apiKey || '')
const customCors = ref(props.config?.corsAllowed ?? true)
const customWebdavEnabled = ref(props.config?.webdavEnabled ?? true)
const customMaxUploadSizeMB = ref(props.config?.maxUploadSizeMB || 1024)
const customSharePageBackgroundEnabled = ref(props.config?.sharePageBackgroundEnabled ?? false)
const customThumbnailsEnabled = ref(props.config?.thumbnailsEnabled ?? true)
const customThumbnailWorkers = ref(props.config?.thumbnailWorkers || 4)
const customUrlInput = ref('')
let autoSaveTimer = null
let isInitialized = false

// FFmpeg & Thumbnail Cache State
const ffmpegStatus = ref(null)
const isCheckingFfmpeg = ref(false)
const thumbStats = ref({ count: 0, totalBytes: 0 })
const isClearingThumbnails = ref(false)

// Admin User Management State
const usersList = ref([])
const newUserName = ref('')
const newUserRole = ref('user')
const isCreatingUser = ref(false)

const formatUploadLimit = (mb) => {
  if (!mb) return 'Unlimited'
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB (${mb} MB)`
  }
  return `${mb} MB`
}

const triggerAutoSave = (immediate = false) => {
  if (!isInitialized) return
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  
  if (immediate) {
    executeAutoSave()
  } else {
    autoSaveTimer = setTimeout(() => {
      executeAutoSave()
    }, 500)
  }
}

const executeAutoSave = async () => {
  try {
    const res = await $fetch('/api/config', {
      method: 'POST',
      body: {
        siteName: customSiteName.value,
        color: customColor.value,
        logo: customLogo.value,
        apiKey: customApiKey.value,
        corsAllowed: customCors.value,
        maxUploadSizeMB: customMaxUploadSizeMB.value,
        publicUploadsEnabled: false,
        webdavEnabled: customWebdavEnabled.value,
        webdavUsername: 'admin',
        backgroundImage: currentBackground.value,
        backgroundBlur: backgroundBlur.value,
        backgroundBrightness: backgroundBrightness.value,
        backgroundOpacity: backgroundBrightness.value,
        sharePageBackgroundEnabled: customSharePageBackgroundEnabled.value,
        thumbnailsEnabled: customThumbnailsEnabled.value,
        thumbnailWorkers: customThumbnailWorkers.value
      }
    })
    emit('saved', res.config)
  } catch (err) {
    console.error('AutoSave failed:', err)
  }
}

const loadFfmpegStatus = async () => {
  isCheckingFfmpeg.value = true
  try {
    const res = await $fetch('/api/system/ffmpeg-status')
    ffmpegStatus.value = res
  } catch {
    ffmpegStatus.value = { available: false, version: null }
  } finally {
    isCheckingFfmpeg.value = false
  }
}

const loadThumbStats = async () => {
  try {
    const res = await $fetch('/api/thumbnails/stats')
    thumbStats.value = res
  } catch {}
}

const handleClearThumbnails = async () => {
  isClearingThumbnails.value = true
  try {
    const res = await $fetch('/api/thumbnails/clear', { method: 'POST' })
    success('Cache cleared', `Freed ${formatBytes(res.freedBytes)} (${res.clearedCount} thumbnails removed)`)
    await loadThumbStats()
  } catch (err) {
    error('Clear failed', err?.data?.statusMessage || err.message || 'Could not clear cache')
  } finally {
    isClearingThumbnails.value = false
  }
}

const copyText = async (text) => {
  if (await copyToClipboard(text)) {
    success('Copied', `"${text}" copied to clipboard`)
  }
}

const handleColorChange = (newColor) => {
  customColor.value = newColor
  setAccentColor(newColor)
  triggerAutoSave(true)
}

const selectPreset = (preset) => {
  setBackground(preset.url)
  triggerAutoSave(true)
  success('Wallpaper updated', `Selected "${preset.name}"`)
}

const clearCustomBackground = () => {
  resetBackground()
  triggerAutoSave(true)
  success('Wallpaper cleared', 'Returned to standard solid theme')
}

const handleCustomBgUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    await uploadCustomBackground(file)
    triggerAutoSave(true)
    success('Wallpaper uploaded', 'Custom background applied successfully')
  } catch (err) {
    error('Upload failed', err.message || 'Could not load image')
  }
}

const applyCustomUrl = () => {
  if (!customUrlInput.value.trim()) return
  setBackground(customUrlInput.value.trim())
  triggerAutoSave(true)
  success('Wallpaper URL applied', 'Custom background image applied')
  customUrlInput.value = ''
}

const loadUsersList = async () => {
  if (currentUser.value?.role !== 'admin') return
  try {
    const res = await $fetch('/api/admin/users')
    usersList.value = res.users || []
  } catch {}
}

const handleCreateUser = async () => {
  if (!newUserName.value.trim()) return
  isCreatingUser.value = true
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        username: newUserName.value.trim(),
        role: newUserRole.value
      }
    })
    success('User created', `Created user account for "${newUserName.value.trim()}"`)
    newUserName.value = ''
    newUserRole.value = 'user'
    await loadUsersList()
  } catch (err) {
    error('Creation failed', err?.data?.statusMessage || 'Could not create user')
  } finally {
    isCreatingUser.value = false
  }
}

const handleDeleteUser = async (targetUser) => {
  if (!confirm(`Are you sure you want to delete user "${targetUser.username}"?`)) return
  try {
    await $fetch('/api/admin/users', {
      method: 'DELETE',
      body: { id: targetUser.id, username: targetUser.username }
    })
    success('User deleted', `Deleted user "${targetUser.username}"`)
    await loadUsersList()
  } catch (err) {
    error('Delete failed', err?.data?.statusMessage || 'Could not delete user')
  }
}

onMounted(() => {
  loadUsersList()
  loadFfmpegStatus()
  loadThumbStats()
  setTimeout(() => {
    isInitialized = true
  }, 100)
})

onUnmounted(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})

// Auto-save watchers for fields
watch(customSiteName, () => triggerAutoSave(false))
watch(customCors, () => triggerAutoSave(true))
watch(customWebdavEnabled, () => triggerAutoSave(true))
watch(customMaxUploadSizeMB, () => triggerAutoSave(false))
watch(backgroundBlur, () => triggerAutoSave(false))
watch(backgroundBrightness, () => triggerAutoSave(false))
watch(customSharePageBackgroundEnabled, () => triggerAutoSave(true))
watch(customThumbnailsEnabled, () => triggerAutoSave(true))
watch(customThumbnailWorkers, () => triggerAutoSave(false))

watch(() => props.config, (newVal) => {
  if (newVal) {
    customSiteName.value = newVal.siteName || 'FluxCloud'
    customColor.value = newVal.color || '#818CF8'
    customLogo.value = newVal.logo || ''
    customApiKey.value = newVal.apiKey || ''
    customCors.value = newVal.corsAllowed ?? true
    customWebdavEnabled.value = newVal.webdavEnabled ?? true
    customMaxUploadSizeMB.value = newVal.maxUploadSizeMB || 1024
    customSharePageBackgroundEnabled.value = newVal.sharePageBackgroundEnabled ?? false
    customThumbnailsEnabled.value = newVal.thumbnailsEnabled ?? true
    customThumbnailWorkers.value = newVal.thumbnailWorkers || 4
  }
}, { immediate: true })

const currentOrigin = computed(() => {
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:3033'
})

const webdavUrl = computed(() => {
  return `${currentOrigin.value}/dav/`
})

const handleLogoFile = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    customLogo.value = event.target?.result
    triggerAutoSave(true)
  }
  reader.readAsDataURL(file)
}

const resetLogo = () => {
  customLogo.value = ''
  triggerAutoSave(true)
}

const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'fc_'
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  customApiKey.value = result
  triggerAutoSave(true)
}

const copyKey = async () => {
  if (await copyToClipboard(customApiKey.value)) {
    success('API Key copied', 'Credentials copied to clipboard')
  }
}

const copyWebdavUrl = async () => {
  if (await copyToClipboard(webdavUrl.value)) {
    success('WebDAV URL copied', 'Endpoint URL copied to clipboard')
  }
}
</script>
