<template>
  <button
    type="button"
    class="wb-icon-btn h-8 w-8 text-muted hover:text-fg"
    :aria-label="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'"
    :aria-pressed="theme === 'dark'"
    @click="toggle"
  >
    <svg
      v-if="theme === 'light'"
      class="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0 1 12 21.75 9.75 9.75 0 0 1 12 2.25c.214 0 .428.007.64.022a.75.75 0 0 1 .42 1.273 7.5 7.5 0 0 0 8.67 11.457.75.75 0 0 1 1.022 1Z"
      />
    </svg>
    <svg
      v-else
      class="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.364-6.364-1.06 1.06M6.697 17.303l-1.06 1.06m12.727 0-1.06-1.06M6.697 6.697l-1.06-1.06M12 7.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue"
import { resolveInitialTheme, setTheme, subscribeTheme, type ThemeMode } from "@/utils/theme"

// 直接用真实初始值，避免深色用户首帧看到错误图标
const theme = ref<ThemeMode>(resolveInitialTheme())
let unsub: (() => void) | null = null

onMounted(() => {
  unsub = subscribeTheme((mode) => {
    theme.value = mode
  })
})

onUnmounted(() => {
  unsub?.()
})

const toggle = () => {
  const next = theme.value === "light" ? "dark" : "light"
  theme.value = next
  setTheme(next)
}
</script>
