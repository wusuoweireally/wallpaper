import { ref } from "vue"

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ConfirmState extends Required<Omit<ConfirmOptions, "danger">> {
  open: boolean
  danger: boolean
}

const state = ref<ConfirmState>({
  open: false,
  title: "确认",
  message: "",
  confirmText: "确认",
  cancelText: "取消",
  danger: false,
})

let resolver: ((ok: boolean) => void) | null = null

const close = (ok: boolean) => {
  state.value.open = false
  resolver?.(ok)
  resolver = null
}

export function confirmAction(options: ConfirmOptions | string): Promise<boolean> {
  const opts = typeof options === "string" ? { message: options } : options
  // 上一个确认框还没落定就被覆盖时，先按取消结清，避免调用方永久挂起
  resolver?.(false)
  state.value = {
    open: true,
    title: opts.title ?? "确认",
    message: opts.message,
    confirmText: opts.confirmText ?? "确认",
    cancelText: opts.cancelText ?? "取消",
    danger: Boolean(opts.danger),
  }
  return new Promise((resolve) => {
    resolver = resolve
  })
}

export function useConfirmDialog() {
  return {
    state,
    accept: () => close(true),
    cancel: () => close(false),
  }
}
