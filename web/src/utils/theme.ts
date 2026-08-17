export type ThemeMode = "light" | "dark"

const THEME_KEY = "theme"
/** 主题切换过渡：临时给根元素加类，动画结束后移除 */
const ANIM_CLASS = "theme-anim"
const ANIM_MS = 400

type ThemeListener = (mode: ThemeMode) => void
const listeners = new Set<ThemeListener>()

export const subscribeTheme = (fn: ThemeListener) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const notify = (mode: ThemeMode) => {
  listeners.forEach((fn) => fn(mode))
}

/** localStorage 有值 = 用户手动选择过，不再跟随系统 */
export const getStoredTheme = (): ThemeMode | null => {
  if (typeof window === "undefined") return null
  const saved = localStorage.getItem(THEME_KEY)
  return saved === "dark" || saved === "light" ? saved : null
}

export const getSystemTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light"
  const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null
  return media?.matches ? "dark" : "light"
}

export const resolveInitialTheme = (): ThemeMode => {
  return getStoredTheme() ?? getSystemTheme()
}

export const applyTheme = (mode: ThemeMode) => {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.classList.toggle("dark", mode === "dark")
  root.setAttribute("data-theme", mode)
  root.style.colorScheme = mode
}

/** 手动切换：记录选择 + 带过渡动画 */
export const setTheme = (mode: ThemeMode) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_KEY, mode)
  }
  applyTheme(mode)
  notify(mode)
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.classList.add(ANIM_CLASS)
  window.setTimeout(() => root.classList.remove(ANIM_CLASS), ANIM_MS)
}

/**
 * 系统主题变化时：仅在用户从未手动选择过时跟随。
 * 返回取消订阅函数。
 */
export const watchSystemTheme = (): (() => void) => {
  if (typeof window === "undefined" || !window.matchMedia) return () => {}
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const onChange = () => {
    if (getStoredTheme()) return
    applyTheme(media.matches ? "dark" : "light")
    notify(media.matches ? "dark" : "light")
  }
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}
