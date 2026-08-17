import { ref } from "vue"

export interface ToastOptions {
  message: string
  type?: "success" | "error" | "warning" | "info"
  title?: string
  /** 0 表示不自动关闭 */
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: number
  visible: boolean
}

/** 同屏最多显示条数，超出时挤掉最旧的 */
const MAX_TOASTS = 3
/** 退场动画时长，remove 后等动画播完再真正卸载 */
const LEAVE_MS = 320
/** 各类型默认停留时长（错误类读起来更慢） */
const DEFAULT_DURATION: Record<NonNullable<ToastOptions["type"]>, number> = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 6000,
}

const toasts = ref<ToastItem[]>([])
let toastId = 0

export function useToast() {
  const show = (options: ToastOptions) => {
    const id = ++toastId
    const type = options.type ?? "info"
    // 最新在顶
    toasts.value.unshift({ id, visible: true, type, ...options })
    while (toasts.value.length > MAX_TOASTS) toasts.value.pop()

    const duration = options.duration ?? DEFAULT_DURATION[type]
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }

    return id
  }

  const remove = (id: number) => {
    const toast = toasts.value.find((t) => t.id === id)
    if (!toast || !toast.visible) return
    toast.visible = false // 先播退场动画
    setTimeout(() => {
      const index = toasts.value.findIndex((t) => t.id === id)
      if (index !== -1) toasts.value.splice(index, 1)
    }, LEAVE_MS)
  }

  const success = (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
    return show({ message, type: "success", ...options })
  }

  const error = (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
    return show({ message, type: "error", ...options })
  }

  const warning = (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
    return show({ message, type: "warning", ...options })
  }

  const info = (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
    return show({ message, type: "info", ...options })
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
