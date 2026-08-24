import { defineEventHandler } from 'h3'
import { handleWebDavRequest } from '../utils/webdav'

export default defineEventHandler(async (event) => {
  return await handleWebDavRequest(event, '/webdav')
})
