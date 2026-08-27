<template>
  <Teleport to="body">
    <div class="toast-container">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        :title="toast.title"
        v-model="toast.visible"
        @close="toastComposable.remove(toast.id)"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useGlobalToast } from "../composables/useToast"
import Toast from "./Toast.vue"

const toastComposable = useGlobalToast()
// setup 顶层解构 ref → 模板自动解包,直接迭代数组
const { toasts } = toastComposable
</script>

<style scoped>
/* 顶栏下方居中堆叠，避免盖住 sticky 导航 */
.toast-container {
  position: fixed;
  top: 4rem;
  left: 0;
  right: 0;
  margin: 0 auto;
  pointer-events: none;
  /* 层级常量表：需压过详情页灯箱/下载裁剪层（z-index 9999），否则 Toast 反馈会被吞 */
  z-index: 10050;
  padding: 0 1rem 1rem;
  width: fit-content;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.toast-container > * {
  pointer-events: auto;
}
</style>
