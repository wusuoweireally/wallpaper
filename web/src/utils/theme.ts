export type ThemeMode = "light" | "dark"

const THEME_KEY = "theme"

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

export const setTheme = (mode: ThemeMode) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_KEY, mode)
  }
  applyTheme(mode)
}
