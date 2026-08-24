import fs from 'node:fs'
import { promises as fsPromises } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import type { H3Event } from 'h3'
import { 
  getHeader, 
  setHeader, 
  setResponseStatus, 
  readRawBody, 
  createError, 
  sendStream 
} from 'h3'
import { 
  getConfig, 
  resolveUploadPath, 
  sanitizeRelativePath, 
  getMimeType, 
  UPLOADS_DIR 
} from './storage'
import { getAuthenticatedUser, resolveUserUploadPath } from './auth'

/**
 * Encodes special XML characters to prevent XML injection
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

/**
 * Handles WebDAV protocol requests for a given mount prefix (e.g. /dav or /webdav)
 */
export async function handleWebDavRequest(event: H3Event, mountPrefix = '/dav') {
  const config = getConfig()

  // 1. Check if WebDAV is enabled
  if (config.webdavEnabled === false) {
    setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    throw createError({
      statusCode: 403,
      statusMessage: 'WebDAV is disabled in server settings.'
    })
  }

  // 2. Authentication Check
  const users = config.users || []
  const hasUsers = users.length > 0
  const authUser = getAuthenticatedUser(event)

  if (hasUsers && !authUser) {
    setHeader(event, 'WWW-Authenticate', 'Basic realm="FluxCloud WebDAV", charset="UTF-8"')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Please provide valid FluxCloud credentials.'
    })
  }

  const username = authUser?.username || 'default'

  // 3. Normalize requested path
  const method = event.method.toUpperCase()
  const rawPath = event.path || '/'
  
  // Strip mount prefix
  let relativePath = rawPath
  if (relativePath.startsWith(mountPrefix)) {
    relativePath = relativePath.slice(mountPrefix.length)
  }
  // Strip query parameters
  const qIndex = relativePath.indexOf('?')
  if (qIndex !== -1) {
    relativePath = relativePath.slice(0, qIndex)
  }

  const safeRelPath = sanitizeRelativePath(relativePath)
  const fullFsPath = resolveUserUploadPath(username, safeRelPath)
  const baseHref = mountPrefix.endsWith('/') ? mountPrefix.slice(0, -1) : mountPrefix

  // 4. Handle Standard WebDAV Methods

  // A. OPTIONS: Capabilities discovery
  if (method === 'OPTIONS') {
    setHeader(event, 'DAV', '1, 2')
    setHeader(event, 'MS-Author-Via', 'DAV')
    setHeader(event, 'Allow', 'OPTIONS, GET, HEAD, POST, PUT, DELETE, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK')
    setHeader(event, 'Content-Length', '0')
    setResponseStatus(event, 200)
    return ''
  }

  // B. PROPFIND: Directory / file metadata listing
  if (method === 'PROPFIND') {
    if (!fs.existsSync(fullFsPath)) {
      throw createError({ statusCode: 404, statusMessage: 'Resource Not Found' })
    }

    const depthHeader = getHeader(event, 'depth') || '1'
    const depth = depthHeader === '0' ? 0 : 1 // 0 = self only, 1 = self + children

    const stat = fs.statSync(fullFsPath)
    const isDir = stat.isDirectory()

    let xml = `<?xml version="1.0" encoding="utf-8"?>\n<D:multistatus xmlns:D="DAV:">\n`

    // Helper to generate a <D:response> item
    const appendItemXml = (itemFsPath: string, itemRelPath: string) => {
      try {
        const itemStat = fs.statSync(itemFsPath)
        const itemIsDir = itemStat.isDirectory()
        const itemName = path.basename(itemFsPath)
        
        let href = `${baseHref}/${itemRelPath}`.replace(/\/+/g, '/')
        if (itemIsDir && !href.endsWith('/')) href += '/'

        const lastModifiedUtc = itemStat.mtime.toUTCString()
        const creationIso = itemStat.birthtime.toISOString()
        const etag = `"${itemStat.size}-${itemStat.mtimeMs}"`

        xml += `  <D:response>\n`
        xml += `    <D:href>${escapeXml(encodeURI(href))}</D:href>\n`
        xml += `    <D:propstat>\n`
        xml += `      <D:prop>\n`
        xml += `        <D:displayname>${escapeXml(itemName || 'root')}</D:displayname>\n`
        
        if (itemIsDir) {
          xml += `        <D:resourcetype><D:collection/></D:resourcetype>\n`
        } else {
          xml += `        <D:resourcetype/>\n`
          xml += `        <D:getcontentlength>${itemStat.size}</D:getcontentlength>\n`
          xml += `        <D:getcontenttype>${escapeXml(getMimeType(itemName))}</D:getcontenttype>\n`
          xml += `        <D:getetag>${etag}</D:getetag>\n`
        }

        xml += `        <D:getlastmodified>${lastModifiedUtc}</D:getlastmodified>\n`
        xml += `        <D:creationdate>${creationIso}</D:creationdate>\n`
        xml += `        <D:supportedlock>\n`
        xml += `          <D:lockentry>\n`
        xml += `            <D:lockscope><D:exclusive/></D:lockscope>\n`
        xml += `            <D:locktype><D:write/></D:locktype>\n`
        xml += `          </D:lockentry>\n`
        xml += `        </D:supportedlock>\n`
        xml += `      </D:prop>\n`
        xml += `      <D:status>HTTP/1.1 200 OK</D:status>\n`
        xml += `    </D:propstat>\n`
        xml += `  </D:response>\n`
      } catch (err) {
        console.error('Error generating PROPFIND item XML:', err)
      }
    }

    // 1. Add current target item
    appendItemXml(fullFsPath, safeRelPath)

    // 2. If depth is 1 and it's a directory, add children
    if (isDir && depth >= 1) {
      try {
        const entries = fs.readdirSync(fullFsPath)
        for (const entry of entries) {
          const childFsPath = path.join(fullFsPath, entry)
          const childRelPath = safeRelPath ? `${safeRelPath}/${entry}` : entry
          appendItemXml(childFsPath, childRelPath)
        }
      } catch (e) {
        console.error('Error reading directory in PROPFIND:', e)
      }
    }

    xml += `</D:multistatus>`

    setHeader(event, 'Content-Type', 'application/xml; charset="utf-8"')
    setResponseStatus(event, 207)
    return xml
  }

  // C. GET / HEAD: Read / stream file
  if (method === 'GET' || method === 'HEAD') {
    if (!fs.existsSync(fullFsPath)) {
      throw createError({ statusCode: 404, statusMessage: 'Resource Not Found' })
    }

    const stat = fs.statSync(fullFsPath)
    if (stat.isDirectory()) {
      // Return HTML directory index
      setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
      const items = fs.readdirSync(fullFsPath)
      const listHtml = items.map(i => {
        const isChildDir = fs.statSync(path.join(fullFsPath, i)).isDirectory()
        return `<li><a href="${encodeURI(i)}${isChildDir ? '/' : ''}">${escapeXml(i)}${isChildDir ? '/' : ''}</a></li>`
      }).join('\n')

      return `<!DOCTYPE html>
<html>
<head><title>Index of ${escapeXml(rawPath)}</title></head>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>FluxCloud WebDAV: ${escapeXml(rawPath)} (${escapeXml(username)})</h2>
  <hr/>
  <ul>
    ${safeRelPath ? '<li><a href="../">.. (Parent Directory)</a></li>' : ''}
    ${listHtml}
  </ul>
</body>
</html>`
    }

    const mime = getMimeType(path.basename(fullFsPath))
    setHeader(event, 'Content-Type', mime)
    setHeader(event, 'Content-Length', stat.size.toString())
    setHeader(event, 'Last-Modified', stat.mtime.toUTCString())
    setHeader(event, 'ETag', `"${stat.size}-${stat.mtimeMs}"`)

    if (method === 'HEAD') {
      return ''
    }

    return sendStream(event, fs.createReadStream(fullFsPath))
  }

  // D. PUT: Upload / create / replace file
  if (method === 'PUT') {
    const parentDir = path.dirname(fullFsPath)
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true })
    }

    const existed = fs.existsSync(fullFsPath)
    const rawBody = await readRawBody(event, false)

    if (rawBody) {
      await fsPromises.writeFile(fullFsPath, rawBody)
    } else {
      await fsPromises.writeFile(fullFsPath, Buffer.alloc(0))
    }

    setResponseStatus(event, existed ? 204 : 201)
    return ''
  }

  // E. MKCOL: Create new collection (folder)
  if (method === 'MKCOL') {
    if (fs.existsSync(fullFsPath)) {
      throw createError({ statusCode: 405, statusMessage: 'Collection already exists' })
    }

    const parentDir = path.dirname(fullFsPath)
    if (!fs.existsSync(parentDir)) {
      throw createError({ statusCode: 409, statusMessage: 'Parent collection does not exist' })
    }

    fs.mkdirSync(fullFsPath, { recursive: true })
    setResponseStatus(event, 201)
    return ''
  }

  // F. DELETE: Delete file or directory
  if (method === 'DELETE') {
    if (!fs.existsSync(fullFsPath)) {
      throw createError({ statusCode: 404, statusMessage: 'Resource Not Found' })
    }

    const stat = fs.statSync(fullFsPath)
    if (stat.isDirectory()) {
      fs.rmSync(fullFsPath, { recursive: true, force: true })
    } else {
      fs.unlinkSync(fullFsPath)
    }

    setResponseStatus(event, 204)
    return ''
  }

  // G. MOVE: Rename / Move resource
  if (method === 'MOVE') {
    if (!fs.existsSync(fullFsPath)) {
      throw createError({ statusCode: 404, statusMessage: 'Resource Not Found' })
    }

    const destinationHeader = getHeader(event, 'destination')
    if (!destinationHeader) {
      throw createError({ statusCode: 400, statusMessage: 'Missing Destination Header' })
    }

    let destRel = destinationHeader
    try {
      if (destRel.startsWith('http://') || destRel.startsWith('https://')) {
        const parsedUrl = new URL(destRel)
        destRel = parsedUrl.pathname
      }
    } catch {}

    if (destRel.startsWith(mountPrefix)) {
      destRel = destRel.slice(mountPrefix.length)
    }

    const safeDestRel = sanitizeRelativePath(destRel)
    const destFsPath = resolveUserUploadPath(username, safeDestRel)

    const destParent = path.dirname(destFsPath)
    if (!fs.existsSync(destParent)) {
      fs.mkdirSync(destParent, { recursive: true })
    }

    const destExisted = fs.existsSync(destFsPath)
    fs.renameSync(fullFsPath, destFsPath)

    setResponseStatus(event, destExisted ? 204 : 201)
    return ''
  }

  // H. COPY: Duplicate resource
  if (method === 'COPY') {
    if (!fs.existsSync(fullFsPath)) {
      throw createError({ statusCode: 404, statusMessage: 'Resource Not Found' })
    }

    const destinationHeader = getHeader(event, 'destination')
    if (!destinationHeader) {
      throw createError({ statusCode: 400, statusMessage: 'Missing Destination Header' })
    }

    let destRel = destinationHeader
    try {
      if (destRel.startsWith('http://') || destRel.startsWith('https://')) {
        const parsedUrl = new URL(destRel)
        destRel = parsedUrl.pathname
      }
    } catch {}

    if (destRel.startsWith(mountPrefix)) {
      destRel = destRel.slice(mountPrefix.length)
    }

    const safeDestRel = sanitizeRelativePath(destRel)
    const destFsPath = resolveUserUploadPath(username, safeDestRel)

    const destParent = path.dirname(destFsPath)
    if (!fs.existsSync(destParent)) {
      fs.mkdirSync(destParent, { recursive: true })
    }

    const destExisted = fs.existsSync(destFsPath)
    fs.cpSync(fullFsPath, destFsPath, { recursive: true })

    setResponseStatus(event, destExisted ? 204 : 201)
    return ''
  }

  // I. PROPPATCH: Set properties
  if (method === 'PROPPATCH') {
    setHeader(event, 'Content-Type', 'application/xml; charset="utf-8"')
    setResponseStatus(event, 207)
    return `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>${escapeXml(encodeURI(rawPath))}</D:href>
    <D:propstat>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`
  }

  // J. LOCK / UNLOCK: Windows Explorer / MS Office lock handling
  if (method === 'LOCK') {
    const lockId = crypto.randomUUID()
    setHeader(event, 'Content-Type', 'application/xml; charset="utf-8"')
    setHeader(event, 'Lock-Token', `<urn:uuid:${lockId}>`)
    setResponseStatus(event, 200)

    return `<?xml version="1.0" encoding="utf-8"?>
<D:prop xmlns:D="DAV:">
  <D:lockdiscovery>
    <D:activelock>
      <D:locktype><D:write/></D:locktype>
      <D:lockscope><D:exclusive/></D:lockscope>
      <D:depth>Infinity</D:depth>
      <D:timeout>Second-3600</D:timeout>
      <D:locktoken><D:href>urn:uuid:${lockId}</D:href></D:locktoken>
      <D:lockroot><D:href>${escapeXml(encodeURI(rawPath))}</D:href></D:lockroot>
    </D:activelock>
  </D:lockdiscovery>
</D:prop>`
  }

  if (method === 'UNLOCK') {
    setResponseStatus(event, 204)
    return ''
  }

  // Unsupported method
  setHeader(event, 'Allow', 'OPTIONS, GET, HEAD, POST, PUT, DELETE, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK')
  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
}
