import { ref } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'

const themeMode = ref<ThemeMode>('system')
const isDark = ref(false)
const accentColor = ref<string>('#818CF8')
const accentIcons = ref<boolean>(false)

export function useTheme() {
  const applyTheme = () => {
    if (typeof window === 'undefined') return

    let effectiveDark = false
    if (themeMode.value === 'system') {
      effectiveDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    } else {
      effectiveDark = themeMode.value === 'dark'
    }

    isDark.value = effectiveDark
    const root = document.documentElement
    const body = document.body

    if (effectiveDark) {
      root.classList.add('dark')
      root.classList.remove('light')
      body?.classList.add('dark')
      body?.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
      body?.classList.add('light')
      body?.classList.remove('dark')
    }
  }

  const setTheme = (mode: ThemeMode) => {
    themeMode.value = mode
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_theme', mode)
    }
    applyTheme()
  }

  const setAccentColor = (color: string) => {
    if (!color) return
    accentColor.value = color
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_accent_color', color)
      document.documentElement.style.setProperty('--accent-color', color)
      document.documentElement.style.setProperty('--accent-bg-alpha', `${color}26`)
      document.body?.style.setProperty('--accent-color', color)
      document.body?.style.setProperty('--accent-bg-alpha', `${color}26`)
    }
  }

  const setAccentIcons = (enabled: boolean) => {
    accentIcons.value = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_accent_icons', enabled ? 'true' : 'false')
      if (enabled) {
        document.documentElement.classList.add('accent-icons')
      } else {
        document.documentElement.classList.remove('accent-icons')
      }
    }
  }

  const initAccentIcons = () => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('fc_accent_icons') === 'true'
    accentIcons.value = saved
    if (saved) {
      document.documentElement.classList.add('accent-icons')
    } else {
      document.documentElement.classList.remove('accent-icons')
    }
  }

  const initAccent = (serverColor?: string) => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('fc_accent_color')
    const color = saved || serverColor || '#818CF8'
    accentColor.value = color
    document.documentElement.style.setProperty('--accent-color', color)
    document.documentElement.style.setProperty('--accent-bg-alpha', `${color}26`)
    document.body?.style.setProperty('--accent-color', color)
    document.body?.style.setProperty('--accent-bg-alpha', `${color}26`)
  }

  const initTheme = (serverColor?: string) => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('fc_theme') as ThemeMode
    if (saved && ['system', 'light', 'dark'].includes(saved)) {
      themeMode.value = saved
    } else {
      themeMode.value = 'system'
    }
    applyTheme()
    initAccent(serverColor)
    initAccentIcons()

    // Listen for OS system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (themeMode.value === 'system') {
        applyTheme()
      }
    })
  }

  return {
    themeMode,
    isDark,
    accentColor,
    accentIcons,
    setTheme,
    setAccentColor,
    setAccentIcons,
    initAccent,
    initTheme
  }
}
