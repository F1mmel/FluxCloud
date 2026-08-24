import { ref, reactive, onUnmounted } from 'vue'

export interface LassoState {
  active: boolean
  startX: number
  startY: number
  x: number
  y: number
  w: number
  h: number
}

export function useLasso(containerRef: () => HTMLElement | null, selectedItems: { value: Set<string> }) {
  const lasso = reactive<LassoState>({
    active: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    w: 0,
    h: 0
  })

  let isListening = false

  const cleanupListeners = () => {
    if (!isListening || typeof window === 'undefined') return
    window.removeEventListener('pointermove', onPointerMove, { capture: true })
    window.removeEventListener('pointerup', onPointerUp, { capture: true })
    window.removeEventListener('pointercancel', onPointerUp, { capture: true })
    window.removeEventListener('mouseup', onPointerUp, { capture: true })
    window.removeEventListener('dragstart', onPointerUp, { capture: true })
    window.removeEventListener('blur', onPointerUp)
    isListening = false
  }

  const stopLasso = () => {
    lasso.active = false
    lasso.w = 0
    lasso.h = 0
    cleanupListeners()
  }

  const onPointerMove = (e: PointerEvent | MouseEvent) => {
    // If buttons released or not primary button (e.buttons !== 1), immediately stop
    if ('buttons' in e && e.buttons === 0) {
      stopLasso()
      return
    }

    if (!lasso.active) {
      cleanupListeners()
      return
    }

    const x1 = Math.min(lasso.startX, e.clientX)
    const x2 = Math.max(lasso.startX, e.clientX)
    const y1 = Math.min(lasso.startY, e.clientY)
    const y2 = Math.max(lasso.startY, e.clientY)

    lasso.x = x1
    lasso.y = y1
    lasso.w = x2 - x1
    lasso.h = y2 - y1

    // Intersection test with file items
    const container = containerRef()
    if (!container) return

    const elements = container.querySelectorAll<HTMLElement>('.file-item-element')
    elements.forEach(el => {
      const rect = el.getBoundingClientRect()
      const intersects = !(
        rect.right < lasso.x ||
        rect.left > (lasso.x + lasso.w) ||
        rect.bottom < lasso.y ||
        rect.top > (lasso.y + lasso.h)
      )

      const name = el.getAttribute('data-name')
      if (name) {
        if (intersects) {
          selectedItems.value.add(name)
        } else if (!e.ctrlKey && !e.shiftKey) {
          selectedItems.value.delete(name)
        }
      }
    })
  }

  const onPointerUp = () => {
    stopLasso()
  }

  const startLasso = (e: MouseEvent | PointerEvent) => {
    if (e.button !== 0) return // Left click only

    const target = e.target as HTMLElement | null
    if (
      target?.closest('button') ||
      target?.closest('input') ||
      target?.closest('a') ||
      target?.closest('.file-item-element') ||
      target?.closest('.interactive-control') ||
      target?.closest('.modal-content')
    ) {
      return
    }

    // Reset selection if Ctrl / Shift not held
    if (!e.ctrlKey && !e.shiftKey) {
      selectedItems.value.clear()
    }

    lasso.active = true
    lasso.startX = e.clientX
    lasso.startY = e.clientY
    lasso.x = e.clientX
    lasso.y = e.clientY
    lasso.w = 0
    lasso.h = 0

    cleanupListeners()

    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', onPointerMove, { capture: true, passive: true })
      window.addEventListener('pointerup', onPointerUp, { capture: true })
      window.addEventListener('pointercancel', onPointerUp, { capture: true })
      window.addEventListener('mouseup', onPointerUp, { capture: true })
      window.addEventListener('dragstart', onPointerUp, { capture: true })
      window.addEventListener('blur', onPointerUp)
      isListening = true
    }
  }

  onUnmounted(() => {
    cleanupListeners()
  })

  return {
    lasso,
    startLasso,
    stopLasso
  }
}
