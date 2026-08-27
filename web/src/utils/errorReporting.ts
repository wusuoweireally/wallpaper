import type { App } from "vue"

// 全局错误上报（仅生产启用）：window error / unhandledrejection / Vue errorHandler
// 三源合一，sendBeacon 优先、fetch keepalive 兜底发往 /api/client-errors；
// 相同 message 在 5 秒窗口内只发一次，避免异常风暴刷爆服务端日志。

const REPORT_URL = "/api/client-errors"
const DEDUP_WINDOW = 5000
// 截断上限需与后端 ClientErrorDto 校验规则保持一致
const MAX_MESSAGE = 500
const MAX_STACK = 2000

interface ErrorPayload {
  message: string
  url: string
  line: number | null
  col: number | null
  stack: string | null
}

let lastMessage = ""
let lastSentAt = 0

function send(payload: ErrorPayload) {
  // 去重：同 message 连发只保留窗口内第一条
  const now = Date.now()
  if (payload.message === lastMessage && now - lastSentAt < DEDUP_WINDOW) return
  lastMessage = payload.message
  lastSentAt = now

  try {
    const body = JSON.stringify(payload)
    // 页面即将卸载时仍可送达；返回 false（如被浏览器限制）则降级 fetch
    if (navigator.sendBeacon?.(REPORT_URL, new Blob([body], { type: "application/json" }))) return
    void fetch(REPORT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // 上报失败静默，不影响主流程
  }
}

export function installErrorReporting(app: App) {
  if (!import.meta.env.PROD) return

  // 同步脚本/资源加载错误
  window.addEventListener("error", (event) => {
    const err = event.error
    send({
      message: String(err?.message ?? event.message ?? "未知错误").slice(0, MAX_MESSAGE),
      url: location.pathname + location.search,
      line: event.lineno ?? null,
      col: event.colno ?? null,
      stack: String(err?.stack ?? "").slice(0, MAX_STACK) || null,
    })
  })

  // 未被 catch 的 Promise 拒绝
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason
    send({
      message: `[unhandledrejection] ${String(reason?.message ?? reason).slice(0, MAX_MESSAGE - 22)}`,
      url: location.pathname + location.search,
      line: null,
      col: null,
      stack: String(reason?.stack ?? "").slice(0, MAX_STACK) || null,
    })
  })

  // Vue 组件渲染/生命周期内错误
  app.config.errorHandler = (err, _instance, info) => {
    const e = err instanceof Error ? err : new Error(String(err))
    send({
      message: e.message.slice(0, MAX_MESSAGE),
      url: location.pathname + location.search,
      line: null,
      col: null,
      stack: `${e.stack ?? ""}\n[vue] ${info}`.slice(0, MAX_STACK) || null,
    })
  }
}
