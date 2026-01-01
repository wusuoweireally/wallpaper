<template>
  <div class="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
    <!-- 背景装饰 -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute left-1/2 top-[-10%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-purple-200/40 blur-[200px]"
      ></div>
      <div
        class="absolute left-[10%] top-[40%] h-[20rem] w-[20rem] -translate-y-1/2 rounded-full bg-sky-200/30 blur-[180px]"
      ></div>
      <div
        class="absolute bottom-[-5%] right-[-5%] h-[24rem] w-[24rem] rounded-full bg-pink-100/50 blur-[200px]"
      ></div>
    </div>

    <div class="relative mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <!-- Hero 区域 -->
      <section
        class="grid items-center gap-6 rounded-[2rem] bg-gradient-to-br from-white/95 via-white/90 to-white/80 p-8 shadow-2xl ring-1 ring-black/5 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <div class="flex items-center gap-5">
          <!-- 头像 -->
          <div class="relative shrink-0">
            <div
              class="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg"
            >
              <img
                :src="userStore.userAvatar"
                :alt="userStore.user?.username"
                class="h-full w-full object-cover"
              />
            </div>
            <span
              class="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-white bg-green-500 shadow-lg"
            ></span>
          </div>

          <!-- 用户信息 -->
          <div class="min-w-0 flex-1">
            <h1 class="text-3xl font-bold text-slate-900">
              {{ userStore.user?.username }}
            </h1>
            <p class="mt-2 flex items-center gap-2 text-slate-600">
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21.75 6.75-9.53 6.573a.75.75 0 0 1-.84 0L1.86 6.75m19.89 0A2.25 2.25 0 0 0 19.5 5.25h-15A2.25 2.25 0 0 0 2.25 6.75m19.89 0v10.5A2.25 2.25 0 0 1 19.5 19.5h-15a2.25 2.25 0 0 1-2.25-2.25V6.75" />
              </svg>
              <span class="truncate">{{ userStore.user?.email }}</span>
            </p>
            <p v-if="userStore.user?.bio" class="mt-2 text-sm text-slate-500 line-clamp-2">
              {{ userStore.user.bio }}
            </p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap justify-end gap-3">
          <button
            class="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
            type="button"
            @click="$router.push('/')"
          >
            <i class="icon-[mdi--arrow-left] text-lg transition-transform group-hover:-translate-x-0.5"></i>
            返回首页
          </button>
          <button
            class="group inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition-all hover:border-sky-300 hover:bg-sky-100 hover:shadow-md"
            type="button"
            @click="$router.push('/user/settings')"
          >
            <i class="icon-[mdi--cog] text-lg transition-transform group-hover:rotate-90"></i>
            编辑资料
          </button>
          <button
            class="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] hover:shadow-xl"
            type="button"
            @click="$router.push('/upload')"
          >
            <i class="icon-[mdi--upload] text-lg"></i>
            上传壁纸
          </button>
        </div>
      </section>

      <!-- 统计卡片 -->
      <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          class="group overflow-hidden rounded-2xl bg-white/90 p-6 shadow-lg shadow-slate-200/60 ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10"
          @click="$router.push('/user/uploads')"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30 transition-transform group-hover:scale-110"
            >
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0-4.145-6.3H7.5a2.25 2.25 0 0 0-2.25 2.25c0 1.152.388 1.923.439 2.028M6.633 10.5H5.25A2.25 2.25 0 0 0 3 12.75v6A2.25 2.25 0 0 0 5.25 21h1.5A2.25 2.25 0 0 0 9 18.75v-6a2.25 2.25 0 0 0-2.367-2.25ZM14.25 6.75h2.819a2.25 2.25 0 0 1 2.206 2.709l-1.194 5.217A3 3 0 0 1 15.14 18H12" />
              </svg>
            </div>
            <div class="text-left">
              <p class="text-sm text-slate-500">上传壁纸</p>
              <p class="text-2xl font-bold text-slate-900">
                {{ userStore.userStats.uploads }}
              </p>
            </div>
          </div>
          <p class="mt-3 text-xs text-slate-400">本周新增 {{ userStore.userStats.uploads || 0 }}</p>
        </button>

        <button
          type="button"
          class="group overflow-hidden rounded-2xl bg-white/90 p-6 shadow-lg shadow-slate-200/60 ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10"
          @click="$router.push('/user/favorites')"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 transition-transform group-hover:scale-110"
            >
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m11.48 3.499-2.27 4.61a.75.75 0 0 1-.564.41l-5.067.736c-.613.089-.857.843-.414 1.276l3.664 3.57a.75.75 0 0 1 .216.664l-.864 5.04c-.105.616.54 1.088 1.09.797l4.52-2.377a.75.75 0 0 1 .698 0l4.52 2.377c.55.29 1.195-.18 1.09-.798l-.864-5.039a.75.75 0 0 1 .216-.663l3.664-3.57c.443-.433.199-1.187-.414-1.276l-5.067-.737a.75.75 0 0 1-.564-.409l-2.27-4.611a.75.75 0 0 0-1.354 0Z" />
              </svg>
            </div>
            <div class="text-left">
              <p class="text-sm text-slate-500">我的收藏</p>
              <p class="text-2xl font-bold text-slate-900">
                {{ userStore.userStats.favorites }}
              </p>
            </div>
          </div>
          <p class="mt-3 text-xs text-slate-400">灵感速览</p>
        </button>

        <button
          type="button"
          class="group overflow-hidden rounded-2xl bg-white/90 p-6 shadow-lg shadow-slate-200/60 ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/10"
          @click="$router.push('/user/likes')"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 transition-transform group-hover:scale-110"
            >
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C4.099 3.75 2 5.765 2 8.25c0 7.22 8 12 8 12s8-4.78 8-12Z" />
              </svg>
            </div>
            <div class="text-left">
              <p class="text-sm text-slate-500">我的点赞</p>
              <p class="text-2xl font-bold text-slate-900">
                {{ userStore.userStats.likes }}
              </p>
            </div>
          </div>
          <p class="mt-3 text-xs text-slate-400">喜欢的作品</p>
        </button>

        <div
          class="group overflow-hidden rounded-2xl bg-white/90 p-6 shadow-lg shadow-slate-200/60 ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-transform group-hover:scale-110"
            >
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0-4.145-6.3H7.5a2.25 2.25 0 0 0-2.25 2.25c0 1.152.388 1.923.439 2.028M6.633 10.5H5.25A2.25 2.25 0 0 0 3 12.75v6A2.25 2.25 0 0 0 5.25 21h1.5A2.25 2.25 0 0 0 9 18.75v-6a2.25 2.25 0 0 0-2.367-2.25ZM14.25 6.75h2.819a2.25 2.25 0 0 1 2.206 2.709l-1.194 5.217A3 3 0 0 1 15.14 18H12" />
              </svg>
            </div>
            <div class="text-left">
              <p class="text-sm text-slate-500">获赞数</p>
              <p class="text-2xl font-bold text-slate-900">
                {{ userStore.userStats.likesReceived }}
              </p>
            </div>
          </div>
          <p class="mt-3 text-xs text-slate-400">社区认可</p>
        </div>
      </section>

      <!-- 导航标签 -->
      <nav class="flex flex-wrap gap-3">
        <router-link
          to="/user/uploads"
          class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-purple-300 hover:bg-purple-50 hover:shadow-md active:border-purple-400 active:bg-purple-100"
          active-class="border-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-900 shadow-md ring-2 ring-purple-400/20"
        >
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h6.75A2.25 2.25 0 0 1 15 6.75V9h1.5A2.25 2.25 0 0 1 18.75 11.25V15H21a.75.75 0 0 1 .75.75v2.25A2.25 2.25 0 0 1 19.5 20.25h-15A2.25 2.25 0 0 1 2.25 18V9.75A2.25 2.25 0 0 1 4.5 7.5H6V6.75Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 9.75h4.5m0 0L9 8.25m1.5 1.5L9 11.25" />
          </svg>
          我的上传
        </router-link>
        <router-link
          to="/user/favorites"
          class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50 hover:shadow-md active:border-amber-400 active:bg-amber-100"
          active-class="border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 shadow-md ring-2 ring-amber-400/20"
        >
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m11.48 3.499-2.27 4.61a.75.75 0 0 1-.564.41l-5.067.736c-.613.089-.857.843-.414 1.276l3.664 3.57a.75.75 0 0 1 .216.664l-.864 5.04c-.105.616.54 1.088 1.09.797l4.52-2.377a.75.75 0 0 1 .698 0l4.52 2.377c.55.29 1.195-.18 1.09-.798l-.864-5.039a.75.75 0 0 1 .216-.663l3.664-3.57c.443-.433.199-1.187-.414-1.276l-5.067-.737a.75.75 0 0 1-.564-.409l-2.27-4.611a.75.75 0 0 0-1.354 0Z" />
          </svg>
          我的收藏
        </router-link>
        <router-link
          to="/user/likes"
          class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-pink-300 hover:bg-pink-50 hover:shadow-md active:border-pink-400 active:bg-pink-100"
          active-class="border-pink-400 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-900 shadow-md ring-2 ring-pink-400/20"
        >
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C4.099 3.75 2 5.765 2 8.25c0 7.22 8 12 8 12s8-4.78 8-12Z" />
          </svg>
          我的点赞
        </router-link>
        <router-link
          to="/user/settings"
          class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-sky-300 hover:bg-sky-50 hover:shadow-md active:border-sky-400 active:bg-sky-100"
          active-class="border-sky-400 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-900 shadow-md ring-2 ring-sky-400/20"
        >
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12a7.5 7.5 0 1 0 15 0 7.5 7.5 0 0 0-15 0Zm7.5-3.75a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm0 3.75a.75.75 0 0 1 .75.75v2.25a.75.75 0 1 1-1.5 0V12a.75.75 0 0 1 .75-.75Z" />
          </svg>
          账号设置
        </router-link>
        <router-link
          v-if="userStore.user?.role === 'admin'"
          to="/admin/dashboard"
          class="inline-flex items-center gap-2 rounded-full border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 px-5 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition-all hover:border-red-400 hover:from-red-100 hover:to-pink-100 hover:shadow-md"
          active-class="border-red-500 bg-gradient-to-r from-red-100 to-pink-100 text-red-900 shadow-md ring-2 ring-red-400/30"
        >
          <i class="icon-[mdi--shield-crown] text-lg"></i>
          管理后台
        </router-link>
      </nav>

      <!-- 内容区域 -->
      <section
        class="rounded-[2rem] bg-white/90 p-8 shadow-2xl shadow-slate-200/60 ring-1 ring-black/5"
      >
        <router-view />
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue"
import { useUserStore } from "@/stores"

const userStore = useUserStore()

onMounted(() => {
  fetchUserData()
})

const fetchUserData = async () => {
  try {
    await userStore.fetchUserStats()
  } catch (error) {
    console.error("获取用户数据失败:", error)
  }
}
</script>
