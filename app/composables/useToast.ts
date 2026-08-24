import { ref } from 'vue'

export interface ToastItem {
  id: string
  title: string
  message?: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

const toasts = ref<ToastItem[]>([])

export function useToast() {
  const showToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastItem = {
      id,
      title: toast.title,
      message: toast.message,
      type: toast.type || 'info',
      duration: toast.duration ?? 3500
    }

    toasts.value.push(newToast)

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const success = (title: string, message?: string) => showToast({ title, message, type: 'success' })
  const error = (title: string, message?: string) => showToast({ title, message, type: 'error', duration: 5000 })
  const info = (title: string, message?: string) => showToast({ title, message, type: 'info' })
  const warning = (title: string, message?: string) => showToast({ title, message, type: 'warning' })

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning
  }
}
