export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  future: {
    compatibilityVersion: 4
  },
  ssr: false,
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  devServer: {
    port: 3033
  },
  nitro: {
    preset: process.env.NITRO_PRESET || undefined,
    serveStatic: 'inline',
    experimental: {
      asyncContext: true
    }
  }
})
