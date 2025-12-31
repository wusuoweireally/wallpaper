<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="mb-8">
        <h1 class="text-9xl font-bold text-gray-300">404</h1>
      </div>

      <div class="mb-8">
        <h2 class="mb-2 text-3xl font-bold text-gray-800">页面未找到</h2>
        <p class="text-lg text-gray-600">抱歉，您访问的页面不存在或已被移除</p>
      </div>

      <div class="space-y-4">
        <div class="flex justify-center space-x-4">
          <button
            @click="goBack"
            class="rounded-lg bg-gray-600 px-6 py-3 text-white transition-colors hover:bg-gray-700"
          >
            返回上页
          </button>

          <router-link
            to="/"
            class="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            回到首页
          </router-link>
        </div>

        <div class="mt-8">
          <p class="mb-4 text-sm text-gray-500">您可能在寻找：</p>
          <div class="flex flex-wrap justify-center gap-3">
            <router-link
              to="/wallpapers"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              浏览壁纸
            </router-link>
            <router-link
              to="/upload"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              上传壁纸
            </router-link>
            <router-link
              to="/forums"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              社区论坛
            </router-link>
          </div>
        </div>
      </div>

      <!-- 装饰性图片 -->
      <div class="mt-12 opacity-50">
        <svg class="mx-auto h-32 w-32 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          ></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router"

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push("/")
  }
}
</script>
