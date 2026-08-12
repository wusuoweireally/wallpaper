<template>
  <nav
    class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-md backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
  >
    <div class="max-w-8xl py-auto mx-auto">
      <div class="flex h-16 justify-between">
        <!-- Logo 和品牌 -->
        <div class="ml-8 flex items-center">
          <div class="flex-shrink-0">
            <router-link
              to="/"
              class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent"
            >
              随心壁纸
            </router-link>
          </div>
        </div>

        <!-- 导航菜单 -->
        <div class="hidden flex-1 items-center justify-center space-x-4 md:flex">
          <template v-for="item in navItems" :key="item.name">
            <router-link
              :to="item.to"
              class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              :class="{
                'bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-white':
                  isNavItemActive(item),
              }"
            >
              {{ item.name }}
            </router-link>
          </template>
        </div>

        <!-- 用户操作区域 -->
        <div class="flex items-center gap-2" style="margin-right: 20px">
          <!-- 移动端汉堡菜单 -->
          <button
            class="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
            @click="showMobileMenu = !showMobileMenu"
            aria-label="导航菜单"
            type="button"
          >
            <svg v-if="!showMobileMenu" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <!-- 未登录状态 -->
          <template v-if="!isLoggedIn">
            <router-link
              to="/auth/login"
              class="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              登录
            </router-link>
            <router-link
              to="/auth/register"
              class="rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-md"
            >
              注册
            </router-link>
          </template>

          <!-- 已登录状态 -->
          <template v-else>
            <div ref="userMenuRef" class="group relative flex items-center gap-2">
              <button
                class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                @click="toggleTheme"
                aria-label="切换主题"
                type="button"
              >
                <svg
                  v-if="theme === 'light'"
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0 1 12 21.75 9.75 9.75 0 0 1 12 2.25c.214 0 .428.007.64.022a.75.75 0 0 1 .42 1.273 7.5 7.5 0 0 0 8.67 11.457.75.75 0 0 1 1.022 1Z"
                  />
                </svg>
                <svg
                  v-else
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.364-6.364-1.06 1.06M6.697 17.303l-1.06 1.06m12.727 0-1.06-1.06M6.697 6.697l-1.06-1.06M12 7.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Z"
                  />
                </svg>
              </button>
              <!-- 用户头像按钮 -->
              <button
                class="user-menu-anchor m-0 flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-100 dark:hover:bg-slate-800"
                @click="toggleDropdown"
              >
                <img
                  :src="userAvatar"
                  :alt="user?.username || '用户'"
                  class="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-2 ring-white"
                  @error="handleAvatarError"
                />
                <svg
                  class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                  :class="{ 'rotate-180': showDropdown }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <!-- 下拉菜单 -->
              <div
                v-if="showDropdown"
                class="absolute right-0 top-11 min-w-max rounded-lg bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-900 dark:ring-white/10"
                role="menu"
              >
                <router-link
                  to="/user"
                  class="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  role="menuitem"
                  @click="showDropdown = false"
                >
                  👤 个人中心
                </router-link>
                <router-link
                  to="/user/settings"
                  class="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  role="menuitem"
                  @click="showDropdown = false"
                >
                  ⚙️ 账号设置
                </router-link>
                <router-link
                  to="/upload"
                  class="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  role="menuitem"
                  @click="showDropdown = false"
                >
                  📤 上传壁纸
                </router-link>
                <router-link
                  v-if="user?.role === 'admin' || user?.role === 'super_admin'"
                  to="/admin/dashboard"
                  class="block w-full px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                  role="menuitem"
                  @click="showDropdown = false"
                >
                  🛡️ 管理后台
                </router-link>
                <div class="border-t border-gray-100 dark:border-slate-800"></div>
                <button
                  class="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  role="menuitem"
                  @click="handleLogout"
                >
                  🚪 退出登录
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 移动端导航菜单 -->
      <div
        v-show="showMobileMenu"
        class="border-t border-gray-200 py-3 dark:border-slate-800 md:hidden"
      >
        <template v-for="item in navItems" :key="item.name">
          <router-link
            :to="item.to"
            class="block rounded-md px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
            :class="{ 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-white': isNavItemActive(item) }"
            @click="showMobileMenu = false"
          >
            {{ item.name }}
          </router-link>
        </template>
        <div v-if="!isLoggedIn" class="mt-2 flex gap-2 border-t border-gray-100 px-4 pt-2 dark:border-slate-800">
          <router-link
            to="/auth/login"
            class="flex-1 rounded-md py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-slate-200"
            @click="showMobileMenu = false"
          >
            登录
          </router-link>
          <router-link
            to="/auth/register"
            class="flex-1 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 py-2 text-center text-sm font-medium text-white"
            @click="showMobileMenu = false"
          >
            注册
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"
import { storeToRefs } from "pinia"
import { useUserStore } from "@/stores/user"
import { applyTheme, resolveInitialTheme, setTheme, type ThemeMode } from "@/utils/theme"

const userStore = useUserStore()
const route = useRoute()
const showDropdown = ref(false)
const showMobileMenu = ref(false)
const theme = ref<ThemeMode>("light")
const userMenuRef = ref<HTMLElement>()

// 计算属性
const { isLoggedIn, user, userAvatar } = storeToRefs(userStore)

const navItems = [
  {
    name: "最新壁纸",
    to: { path: "/wallpapers", query: { sort: "latest" } },
    sortValue: "latest",
  },
  {
    name: "排行榜",
    to: { path: "/wallpapers", query: { sort: "popular" } },
    sortValue: "popular",
  },
  {
    name: "随机壁纸",
    to: { path: "/wallpapers", query: { sort: "random" } },
    sortValue: "random",
  },
  {
    name: "上传壁纸",
    to: "/upload",
  },
  {
    name: "论坛",
    to: "/forums",
  },
]

// 判断导航项是否激活
const isNavItemActive = (item: (typeof navItems)[number]) => {
  if (item.sortValue) {
    return route.path === "/wallpapers" && route.query.sort === item.sortValue
  }
  const targetPath = typeof item.to === "string" ? item.to : (item.to as { path: string }).path
  return route.path === targetPath || route.path.startsWith(targetPath + "/")
}

// 切换下拉菜单
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// 关闭下拉菜单（点击外部）
const closeDropdown = (event: MouseEvent) => {
  if (!userMenuRef.value?.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  // 添加确认对话框
  const confirmed = confirm(
    "确定要退出登录吗？\n\n如果是公共设备，建议同时访问 GitHub 并退出登录，以保护您的账户安全。",
  )
  if (!confirmed) {
    return
  }

  try {
    await userStore.logout()
    showDropdown.value = false
    // 退出登录后保持在当前页面，不需要重定向到登录页
    // 如果当前页面需要登录，路由守卫会自动处理重定向
  } catch (error) {
    console.error("退出登录失败:", error)
  }
}

onMounted(() => {
  // 添加全局点击事件监听，点击外部关闭下拉菜单
  document.addEventListener("click", closeDropdown)
  const initial = resolveInitialTheme()
  theme.value = initial
  applyTheme(initial)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener("click", closeDropdown)
})

const toggleTheme = () => {
  const nextTheme = theme.value === "light" ? "dark" : "light"
  theme.value = nextTheme
  setTheme(nextTheme)
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = "/defaultAvatar.png"
}
</script>
