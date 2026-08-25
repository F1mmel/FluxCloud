import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { VERSIONS_DIR, VERSIONS_INDEX_PATH, sanitizeRelativePath, getConfig } from './storage'
import { resolveUserUploadPath } from './auth'

export interface FileVersionItem {
  id: string
  username: string
  relativePath: string
  fileName: string
  versionNumber: number
  size: number
  createdAt: string
  modifiedBy: string
  storedFileName: string
  comment?: string
}

export function getVersionsIndex(): FileVersionItem[] {
  if (!fs.existsSync(VERSIONS_INDEX_PATH)) {
    return []
  }
  try {
    const content = fs.readFileSync(VERSIONS_INDEX_PATH, 'utf-8')
    return JSON.parse(content) || []
  } catch (err) {
    console.error('Error reading versions index:', err)
    return []
  }
}

export function saveVersionsIndex(versions: FileVersionItem[]) {
  try {
    const tempPath = `${VERSIONS_INDEX_PATH}.tmp`
    fs.writeFileSync(tempPath, JSON.stringify(versions, null, 2), 'utf-8')
    fs.renameSync(tempPath, VERSIONS_INDEX_PATH)
  } catch (err) {
    console.error('Error saving versions index:', err)
  }
}

/**
 * Creates a version snapshot of an existing file before it is overwritten.
 */
export async function createFileVersionSnapshot(
  username: string, 
  relativePath: string, 
  comment = 'Auto-snapshot'
): Promise<FileVersionItem | null> {
  const config = getConfig()
  const maxCopies = typeof config.maxVersionCopies === 'number' ? config.maxVersionCopies : 20
  if (maxCopies <= 0) {
    return null // Versioning disabled
  }

  const safePath = sanitizeRelativePath(relativePath)
  const fullPath = resolveUserUploadPath(username, safePath)

  if (!fs.existsSync(fullPath)) {
    return null
  }

  const stat = fs.statSync(fullPath)
  if (stat.isDirectory()) {
    return null
  }

  // Ensure user versions directory exists
  const userVersionsDir = path.join(VERSIONS_DIR, username)
  if (!fs.existsSync(userVersionsDir)) {
    fs.mkdirSync(userVersionsDir, { recursive: true })
  }

  const index = getVersionsIndex()
  const fileVersions = index.filter(v => v.username === username && v.relativePath === safePath)
  const nextVersionNum = fileVersions.length > 0 
    ? Math.max(...fileVersions.map(v => v.versionNumber)) + 1 
    : 1

  const versionId = crypto.randomUUID()
  const fileName = path.basename(fullPath)
  const ext = path.extname(fileName)
  const storedFileName = `${versionId}${ext}`
  const storedFullPath = path.join(userVersionsDir, storedFileName)

  // Copy current file to versions storage
  fs.copyFileSync(fullPath, storedFullPath)

  const newVersion: FileVersionItem = {
    id: versionId,
    username,
    relativePath: safePath,
    fileName,
    versionNumber: nextVersionNum,
    size: stat.size,
    createdAt: new Date().toISOString(),
    modifiedBy: username,
    storedFileName,
    comment
  }

  index.unshift(newVersion)

  // Retention limit: keep max configurable copies per file
  const updatedForFile = index.filter(v => v.username === username && v.relativePath === safePath)
  if (updatedForFile.length > maxCopies) {
    const toRemove = updatedForFile.slice(maxCopies)
    for (const rem of toRemove) {
      const p = path.join(userVersionsDir, rem.storedFileName)
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p) } catch {}
      }
      const idx = index.findIndex(x => x.id === rem.id)
      if (idx !== -1) index.splice(idx, 1)
    }
  }

  saveVersionsIndex(index)
  return newVersion
}

/**
 * Gets all versions for a specific file, sorted from newest to oldest.
 */
export function getFileVersions(username: string, relativePath: string): FileVersionItem[] {
  const safePath = sanitizeRelativePath(relativePath)
  const index = getVersionsIndex()
  return index
    .filter(v => v.username === username && v.relativePath === safePath)
    .sort((a, b) => b.versionNumber - a.versionNumber)
}

/**
 * Restores a specific version of a file.
 */
export async function restoreFileVersion(
  username: string, 
  relativePath: string, 
  versionId: string
): Promise<{ success: boolean; message: string; versionNumber: number }> {
  const safePath = sanitizeRelativePath(relativePath)
  const fullPath = resolveUserUploadPath(username, safePath)
  const index = getVersionsIndex()
  const version = index.find(v => v.id === versionId && v.username === username && v.relativePath === safePath)

  if (!version) {
    throw new Error('Version not found')
  }

  const userVersionsDir = path.join(VERSIONS_DIR, username)
  const storedFullPath = path.join(userVersionsDir, version.storedFileName)

  if (!fs.existsSync(storedFullPath)) {
    throw new Error('Stored version file is missing')
  }

  // First, snapshot current state before overwriting so no data is ever lost
  if (fs.existsSync(fullPath)) {
    await createFileVersionSnapshot(username, safePath, `Before restore to v${version.versionNumber}`)
  }

  // Copy historical version to target location
  const parentDir = path.dirname(fullPath)
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true })
  }

  fs.copyFileSync(storedFullPath, fullPath)

  return {
    success: true,
    message: `Restored to version ${version.versionNumber}`,
    versionNumber: version.versionNumber
  }
}

/**
 * Deletes a single version.
 */
export function deleteFileVersion(username: string, versionId: string): boolean {
  const index = getVersionsIndex()
  const idx = index.findIndex(v => v.id === versionId && v.username === username)
  if (idx === -1) return false

  const version = index[idx]
  const storedFullPath = path.join(VERSIONS_DIR, username, version.storedFileName)
  if (fs.existsSync(storedFullPath)) {
    try { fs.unlinkSync(storedFullPath) } catch {}
  }

  index.splice(idx, 1)
  saveVersionsIndex(index)
  return true
}

/**
 * Purges all versions for a file when the file is permanently deleted.
 */
export function purgeFileVersions(username: string, relativePath: string) {
  const safePath = sanitizeRelativePath(relativePath)
  const index = getVersionsIndex()
  const toDelete = index.filter(v => v.username === username && (v.relativePath === safePath || v.relativePath.startsWith(`${safePath}/`)))
  
  for (const item of toDelete) {
    const storedFullPath = path.join(VERSIONS_DIR, username, item.storedFileName)
    if (fs.existsSync(storedFullPath)) {
      try { fs.unlinkSync(storedFullPath) } catch {}
    }
  }

  const remaining = index.filter(v => !(v.username === username && (v.relativePath === safePath || v.relativePath.startsWith(`${safePath}/`))))
  saveVersionsIndex(remaining)
}
