import plugin from "tailwindcss/plugin"
import { addDynamicIconSelectors } from "@iconify/tailwind"

/** TW3 的 /opacity 需要 <alpha-value> */
const withAlpha = (cssVar) =>
  `color-mix(in oklab, var(${cssVar}) calc(100% * <alpha-value>), transparent)`

const colors = {
  canvas: withAlpha("--wb-canvas"),
  subtle: withAlpha("--wb-subtle"),
  surface: withAlpha("--wb-surface"),
  inset: withAlpha("--wb-inset"),
  line: withAlpha("--wb-border"),
  fg: withAlpha("--wb-fg"),
  muted: withAlpha("--wb-muted"),
  faint: withAlpha("--wb-faint"),
  primary: withAlpha("--wb-accent"),
  "primary-fill": withAlpha("--wb-accent-fill"),
  "primary-content": withAlpha("--wb-accent-fg"),
  error: withAlpha("--wb-danger"),
  success: withAlpha("--wb-success"),
  warning: withAlpha("--wb-warning"),
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors,
      maxWidth: {
        content: "80rem",
        wide: "90rem",
        gallery: "100rem",
      },
      borderRadius: {
        control: "0.75rem",
        tile: "1.25rem",
        card: "0.75rem",
        panel: "1rem",
      },
      fontFamily: {
        sans: [
          "Noto Sans SC",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      const utilities = {}
      for (const [name, value] of Object.entries({
        canvas: "var(--wb-canvas)",
        subtle: "var(--wb-subtle)",
        surface: "var(--wb-surface)",
        inset: "var(--wb-inset)",
        line: "var(--wb-border)",
        fg: "var(--wb-fg)",
        muted: "var(--wb-muted)",
        faint: "var(--wb-faint)",
      })) {
        utilities[`.bg-${name}`] = { "background-color": value }
        utilities[`.text-${name}`] = { color: value }
        utilities[`.border-${name}`] = { "border-color": value }
        utilities[`.ring-${name}`] = { "--tw-ring-color": value }
        utilities[`.divide-${name}`] = { "border-color": value }
      }
      addUtilities(utilities)
    }),
    addDynamicIconSelectors({ prefix: "i" }),
  ],
}
