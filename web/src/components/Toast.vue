<template>
  <Transition name="toast">
    <div
      v-if="visible"
      :class="[
        'relative w-full min-w-[280px] max-w-md rounded-card border px-4 py-3 shadow-sm',
        'flex items-center gap-3',
        typeClasses[type],
      ]"
      :role="type === 'error' ? 'alert' : 'status'"
      aria-live="polite"
    >
      <!-- 图标 -->
      <svg
        v-if="type === 'success'"
        class="h-6 w-6 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <svg
        v-else-if="type === 'error'"
        class="h-6 w-6 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      <svg
        v-else-if="type === 'warning'"
        class="h-6 w-6 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <svg
        v-else
        class="h-6 w-6 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <!-- 内容 -->
      <div class="flex-1">
        <p v-if="title" class="mb-1 text-sm font-semibold">{{ title }}</p>
        <p class="text-sm">{{ message }}</p>
      </div>

      <!-- 关闭按钮 -->
      <button
        @click="close"
        class="flex-shrink-0 rounded p-1 transition-colors hover:bg-fg/10"
        aria-label="关闭通知"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"

export type ToastType = "success" | "error" | "warning" | "info"

interface Props {
  message: string
  type?: ToastType
  title?: string
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: "info",
  modelValue: false,
})

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  close: []
}>()

const visible = ref(props.modelValue)

// 退场由父级置 modelValue=false 触发，计时逻辑统一在 useToast 里
watch(
  () => props.modelValue,
  (newValue) => {
    visible.value = newValue
  },
)

// 关闭通知
const close = () => {
  visible.value = false
  emit("update:modelValue", false)
  emit("close")
}

// 类型样式映射
const typeClasses: Record<ToastType, string> = {
  success:
    "border-[color:var(--wb-success)]/30 bg-[color:var(--wb-success-subtle)] text-[color:var(--wb-success)]",
  error:
    "border-[color:var(--wb-danger)]/30 bg-[color:var(--wb-danger-subtle)] text-[color:var(--wb-danger)]",
  warning:
    "border-[color:var(--wb-warning)]/30 bg-[color:var(--wb-warning-subtle)] text-[color:var(--wb-warning)]",
  info: "border-primary/30 bg-[color:var(--wb-accent-subtle)] text-primary",
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.toast-enter-to,
.toast-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
