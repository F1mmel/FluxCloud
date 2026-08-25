import fs from 'node:fs'

export interface PhotoExif {
  dateTaken?: string | null
  make?: string | null
  model?: string | null
  lens?: string | null
  fNumber?: number | null
  exposureTime?: string | null
  iso?: number | null
  focalLength?: number | null
  width?: number | null
  height?: number | null
  latitude?: number | null
  longitude?: number | null
}

/**
 * Parses EXIF data from JPEG/WebP buffer
 */
export function extractExifFromFile(filePath: string): PhotoExif {
  const result: PhotoExif = {}

  try {
    const fd = fs.openSync(filePath, 'r')
    const buffer = Buffer.alloc(65536) // Read first 64KB for EXIF headers
    const bytesRead = fs.readSync(fd, buffer, 0, 65536, 0)
    fs.closeSync(fd)

    if (bytesRead < 32) return result

    let tiffOffset = -1

    // 1. JPEG EXIF check (SOI = 0xFFD8)
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let pos = 2
      while (pos < bytesRead - 4) {
        if (buffer[pos] !== 0xFF) break
        const marker = buffer[pos + 1]
        const length = buffer.readUInt16BE(pos + 2)

        // APP1 Marker (0xFFE1) with Exif header
        if (marker === 0xE1) {
          const exifHeader = buffer.toString('ascii', pos + 4, pos + 8)
          if (exifHeader === 'Exif') {
            tiffOffset = pos + 10
            break
          }
        }
        pos += 2 + length
      }
    } 
    // 2. WebP EXIF check (RIFF....WEBP)
    else if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      let pos = 12
      while (pos < bytesRead - 8) {
        const chunkHeader = buffer.toString('ascii', pos, pos + 4)
        const chunkSize = buffer.readUInt32LE(pos + 4)
        if (chunkHeader === 'EXIF') {
          tiffOffset = pos + 8
          if (buffer.toString('ascii', tiffOffset, tiffOffset + 4) === 'Exif') {
            tiffOffset += 6
          }
          break
        }
        pos += 8 + chunkSize + (chunkSize % 2)
      }
    }

    if (tiffOffset === -1 || tiffOffset >= bytesRead - 8) {
      return result
    }

    // Parse TIFF header
    const byteOrder = buffer.toString('ascii', tiffOffset, tiffOffset + 2)
    const isLittleEndian = byteOrder === 'II'
    const isBigEndian = byteOrder === 'MM'
    if (!isLittleEndian && !isBigEndian) return result

    const readU16 = (off: number) => isLittleEndian ? buffer.readUInt16LE(off) : buffer.readUInt16BE(off)
    const readU32 = (off: number) => isLittleEndian ? buffer.readUInt32LE(off) : buffer.readUInt32BE(off)

    const ifdOffset = readU32(tiffOffset + 4)
    if (ifdOffset === 0 || tiffOffset + ifdOffset >= bytesRead) return result

    const parseIFD = (offset: number) => {
      if (offset >= bytesRead - 2) return
      const entryCount = readU16(offset)
      let cur = offset + 2

      let exifSubIFDOffset = 0
      let gpsIFDOffset = 0

      for (let i = 0; i < entryCount && cur < bytesRead - 12; i++, cur += 12) {
        const tag = readU16(cur)
        const type = readU16(cur + 2)
        const count = readU32(cur + 4)
        const valueOrOffset = cur + 8

        const getString = () => {
          const off = count > 4 ? tiffOffset + readU32(valueOrOffset) : valueOrOffset
          if (off < bytesRead) {
            return buffer.toString('utf8', off, Math.min(bytesRead, off + count)).replace(/\0+$/, '').trim()
          }
          return null
        }

        const getRational = () => {
          const off = tiffOffset + readU32(valueOrOffset)
          if (off < bytesRead - 8) {
            const num = readU32(off)
            const den = readU32(off + 4)
            return den !== 0 ? num / den : null
          }
          return null
        }

        // Standard TIFF tags
        if (tag === 0x010F) result.make = getString() // Make
        if (tag === 0x0110) result.model = getString() // Model
        if (tag === 0x0132) result.dateTaken = getString() // ModifyDate
        if (tag === 0x8769) exifSubIFDOffset = readU32(valueOrOffset) // ExifIFDPointer
        if (tag === 0x8825) gpsIFDOffset = readU32(valueOrOffset) // GPSInfoIFDPointer
        if (tag === 0xA002 || tag === 0x0100) result.width = count === 1 && type === 3 ? readU16(valueOrOffset) : readU32(valueOrOffset)
        if (tag === 0xA003 || tag === 0x0101) result.height = count === 1 && type === 3 ? readU16(valueOrOffset) : readU32(valueOrOffset)

        // Exif SubIFD tags
        if (tag === 0x9003 || tag === 0x9004) {
          const dt = getString()
          if (dt) result.dateTaken = dt
        }
        if (tag === 0x829D) result.fNumber = getRational() // FNumber
        if (tag === 0x8827) result.iso = readU16(valueOrOffset) // ISO
        if (tag === 0x920A) result.focalLength = getRational() // FocalLength
        if (tag === 0xA434) result.lens = getString() // LensModel
        if (tag === 0x829A) { // ExposureTime
          const r = getRational()
          if (r) {
            result.exposureTime = r < 1 ? `1/${Math.round(1 / r)}s` : `${r.toFixed(1)}s`
          }
        }
      }

      if (exifSubIFDOffset > 0 && tiffOffset + exifSubIFDOffset < bytesRead) {
        parseIFD(tiffOffset + exifSubIFDOffset)
      }

      if (gpsIFDOffset > 0 && tiffOffset + gpsIFDOffset < bytesRead) {
        parseGPSIFD(tiffOffset + gpsIFDOffset)
      }
    }

    const parseGPSIFD = (offset: number) => {
      if (offset >= bytesRead - 2) return
      const entryCount = readU16(offset)
      let cur = offset + 2

      let latRef = 'N'
      let lonRef = 'E'
      let latVal: number[] = []
      let lonVal: number[] = []

      for (let i = 0; i < entryCount && cur < bytesRead - 12; i++, cur += 12) {
        const tag = readU16(cur)
        const valueOrOffset = cur + 8

        const getRationals = (cnt: number) => {
          const off = tiffOffset + readU32(valueOrOffset)
          const vals: number[] = []
          for (let j = 0; j < cnt && off + j * 8 < bytesRead - 8; j++) {
            const num = readU32(off + j * 8)
            const den = readU32(off + j * 8 + 4)
            vals.push(den !== 0 ? num / den : 0)
          }
          return vals
        }

        if (tag === 0x0001) latRef = buffer.toString('ascii', valueOrOffset, valueOrOffset + 1)
        if (tag === 0x0002) latVal = getRationals(3)
        if (tag === 0x0003) lonRef = buffer.toString('ascii', valueOrOffset, valueOrOffset + 1)
        if (tag === 0x0004) lonVal = getRationals(3)
      }

      if (latVal.length === 3) {
        let lat = latVal[0] + latVal[1] / 60 + latVal[2] / 3600
        if (latRef === 'S') lat = -lat
        result.latitude = parseFloat(lat.toFixed(6))
      }

      if (lonVal.length === 3) {
        let lon = lonVal[0] + lonVal[1] / 60 + lonVal[2] / 3600
        if (lonRef === 'W') lon = -lon
        result.longitude = parseFloat(lon.toFixed(6))
      }
    }

    parseIFD(tiffOffset + ifdOffset)

    // Normalize dateTaken string ("YYYY:MM:DD HH:MM:SS" -> ISO string)
    if (result.dateTaken && typeof result.dateTaken === 'string') {
      const match = result.dateTaken.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
      if (match) {
        result.dateTaken = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.000Z`
      }
    }
  } catch {}

  return result
}
