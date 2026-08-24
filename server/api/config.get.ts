import { defineEventHandler } from 'h3'
import { getConfig } from '../utils/storage'

export default defineEventHandler((event) => {
  return getConfig()
})
