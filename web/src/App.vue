<template>
  <div class="flex min-h-screen flex-col bg-white transition-colors duration-300 dark:bg-slate-950">
    <!-- 条件渲染导航栏 -->
    <transition name="navbar" appear>
      <NavBar v-if="shouldShowNavBar" />
    </transition>

    <!-- 主要内容区域 -->
    <main
      class="flex-1 transition-[margin-top] duration-300 ease-in-out"
      :class="{ 'min-h-screen': !shouldShowNavBar }"
    >
      <RouterView />
    </main>

    <!-- 全局 Toast 通知容器 -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import NavBar from "@/components/NavBar.vue"
import ToastContainer from "@/components/ToastContainer.vue"

const route = useRoute()

// 根据路由meta信息判断是否显示导航栏
// 默认显示导航栏，除非明确设置为false
const shouldShowNavBar = computed(() => {
  // 如果路由meta中明确设置了showNavBar为false，则不显示
  if (route.meta.showNavBar === false) {
    return false
  }
  // 默认显示导航栏
  return true
})
</script>

<style scoped>
/* 导航栏过渡动画 - 必须保留，用于 Vue transition 组件 */
.navbar-enter-active,
.navbar-leave-active {
  transition: all 0.3s ease;
}

.navbar-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.navbar-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
