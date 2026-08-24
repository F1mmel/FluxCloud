import { ref, computed } from 'vue'

export interface WallpaperPreset {
  id: string
  name: string
  category: string
  url: string
  thumbnail: string
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'none',
    name: 'None (Solid)',
    category: 'Default',
    url: '',
    thumbnail: ''
  },
  {
    id: 'nextcloud-flow',
    name: 'Nextcloud Flow',
    category: 'Abstract',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1920&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=70&w=240&auto=format&fit=crop'
  },
  {
    id: 'alpine-peaks',
    name: 'Alpine Peaks',
    category: 'Nature',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=70&w=240&auto=format&fit=crop'
  },
  {
    id: 'emerald-forest',
    name: 'Misty Forest',
    category: 'Nature',
    url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1920&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1511497584788-87676104235f?q=70&w=240&auto=format&fit=crop'
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    category: 'Ocean',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=70&w=240&auto=format&fit=crop'
  },
  {
    id: 'aurora-night',
    name: 'Aurora Borealis',
    category: 'Space',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1920&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=70&w=240&auto=format&fit=crop'
  },
  {
    id: 'desert-sunset',
    name: 'Desert Dunes',
    category: 'Nature',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1920&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=70&w=240&auto=format&fit=crop'
  },
  {
    id: 'cosmic-galaxy',
    name: 'Cosmic Nebula',
    category: 'Space',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1920&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=70&w=240&auto=format&fit=crop'
  },
  {
    id: 'dark-obsidian',
    name: 'Dark Obsidian',
    category: 'Minimal',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=70&w=240&auto=format&fit=crop'
  }
]

const currentBackground = ref<string>('')
const backgroundBlur = ref<number>(2)
const backgroundBrightness = ref<number>(100)

export function useBackground() {
  const initBackground = (serverConfig?: { backgroundImage?: string; backgroundBlur?: number; backgroundOpacity?: number; backgroundBrightness?: number }) => {
    if (typeof window === 'undefined') return

    // 1. Check local storage preference first
    const savedBg = localStorage.getItem('fc_background')
    if (savedBg !== null) {
      currentBackground.value = savedBg
    } else if (serverConfig?.backgroundImage) {
      currentBackground.value = serverConfig.backgroundImage
    }

    const savedBlur = localStorage.getItem('fc_bg_blur')
    if (savedBlur !== null) {
      backgroundBlur.value = parseInt(savedBlur, 10) || 2
    } else if (typeof serverConfig?.backgroundBlur === 'number') {
      backgroundBlur.value = serverConfig.backgroundBlur
    }

    const savedBrightness = localStorage.getItem('fc_bg_brightness') || localStorage.getItem('fc_bg_opacity')
    if (savedBrightness !== null) {
      backgroundBrightness.value = parseInt(savedBrightness, 10) || 100
    } else if (typeof serverConfig?.backgroundBrightness === 'number') {
      backgroundBrightness.value = serverConfig.backgroundBrightness
    } else if (typeof serverConfig?.backgroundOpacity === 'number') {
      backgroundBrightness.value = serverConfig.backgroundOpacity
    }
  }

  const setBackground = (url: string) => {
    currentBackground.value = url || ''
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_background', currentBackground.value)
    }
  }

  const setBlur = (blur: number) => {
    backgroundBlur.value = blur
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_bg_blur', blur.toString())
    }
  }

  const setBrightness = (brightness: number) => {
    backgroundBrightness.value = brightness
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_bg_brightness', brightness.toString())
    }
  }

  const setOpacity = setBrightness

  const uploadCustomBackground = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Selected file is not an image'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        if (!dataUrl) {
          reject(new Error('Failed to read image'))
          return
        }

        // Scale uploaded image to forced 16:9 format without any cropping
        const img = new Image()
        img.onload = () => {
          try {
            // Force standard 16:9 resolution (QHD 2560x1440 for high crisp quality)
            const targetWidth = 2560
            const targetHeight = 1440

            const canvas = document.createElement('canvas')
            canvas.width = targetWidth
            canvas.height = targetHeight
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              setBackground(dataUrl)
              resolve(dataUrl)
              return
            }

            // Draw full image scaled directly into 16:9 canvas (entire image preserved)
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
            const optimized = canvas.toDataURL('image/jpeg', 0.92)
            setBackground(optimized)
            resolve(optimized)
          } catch {
            setBackground(dataUrl)
            resolve(dataUrl)
          }
        }
        img.onerror = () => {
          setBackground(dataUrl)
          resolve(dataUrl)
        }
        img.src = dataUrl
      }
      reader.onerror = () => reject(new Error('Error reading image file'))
      reader.readAsDataURL(file)
    })
  }

  const resetBackground = () => {
    setBackground('')
  }

  const hasCustomBackground = computed(() => {
    return !!currentBackground.value
  })

  return {
    WALLPAPER_PRESETS,
    currentBackground,
    backgroundBlur,
    backgroundBrightness,
    backgroundOpacity: backgroundBrightness,
    hasCustomBackground,
    initBackground,
    setBackground,
    setBlur,
    setBrightness,
    setOpacity: setBrightness,
    uploadCustomBackground,
    resetBackground
  }
}
