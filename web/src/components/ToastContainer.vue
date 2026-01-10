<template>
  <Teleport to="body">
    <div class="toast-container">
      <Toast
        v-for="toast in toastComposable.toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        :title="toast.title"
        :duration="0"
        v-model="toast.visible"
        @close="toastComposable.remove(toast.id)"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useGlobalToast } from '../composables/useToast'
import Toast from './Toast.vue'

const toastComposable = useGlobalToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 9999;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.toast-container > * {
  pointer-events: auto;
}
</style>
