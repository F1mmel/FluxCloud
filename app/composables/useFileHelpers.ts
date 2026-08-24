export function useFileHelpers() {
  const formatBytes = (bytes: number, decimals = 2): string => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileCategory = (name: string, isDirectory: boolean): 'folder' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other' => {
    if (isDirectory) return 'folder'
    const ext = name.includes('.') ? `.${name.split('.').pop()?.toLowerCase()}` : ''
    
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff']
    const videoExts = ['.mp4', '.webm', '.ogv', '.mov', '.mkv', '.avi']
    const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']
    const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.csv']
    const codeExts = ['.js', '.ts', '.vue', '.json', '.html', '.css', '.scss', '.py', '.c', '.cpp', '.cs', '.go', '.rs', '.java', '.php', '.sh', '.yml', '.yaml', '.xml', '.sql', '.md']
    const archiveExts = ['.zip', '.tar', '.gz', '.7z', '.rar']

    if (imageExts.includes(ext)) return 'image'
    if (videoExts.includes(ext)) return 'video'
    if (audioExts.includes(ext)) return 'audio'
    if (docExts.includes(ext)) return 'document'
    if (codeExts.includes(ext)) return 'code'
    if (archiveExts.includes(ext)) return 'archive'
    return 'other'
  }

  const isImage = (name: string) => getFileCategory(name, false) === 'image'
  const isVideo = (name: string) => getFileCategory(name, false) === 'video'
  const isAudio = (name: string) => getFileCategory(name, false) === 'audio'
  const isPdf = (name: string) => name.toLowerCase().endsWith('.pdf')
  const isCodeOrText = (name: string) => {
    const cat = getFileCategory(name, false)
    return cat === 'code' || name.toLowerCase().endsWith('.txt') || name.toLowerCase().endsWith('.md') || name.toLowerCase().endsWith('.log') || name.toLowerCase().endsWith('.csv') || name.toLowerCase().endsWith('.json')
  }

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    } catch {
      return false
    }
  }

  const getQrCodeUrl = (text: string, size = 220): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(text)}`
  }

  return {
    formatBytes,
    formatDate,
    getFileCategory,
    isImage,
    isVideo,
    isAudio,
    isPdf,
    isCodeOrText,
    copyToClipboard,
    getQrCodeUrl
  }
}
