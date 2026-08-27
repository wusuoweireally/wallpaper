<template>
  <div class="wb-page">
    <div class="wb-container-gallery py-5">
      <header class="flex flex-wrap items-center gap-4 border-b border-line pb-4">
        <img
          :src="userStore.userAvatar"
          :alt="userStore.user?.username"
          class="h-12 w-12 rounded-full object-cover ring-1 ring-line"
        />
        <div class="min-w-0 flex-1">
          <h1 class="wb-page-title">
            {{ userStore.user?.username }}
          </h1>
          <p class="mt-0.5 truncate text-xs text-muted">{{ userStore.user?.email }}</p>
          <p v-if="userStore.user?.bio" class="mt-1 line-clamp-2 text-sm text-faint">
            {{ userStore.user.bio }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <router-link to="/user/settings" class="wb-btn h-8">编辑资料</router-link>
          <router-link to="/upload" class="wb-btn-primary h-8">上传壁纸</router-link>
        </div>
      </header>

      <div class="mt-5 grid gap-6 lg:grid-cols-[180px_1fr]">
        <nav class="flex flex-row gap-1 overflow-x-auto lg:flex-col">
          <router-link
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="shrink-0 rounded-control px-3 py-2 text-sm text-muted hover:bg-subtle hover:text-fg"
            active-class="bg-subtle font-medium text-fg"
          >
            {{ item.label }}
            <span v-if="item.count != null" class="ml-1 tabular-nums text-faint">{{
              item.count
            }}</span>
          </router-link>
          <router-link
            v-if="userStore.user?.role === 'admin' || userStore.user?.role === 'super_admin'"
            to="/admin/dashboard"
            class="shrink-0 rounded-control px-3 py-2 text-sm text-muted hover:bg-subtle hover:text-fg"
          >
            管理后台
          </router-link>
        </nav>

        <section class="min-w-0">
          <router-view :key="$route.fullPath" />
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from "vue"
import { useUserStore } from "@/stores/user"

const userStore = useUserStore()

const nav = computed(() => [
  { to: "/user/uploads", label: "我的上传", count: userStore.userStats.uploads },
  { to: "/user/favorites", label: "我的收藏", count: userStore.userStats.favorites },
  { to: "/user/collections", label: "我的合集" },
  { to: "/user/bookmarks", label: "收藏的帖子" },
  { to: "/user/history", label: "浏览记录" },
  { to: "/user/settings", label: "账号设置" },
])

onMounted(() => {
  void userStore.fetchUserStats().catch((error) => {
    console.error("获取用户数据失败:", error)
  })
})
</script>
