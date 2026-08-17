<template>
  <div class="wb-page flex min-h-[60vh] items-center justify-center px-4">
    <div class="text-center">
      <p class="text-7xl font-semibold tabular-nums text-faint">404</p>
      <h1 class="mt-4 text-xl font-semibold text-fg">页面未找到</h1>
      <p class="mt-2 text-sm text-muted">访问的页面不存在或已被移除</p>
      <div class="mt-6 flex justify-center gap-2">
        <button type="button" class="wb-btn" @click="goBack">返回上页</button>
        <router-link to="/" class="wb-btn-primary">回到首页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router"

const router = useRouter()

const goBack = () => {
  // history.state.back 是 vue-router 记录的站内上一页；从站外直接进来时没有，只能回首页
  if (router.options.history.state?.back) {
    router.go(-1)
  } else {
    router.push("/")
  }
}
</script>
