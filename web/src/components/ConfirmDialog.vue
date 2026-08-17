<template>
  <Teleport to="body">
    <Transition name="wb-confirm">
      <div
        v-if="state.open"
        class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
        role="presentation"
        @click.self="cancel"
      >
        <div
          ref="boxRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="wb-confirm-box w-full max-w-sm rounded-card border border-line bg-surface p-5 shadow-lg"
        >
          <h2 :id="titleId" class="text-base font-semibold text-fg">{{ state.title }}</h2>
          <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
            {{ state.message }}
          </p>
          <div class="mt-5 flex justify-end gap-2">
            <button ref="cancelBtnRef" type="button" class="wb-btn" @click="cancel">
              {{ state.cancelText }}
            </button>
            <button
              type="button"
              :class="state.danger ? 'wb-btn-danger' : 'wb-btn-primary'"
              @click="accept"
            >
              {{ state.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useConfirmDialog } from "@/composables/useConfirm"

const titleId = "wb-confirm-title"
const { state, accept, cancel } = useConfirmDialog()
const boxRef = ref<HTMLElement | null>(null)
const cancelBtnRef = ref<HTMLButtonElement | null>(null)

let lastFocused: HTMLElement | null = null
let prevBodyOverflow = ""

watch(
  () => state.value.open,
  async (open) => {
    if (open) {
      lastFocused = (document.activeElement as HTMLElement | null) ?? null
      prevBodyOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      await nextTick()
      // 焦点进入对话框并默认落在取消上（危险操作防回车误触）
      cancelBtnRef.value?.focus()
    } else {
      document.body.style.overflow = prevBodyOverflow
      lastFocused?.focus?.()
    }
  },
)

const onKeydown = (e: KeyboardEvent) => {
  if (!state.value.open) return
  if (e.key === "Escape") {
    e.preventDefault()
    cancel()
    return
  }
  // Tab 圈禁在对话框内，避免焦点漏到底层页面
  if (e.key === "Tab") {
    const buttons = boxRef.value?.querySelectorAll<HTMLElement>("button")
    if (!buttons?.length) return
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

onMounted(() => document.addEventListener("keydown", onKeydown))
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown))
</script>

<style scoped>
.wb-confirm-enter-active,
.wb-confirm-leave-active {
  transition: opacity 0.15s ease;
}

.wb-confirm-enter-active .wb-confirm-box,
.wb-confirm-leave-active .wb-confirm-box {
  transition: transform 0.15s ease;
}

.wb-confirm-enter-from,
.wb-confirm-leave-to {
  opacity: 0;
}

.wb-confirm-enter-from .wb-confirm-box,
.wb-confirm-leave-to .wb-confirm-box {
  transform: scale(0.95);
}
</style>
