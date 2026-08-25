import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, readBody, createError } from 'h3'
import { saveConfig } from '../utils/storage'

const defaultIconPath = path.resolve(process.cwd(), 'public/fluxcloud_icon.png')

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body'
    })
  }

  let logoToSave = typeof body.logo === 'string' ? body.logo : ''
  if (!logoToSave && fs.existsSync(defaultIconPath)) {
    try {
      const iconData = fs.readFileSync(defaultIconPath)
      logoToSave = `data:image/png;base64,${iconData.toString('base64')}`
    } catch {}
  }

  const updatedConfig = saveConfig({
    color: typeof body.color === 'string' ? body.color : '#818CF8',
    logo: logoToSave,
    apiKey: typeof body.apiKey === 'string' ? body.apiKey : '',
    siteName: typeof body.siteName === 'string' ? body.siteName : 'FluxCloud',
    corsAllowed: body.corsAllowed !== undefined ? !!body.corsAllowed : true,
    maxUploadSizeMB: typeof body.maxUploadSizeMB === 'number' ? body.maxUploadSizeMB : 1024,
    publicUploadsEnabled: body.publicUploadsEnabled !== undefined ? !!body.publicUploadsEnabled : true,
    webdavEnabled: body.webdavEnabled !== undefined ? !!body.webdavEnabled : true,
    webdavUsername: typeof body.webdavUsername === 'string' ? body.webdavUsername : 'admin',
    backgroundImage: typeof body.backgroundImage === 'string' ? body.backgroundImage : '',
    backgroundBlur: typeof body.backgroundBlur === 'number' ? body.backgroundBlur : 2,
    backgroundBrightness: typeof body.backgroundBrightness === 'number' ? body.backgroundBrightness : (typeof body.backgroundOpacity === 'number' ? body.backgroundOpacity : 100),
    backgroundOpacity: typeof body.backgroundBrightness === 'number' ? body.backgroundBrightness : (typeof body.backgroundOpacity === 'number' ? body.backgroundOpacity : 100),
    sharePageBackgroundEnabled: body.sharePageBackgroundEnabled !== undefined ? !!body.sharePageBackgroundEnabled : false,
    thumbnailsEnabled: body.thumbnailsEnabled !== undefined ? !!body.thumbnailsEnabled : true,
    thumbnailWorkers: typeof body.thumbnailWorkers === 'number' && body.thumbnailWorkers >= 1 ? Math.min(16, body.thumbnailWorkers) : 4
  })

  return { success: true, config: updatedConfig }
})
