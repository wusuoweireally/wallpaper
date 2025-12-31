<template>
  <div
    class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
  >
    <!-- 动态背景粒子 -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="animate-blob filter absolute -right-40 -top-40 h-80 w-80 rounded-full bg-purple-500 opacity-20 mix-blend-multiply blur-xl"
      ></div>
      <div
        class="animate-blob animation-delay-2000 filter absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500 opacity-20 mix-blend-multiply blur-xl"
      ></div>
      <div
        class="animate-blob animation-delay-4000 filter absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-pink-500 opacity-20 mix-blend-multiply blur-xl"
      ></div>
    </div>

    <!-- 顶部导航栏 -->
    <div
      class="navbar relative z-10 border-b border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"
    >
      <div class="flex-1">
        <div class="flex items-center gap-3 px-4">
          <div
            class="animate-pulse-slow flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30"
          >
            <iconify-icon icon="mdi:palette" class="text-2xl text-white"></iconify-icon>
          </div>
          <div>
            <a
              class="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-2xl font-bold text-transparent"
              >壁纸管理系统</a
            >
            <div class="mt-0.5 text-xs text-purple-200/60">Admin Dashboard</div>
          </div>
        </div>
      </div>
      <div class="flex-none pr-4">
        <div class="dropdown dropdown-end">
          <div
            tabindex="0"
            role="button"
            class="avatar btn btn-ghost btn-circle transform ring-4 ring-white/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 hover:ring-purple-400 hover:ring-offset-2 hover:ring-offset-transparent"
          >
            <div
              class="h-12 w-12 overflow-hidden rounded-full bg-white/20 shadow-2xl ring-2 ring-white/30"
            >
              <img
                :src="userAvatar"
                alt="用户头像"
                class="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                @error="handleImageError"
              />
            </div>
          </div>
          <ul
            tabindex="0"
            class="dropdown-content menu menu-sm z-[1] mt-3 w-64 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-xl"
          >
            <li class="menu-title">
              <div class="flex items-center gap-3 px-2">
                <div class="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/30">
                  <img
                    :src="userAvatar"
                    alt="用户头像"
                    class="h-full w-full object-cover"
                    @error="handleImageError"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <span class="text-sm font-semibold text-white">{{
                    userStore.user?.username || '管理员'
                  }}</span>
                  <div class="text-xs text-white/60">系统管理员</div>
                </div>
              </div>
            </li>
            <div class="divider my-2 border-white/10"></div>
            <li>
              <RouterLink
                to="/user"
                class="flex items-center gap-3 rounded-xl px-3 py-2 text-white/90 transition-all hover:bg-blue-500/20 hover:text-white"
              >
                <iconify-icon icon="mdi:account" class="text-lg"></iconify-icon>
                个人中心
              </RouterLink>
            </li>
            <li>
              <a
                @click="logout"
                class="flex items-center gap-3 rounded-xl px-3 py-2 text-red-300 transition-all hover:bg-red-500/20 hover:text-white"
              >
                <iconify-icon icon="mdi:logout" class="text-lg"></iconify-icon>
                退出登录
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="drawer relative z-0 lg:drawer-open">
      <input id="admin-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content">
        <!-- 页面内容 -->
        <div class="relative min-h-screen p-4 lg:p-8">
          <RouterView />
        </div>
      </div>
      <div class="drawer-side">
        <label
          for="admin-drawer"
          aria-label="关闭侧边栏"
          class="drawer-overlay bg-black/50 backdrop-blur-sm"
        ></label>
        <aside
          class="flex min-h-full w-80 flex-col border-r border-white/20 bg-white/10 text-white shadow-2xl backdrop-blur-xl"
        >
          <div class="flex-1 overflow-y-auto p-4">
            <div class="menu-title mb-3">
              <span class="text-xs font-semibold uppercase tracking-wider text-white/60"
                >管理功能</span
              >
            </div>

            <ul class="space-y-2">
              <li>
                <RouterLink
                  to="/admin/dashboard"
                  class="group flex items-center gap-3 rounded-2xl px-4 py-4 transition-all hover:bg-white/10"
                  :class="{
                    'bg-gradient-to-r from-purple-500/80 to-blue-500/80 shadow-lg shadow-purple-500/30':
                      $route.path === '/admin/dashboard',
                  }"
                >
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-inner transition-colors group-hover:bg-white/20"
                  >
                    <iconify-icon
                      icon="mdi:view-dashboard"
                      class="text-xl"
                      :class="$route.path === '/admin/dashboard' ? 'text-white' : 'text-white/80'"
                    ></iconify-icon>
                  </div>
                  <div class="flex-1">
                    <span
                      class="font-medium"
                      :class="$route.path === '/admin/dashboard' ? 'text-white' : 'text-white/80'"
                      >仪表盘</span
                    >
                    <div class="text-xs text-white/50">System Overview</div>
                  </div>
                  <div
                    v-if="$route.path === '/admin/dashboard'"
                    class="h-2 w-2 animate-pulse rounded-full bg-white"
                  ></div>
                </RouterLink>
              </li>

              <li>
                <RouterLink
                  to="/admin/users"
                  class="group flex items-center gap-3 rounded-2xl px-4 py-4 transition-all hover:bg-white/10"
                  :class="{
                    'bg-gradient-to-r from-purple-500/80 to-blue-500/80 shadow-lg shadow-purple-500/30':
                      $route.path.startsWith('/admin/users'),
                  }"
                >
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-inner transition-colors group-hover:bg-white/20"
                  >
                    <iconify-icon
                      icon="mdi:account-group"
                      class="text-xl"
                      :class="
                        $route.path.startsWith('/admin/users') ? 'text-white' : 'text-white/80'
                      "
                    ></iconify-icon>
                  </div>
                  <div class="flex-1">
                    <span
                      class="font-medium"
                      :class="
                        $route.path.startsWith('/admin/users') ? 'text-white' : 'text-white/80'
                      "
                      >用户管理</span
                    >
                    <div class="text-xs text-white/50">User Management</div>
                  </div>
                  <div
                    v-if="$route.path.startsWith('/admin/users')"
                    class="h-2 w-2 animate-pulse rounded-full bg-white"
                  ></div>
                </RouterLink>
              </li>

              <li>
                <RouterLink
                  to="/admin/wallpapers"
                  class="group flex items-center gap-3 rounded-2xl px-4 py-4 transition-all hover:bg-white/10"
                  :class="{
                    'bg-gradient-to-r from-purple-500/80 to-blue-500/80 shadow-lg shadow-purple-500/30':
                      $route.path.startsWith('/admin/wallpapers'),
                  }"
                >
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-inner transition-colors group-hover:bg-white/20"
                  >
                    <iconify-icon
                      icon="mdi:image"
                      class="text-xl"
                      :class="
                        $route.path.startsWith('/admin/wallpapers') ? 'text-white' : 'text-white/80'
                      "
                    ></iconify-icon>
                  </div>
                  <div class="flex-1">
                    <span
                      class="font-medium"
                      :class="
                        $route.path.startsWith('/admin/wallpapers') ? 'text-white' : 'text-white/80'
                      "
                      >壁纸管理</span
                    >
                    <div class="text-xs text-white/50">Wallpaper Control</div>
                  </div>
                  <div
                    v-if="$route.path.startsWith('/admin/wallpapers')"
                    class="h-2 w-2 animate-pulse rounded-full bg-white"
                  ></div>
                </RouterLink>
              </li>

              <li>
                <RouterLink
                  to="/admin/tags"
                  class="group flex items-center gap-3 rounded-2xl px-4 py-4 transition-all hover:bg-white/10"
                  :class="{
                    'bg-gradient-to-r from-emerald-500/80 to-teal-500/80 shadow-lg shadow-emerald-500/30':
                      $route.path.startsWith('/admin/tags'),
                  }"
                >
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-inner transition-colors group-hover:bg-white/20"
                  >
                    <iconify-icon
                      icon="mdi:tag-multiple"
                      class="text-xl"
                      :class="
                        $route.path.startsWith('/admin/tags') ? 'text-white' : 'text-white/80'
                      "
                    ></iconify-icon>
                  </div>
                  <div class="flex-1">
                    <span
                      class="font-medium"
                      :class="
                        $route.path.startsWith('/admin/tags') ? 'text-white' : 'text-white/80'
                      "
                      >标签管理</span
                    >
                    <div class="text-xs text-white/50">Tag Center</div>
                  </div>
                  <div
                    v-if="$route.path.startsWith('/admin/tags')"
                    class="h-2 w-2 animate-pulse rounded-full bg-white"
                  ></div>
                </RouterLink>
              </li>

              <li>
                <RouterLink
                  to="/admin/reports"
                  class="group relative flex items-center gap-3 rounded-2xl px-4 py-4 transition-all hover:bg-white/10"
                  :class="{
                    'bg-gradient-to-r from-red-500/80 to-orange-500/80 shadow-lg shadow-red-500/30':
                      $route.path.startsWith('/admin/reports'),
                  }"
                >
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-inner transition-colors group-hover:bg-white/20"
                  >
                    <iconify-icon
                      icon="mdi:shield-alert"
                      class="text-xl"
                      :class="
                        $route.path.startsWith('/admin/reports') ? 'text-white' : 'text-white/80'
                      "
                    ></iconify-icon>
                  </div>
                  <div class="flex-1">
                    <span
                      class="font-medium"
                      :class="
                        $route.path.startsWith('/admin/reports') ? 'text-white' : 'text-white/80'
                      "
                      >举报管理</span
                    >
                    <div class="text-xs text-white/50">Report Center</div>
                  </div>
                  <div
                    v-if="pendingReportsCount > 0"
                    class="badge badge-error badge-sm animate-bounce shadow-lg shadow-red-500/50"
                  >
                    {{ pendingReportsCount > 99 ? '99+' : pendingReportsCount }}
                  </div>
                  <div
                    v-if="$route.path.startsWith('/admin/reports')"
                    class="h-2 w-2 animate-pulse rounded-full bg-white"
                  ></div>
                </RouterLink>
              </li>
            </ul>

            <div
              class="my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
            ></div>

            <RouterLink
              to="/"
              class="group btn btn-outline btn-sm w-full justify-start gap-3 rounded-2xl border-white/30 pl-4 text-white/90 transition-all hover:border-white/50 hover:bg-white/10 hover:text-white"
            >
              <iconify-icon
                icon="mdi:home"
                class="text-lg transition-transform group-hover:scale-110"
              ></iconify-icon>
              <span>返回首页</span>
            </RouterLink>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores'
import adminService from '@/services/admin'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 待处理举报数量
const pendingReportsCount = ref(0)

// 加载待处理举报数量
const loadPendingReportsCount = async () => {
  try {
    const response = await adminService.getReportStats()
    pendingReportsCount.value = response.data?.pendingReports || 0
  } catch (error) {
    console.error('获取待处理举报数量失败:', error)
    pendingReportsCount.value = 0
  }
}

onMounted(() => {
  loadPendingReportsCount()
})

// 监听路由变化，当从举报管理页面离开或返回时刷新数量
watch(
  () => route.path,
  (newPath) => {
    // 如果路由包含 /admin/reports，说明离开了举报页面，可以刷新数量
    if (newPath.includes('/admin/reports') === false) {
      // 延迟一点时间刷新，确保用户已经离开举报页面
      setTimeout(() => {
        loadPendingReportsCount()
      }, 500)
    }
  },
)

const userAvatar = computed(() => {
  if (!userStore.user?.avatarUrl || userStore.user?.avatarUrl === 'defaultAvatar.png') {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'
  }
  if (userStore.user.avatarUrl.startsWith('http')) {
    return userStore.user.avatarUrl
  }
  return `/api/uploads/profile-pictures/${userStore.user.avatarUrl}`
})

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'
}

const logout = () => {
  userStore.logout()
  router.push('/')
}
</script>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

@keyframes pulse-slow {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

.router-link-active {
  @apply shadow-lg;
}
</style>
