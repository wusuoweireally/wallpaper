import { ref } from 'vue'

export interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: number
  visible: boolean
}

const toasts = ref<ToastItem[]>([])
let toastId = 0

export function useToast() {
  const show = (options: ToastOptions) => {
    const id = ++toastId
    const toast: ToastItem = {
      id,
      visible: true,
      ...options,
    }

    toasts.value.push(toast)

    // 自动关闭
    if (options.duration !== 0) {
      setTimeout(() => {
        remove(id)
      }, options.duration || 3000)
    }

    return id
  }

  const remove = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
    return show({ message, type: 'success', ...options })
  }

  const error = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
    return show({ message, type: 'error', ...options })
  }

  const warning = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
    return show({ message, type: 'warning', ...options })
  }

  const info = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
    return show({ message, type: 'info', ...options })
  }

  const clear = () => {
    toasts.value = []
  }

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear,
  }
}

// 全局单例
let globalToast: ReturnType<typeof useToast> | null = null

export function useGlobalToast() {
  if (!globalToast) {
    globalToast = useToast()
  }
  return globalToast
}
