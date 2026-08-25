import { defineEventHandler } from 'h3'
import { checkFfmpegInstalled } from '../../utils/thumbnail'

export default defineEventHandler(async (event) => {
  const result = await checkFfmpegInstalled(true) // Force fresh check
  return result
})
