<template>
  <nav class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-md backdrop-blur-md">
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
        <div class="hidden items-center space-x-4 md:flex">
          <template v-for="item in navItems" :key="item.name">
            <router-link
              :to="item.to"
              class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              :class="{
                'bg-blue-100 text-blue-700': isNavItemActive(item),
              }"
            >
              {{ item.name }}
            </router-link>
          </template>
        </div>

        <!-- 用户操作区域 -->
        <div class="flex items-center" style="margin-right: 20px">
          <!-- 未登录状态 -->
          <template v-if="!isLoggedIn">
            <router-link
              to="/auth/login"
              class="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
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
            <div class="group relative">
              <!-- 用户头像按钮 -->
              <button
                class="m-0 flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-100"
                @click="toggleDropdown"
              >
                <img
                  :src="userAvatar"
                  :alt="user?.username || '用户'"
                  class="h-8 w-8 rounded-full object-cover ring-2 ring-white"
                />
                <span class="hidden whitespace-nowrap text-sm font-medium text-gray-700 sm:block">
                  {{ user?.username }}
                </span>
                <svg
                  class="h-4 w-4 text-gray-400 transition-transform duration-200"
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
                class="w-30 absolute right-0 mt-2 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
              >
                <router-link
                  to="/user"
                  class="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  role="menuitem"
                  @click="showDropdown = false"
                >
                  👤 个人中心
                </router-link>
                <router-link
                  to="/user/settings"
                  class="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  role="menuitem"
                  @click="showDropdown = false"
                >
                  ⚙️ 账号设置
                </router-link>
                <router-link
                  to="/upload"
                  class="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  role="menuitem"
                  @click="showDropdown = false"
                >
                  📤 上传壁纸
                </router-link>
                <router-link
                  v-if="user?.role === 'admin'"
                  to="/admin/dashboard"
                  class="block w-full px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                  role="menuitem"
                  @click="showDropdown = false"
                >
                  🛡️ 管理后台
                </router-link>
                <div class="border-t border-gray-100"></div>
                <button
                  class="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
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
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"
import { storeToRefs } from "pinia"
import { useUserStore } from "@/stores/index"

const userStore = useUserStore()
const route = useRoute()
const showDropdown = ref(false)

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
const isNavItemActive = (item: any) => {
  if (item.sortValue) {
    // 对于有 sortValue 的项，检查路由路径和查询参数
    return route.path === "/wallpapers" && route.query.sort === item.sortValue
  }
  // 对于其他项，使用默认的 router-link active 判断
  return false
}

// 切换下拉菜单
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// 关闭下拉菜单（点击外部）
const closeDropdown = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest(".relative.group")) {
    showDropdown.value = false
  }
}

// 退出登录
const handleLogout = async () => {
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
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener("click", closeDropdown)
})
</script>
