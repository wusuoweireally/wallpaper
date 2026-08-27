<template>
  <div data-shell="admin" class="min-h-screen bg-canvas text-fg">
    <header
      class="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface px-4"
    >
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="wb-icon-btn lg:hidden"
          aria-label="打开侧边栏"
          @click="sidebarOpen = true"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <router-link to="/admin/dashboard" class="text-sm font-semibold text-fg">
          Wallbay Admin
        </router-link>
      </div>
      <div class="flex items-center gap-2">
        <router-link to="/" class="wb-btn-ghost text-sm">回站点</router-link>
        <img
          :src="userAvatar"
          alt="管理员"
          class="h-8 w-8 rounded-full object-cover ring-1 ring-line"
          @error="handleAvatarError"
        />
      </div>
    </header>

    <div class="flex">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-black/40 lg:hidden"
        @click="sidebarOpen = false"
      ></div>
      <aside
        class="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-[color:var(--wb-admin-sidebar)] pt-14 transition-transform lg:static lg:z-0 lg:min-h-[calc(100vh-3.5rem)] lg:translate-x-0 lg:pt-0"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <nav class="flex-1 space-y-0.5 p-3">
          <router-link
            v-for="item in menu"
            :key="item.to"
            :to="item.to"
            class="flex items-center justify-between rounded-control px-3 py-2 text-sm text-muted hover:bg-subtle hover:text-fg"
            :class="{ 'bg-subtle font-medium text-fg': isActive(item.to) }"
            @click="sidebarOpen = false"
          >
            <span>{{ item.label }}</span>
            <span
              v-if="item.to === '/admin/reports' && pendingReportsCount > 0"
              class="rounded-md bg-error px-1.5 text-[11px] font-medium text-white"
            >
              {{ pendingReportsCount > 99 ? "99+" : pendingReportsCount }}
            </span>
          </router-link>
        </nav>
        <div class="border-t border-line p-3">
          <button type="button" class="wb-btn w-full" @click="logout">退出登录</button>
        </div>
      </aside>
      <div class="min-w-0 flex-1 p-4 lg:p-6">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import adminService from "@/services/admin"
import { confirmAction } from "@/composables/useConfirm"
import { handleAvatarError } from "@/utils/avatar"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const pendingReportsCount = ref(0)
const sidebarOpen = ref(false)

const menu = [
  { to: "/admin/dashboard", label: "仪表盘" },
  { to: "/admin/users", label: "用户" },
  { to: "/admin/wallpapers", label: "壁纸" },
  { to: "/admin/tags", label: "标签" },
  { to: "/admin/reports", label: "举报" },
]

const isActive = (to: string) => route.path === to || route.path.startsWith(`${to}/`)

const loadPendingReportsCount = async () => {
  try {
    const response = await adminService.getReportStats()
    pendingReportsCount.value = response.data?.pendingReports ?? 0
  } catch {
    pendingReportsCount.value = 0
  }
}

onMounted(() => {
  void loadPendingReportsCount()
})

watch(
  () => route.path,
  (newPath) => {
    if (!newPath.includes("/admin/reports")) {
      setTimeout(() => {
        void loadPendingReportsCount()
      }, 400)
    }
  },
)

const userAvatar = computed(() => {
  if (!userStore.user?.avatarUrl || userStore.user?.avatarUrl === "defaultAvatar.png") {
    return "/defaultAvatar.png"
  }
  return userStore.user.avatarUrl
})

const logout = async () => {
  const ok = await confirmAction({
    title: "退出登录",
    message: "确定要退出管理后台吗？",
    confirmText: "退出",
    danger: true,
  })
  if (!ok) return
  await userStore.logout()
  router.push("/")
}
</script>
