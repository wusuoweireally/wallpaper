<template>
  <div class="app-container">
    <!-- 条件渲染导航栏 -->
    <transition name="navbar" appear>
      <NavBar v-if="shouldShowNavBar" />
    </transition>

    <!-- 主要内容区域 -->
    <main class="main-content" :class="{ 'no-navbar': !shouldShowNavBar }">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'

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
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}

.main-content.no-navbar {
  /* 当没有导航栏时，内容占满整个视口高度 */
  min-height: 100vh;
}

/* 导航栏过渡动画 */
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

/* 确保页面切换时的平滑过渡 */
.main-content {
  transition: margin-top 0.3s ease;
}

.main-content.no-navbar {
  margin-top: 0;
}
</style>
