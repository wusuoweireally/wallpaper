<template>
  <button
    type="button"
    class="wb-icon-btn h-8 w-8 text-muted hover:text-fg"
    :aria-label="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'"
    :aria-pressed="theme === 'dark'"
    @click="toggle"
  >
    <i
      v-if="theme === 'light'"
      class="i-[mdi--weather-night] text-base"
      aria-hidden="true"
    ></i>
    <i
      v-else
      class="i-[mdi--white-balance-sunny] text-base"
      aria-hidden="true"
    ></i>
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
