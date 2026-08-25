import { ref } from 'vue'

export interface FontOption {
  name: string
  label: string
  weights: string
}

export const AVAILABLE_FONTS: FontOption[] = [
  { name: 'Inter', label: 'Inter (Clean Default)', weights: '300;400;500;600;700;800' },
  { name: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Modern & Sleek)', weights: '400;500;600;700;800' },
  { name: 'Outfit', label: 'Outfit (Geometric & Clean)', weights: '300;400;500;600;700;800' },
  { name: 'Figtree', label: 'Figtree (Friendly Sans)', weights: '400;500;600;700;800' },
  { name: 'DM Sans', label: 'DM Sans (Minimalist)', weights: '400;500;700' },
  { name: 'Geist', label: 'Geist Sans (Vercel Style)', weights: '300;400;500;600;700' },
  { name: 'Manrope', label: 'Manrope (Contemporary)', weights: '400;500;600;700;800' },
  { name: 'Space Grotesk', label: 'Space Grotesk (Tech & Modernist)', weights: '400;500;600;700' },
  { name: 'Lexend', label: 'Lexend (High Legibility)', weights: '300;400;500;600;700' },
  { name: 'Poppins', label: 'Poppins (Geometric)', weights: '300;400;500;600;700' },
  { name: 'Urbanist', label: 'Urbanist (Clean Grotesque)', weights: '300;400;500;600;700;800' },
  { name: 'Montserrat', label: 'Montserrat (Bold Architecture)', weights: '300;400;500;600;700;800' },
  { name: 'Nunito', label: 'Nunito (Soft Rounded)', weights: '300;400;600;700;800' },
  { name: 'Raleway', label: 'Raleway (Elegant Sans)', weights: '300;400;500;600;700;800' },
  { name: 'Work Sans', label: 'Work Sans (Screen Grotesque)', weights: '300;400;500;600;700;800' },
  { name: 'Syne', label: 'Syne (Futuristic & Edgy)', weights: '400;600;700;800' },
  { name: 'Bricolage Grotesque', label: 'Bricolage Grotesque (Expressive)', weights: '400;500;600;700;800' },
  { name: 'Rethink Sans', label: 'Rethink Sans (Editorial)', weights: '400;500;600;700;800' },
  { name: 'Rubik', label: 'Rubik (Soft Tech)', weights: '400;500;600;700;800' },
  { name: 'Cabinet Grotesk', label: 'Cabinet Grotesk (Swiss Design)', weights: '400;500;700;800' },
  { name: 'Satoshi', label: 'Satoshi (Geometric Sans)', weights: '400;500;700;900' },
  { name: 'Roboto', label: 'Roboto (Google Classic)', weights: '300;400;500;700' }
]

const currentFont = ref(typeof localStorage !== 'undefined' ? (localStorage.getItem('fc_font') || 'Inter') : 'Inter')

export function useFont() {
  const setFont = (fontName: string) => {
    currentFont.value = fontName
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fc_font', fontName)
    }

    if (typeof document !== 'undefined') {
      const fontObj = AVAILABLE_FONTS.find(f => f.name === fontName) || { name: fontName, weights: '400;500;600;700' }
      const linkId = `font-link-${fontName.replace(/\s+/g, '-').toLowerCase()}`
      
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        if (fontName === 'Geist') {
          link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap'
        } else if (fontName === 'Cabinet Grotesk' || fontName === 'Satoshi') {
          link.href = `https://api.fontshare.com/v2/css?f[]=${fontName.toLowerCase().replace(/\s+/g, '-')}:wght@400;500;600;700&display=swap`
        } else {
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontObj.name)}:wght@${fontObj.weights}&display=swap`
        }
        document.head.appendChild(link)
      }

      const fontStack = `"${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
      document.documentElement.style.setProperty('--app-font', fontStack)
      document.body.style.setProperty('--app-font', fontStack)
      document.body.style.fontFamily = fontStack
    }
  }

  const initFont = () => {
    setFont(currentFont.value)
  }

  return {
    currentFont,
    availableFonts: AVAILABLE_FONTS,
    setFont,
    initFont
  }
}
