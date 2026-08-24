import { ensureDataStructure, getConfig } from '../utils/storage'

// Set production default port to 3033 if not specified
if (!process.env.PORT && !process.env.NITRO_PORT) {
  process.env.PORT = '3033'
  process.env.NITRO_PORT = '3033'
}

export default defineNitroPlugin(() => {
  // Initialize data directory and configuration immediately upon startup
  try {
    ensureDataStructure()
    getConfig()
  } catch (err) {
    console.error('Storage initialization error:', err)
  }

  // Print startup info
  setTimeout(() => {
    const port = process.env.PORT || process.env.NITRO_PORT || 3033
    const host = process.env.HOST || 'localhost'
    const url = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`

    console.log('\n======================================================')
    console.log('  ✨ FluxCloud is running!')
    console.log(`  🌐 Web App:    ${url}`)
    console.log(`  📁 Storage:    data/`)
    console.log(`  🔌 WebDAV:     ${url}/dav/`)
    console.log('======================================================\n')
  }, 200)
})
