import daisyui from "daisyui"
import { addDynamicIconSelectors } from "@iconify/tailwind"

/** DaisyUI 5 主题色是完整 oklch；TW3 的 /opacity 需要 <alpha-value> */
const withAlpha = (cssVar) =>
  `color-mix(in oklab, var(${cssVar}) calc(100% * <alpha-value>), transparent)`

const daisyColorsWithAlpha = {
  "base-100": withAlpha("--color-base-100"),
  "base-200": withAlpha("--color-base-200"),
  "base-300": withAlpha("--color-base-300"),
  "base-content": withAlpha("--color-base-content"),
  primary: withAlpha("--color-primary"),
  "primary-content": withAlpha("--color-primary-content"),
  secondary: withAlpha("--color-secondary"),
  "secondary-content": withAlpha("--color-secondary-content"),
  accent: withAlpha("--color-accent"),
  "accent-content": withAlpha("--color-accent-content"),
  neutral: withAlpha("--color-neutral"),
  "neutral-content": withAlpha("--color-neutral-content"),
  info: withAlpha("--color-info"),
  "info-content": withAlpha("--color-info-content"),
  success: withAlpha("--color-success"),
  "success-content": withAlpha("--color-success-content"),
  warning: withAlpha("--color-warning"),
  "warning-content": withAlpha("--color-warning-content"),
  error: withAlpha("--color-error"),
  "error-content": withAlpha("--color-error-content"),
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // 与下方 post-daisyui 插件双写，确保不被 daisy 默认 var() 色板盖掉
      colors: daisyColorsWithAlpha,
    },
  },
  plugins: [
    daisyui,
    // daisyui 的 theme.extend.colors 会覆盖用户配置，必须在其后再次注入
    {
      handler() {},
      config: {
        theme: {
          extend: {
            colors: daisyColorsWithAlpha,
          },
        },
      },
    },
    // 类名：i-[mdi--home]（任意值语法，见 Iconify TW3 文档）
    addDynamicIconSelectors({ prefix: "i" }),
  ],
  daisyui: {
    themes: ["light", "dark"],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}
