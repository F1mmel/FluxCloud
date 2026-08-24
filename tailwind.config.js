/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './server/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#09090b',
          card: '#12131a',
          surface: '#18181b',
          border: '#27272a',
          text: '#fafafa',
          muted: '#a1a1aa'
        },
        light: {
          bg: '#f8fafc',
          card: '#ffffff',
          surface: '#f1f5f9',
          border: '#e2e8f0',
          text: '#0f172a',
          muted: '#64748b'
        }
      }
    }
  },
  plugins: []
}
