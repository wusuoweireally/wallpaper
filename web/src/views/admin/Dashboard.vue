<template>
  <div class="space-y-8">
    <!-- 页面标题 -->
    <div class="relative">
      <div class="absolute -inset-x-4 -inset-y-2 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 blur-2xl -z-10 rounded-3xl"></div>
      <div class="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <iconify-icon icon="mdi:view-dashboard" ></iconify-icon>
              </div>
              <h1 class="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                管理后台仪表盘
              </h1>
            </div>
            <p class="text-white/70 ml-15 text-lg">欢迎回来！这里是系统概览</p>
          </div>
          <div class="text-right">
            <div class="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
              <div class="text-sm text-white/60">今日日期</div>
              <div class="text-xl font-bold text-white mt-1">
                {{ new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' }) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl p-[2px] shadow-2xl transition-all hover:shadow-blue-500/30 hover:scale-[1.03] animate-fade-in">
        <div class="rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 h-full border border-white/10">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <p class="text-sm font-semibold text-white/60 uppercase tracking-wider">用户总数</p>
              <div class="text-4xl font-bold text-white mt-2 mb-2">{{ stats.totalUsers || 0 }}</div>
              <div class="flex items-center gap-2 text-sm">
                <div class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                <span class="text-white/70">活跃: <span class="text-blue-400 font-semibold">{{ stats.activeUsers || 0 }}</span></span>
              </div>
            </div>
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300 border border-blue-400/30 shadow-lg">
              <iconify-icon icon="mdi:account-group" ></iconify-icon>
            </div>
          </div>
          <div class="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div class="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000" :style="{ width: `${userPercentage}%` }"></div>
          </div>
          <div class="mt-3 text-xs text-white/40">{{ userPercentage }}% 活跃率</div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl p-[2px] shadow-2xl transition-all hover:shadow-purple-500/30 hover:scale-[1.03] animate-fade-in animation-delay-200">
        <div class="rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 h-full border border-white/10">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <p class="text-sm font-semibold text-white/60 uppercase tracking-wider">壁纸总数</p>
              <div class="text-4xl font-bold text-white mt-2 mb-2">{{ stats.totalWallpapers || 0 }}</div>
              <div class="flex items-center gap-2 text-sm">
                <div class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                <span class="text-white/70">本月新增: <span class="text-purple-400 font-semibold">{{ stats.newWallpapersThisMonth || 0 }}</span></span>
              </div>
            </div>
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300 border border-purple-400/30 shadow-lg">
              <iconify-icon icon="mdi:image" class="text-3xl text-purple-300"></iconify-icon>
            </div>
          </div>
          <div class="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div class="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-1000" :style="{ width: `${wallpaperPercentage}%` }"></div>
          </div>
          <div class="mt-3 text-xs text-white/40">{{ wallpaperPercentage }}% 月增长率</div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl p-[2px] shadow-2xl transition-all hover:shadow-emerald-500/30 hover:scale-[1.03] animate-fade-in animation-delay-400">
        <div class="rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 h-full border border-white/10">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <p class="text-sm font-semibold text-white/60 uppercase tracking-wider">帖子总数</p>
              <div class="text-4xl font-bold text-white mt-2 mb-2">{{ stats.totalPosts || 0 }}</div>
              <div class="flex items-center gap-2 text-sm">
                <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span class="text-white/70">本月新增: <span class="text-emerald-400 font-semibold">{{ stats.newPostsThisMonth || 0 }}</span></span>
              </div>
            </div>
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300 border border-emerald-400/30 shadow-lg">
              <iconify-icon icon="mdi:forum" class="text-3xl text-emerald-300"></iconify-icon>
            </div>
          </div>
          <div class="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000" :style="{ width: `${postPercentage}%` }"></div>
          </div>
          <div class="mt-3 text-xs text-white/40">{{ postPercentage }}% 月增长率</div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl p-[2px] shadow-2xl transition-all hover:shadow-orange-500/30 hover:scale-[1.03] animate-fade-in animation-delay-600">
        <div class="rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 h-full border border-white/10">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <p class="text-sm font-semibold text-white/60 uppercase tracking-wider">待处理举报</p>
              <div class="text-4xl font-bold text-white mt-2 mb-2">{{ stats.pendingReports || 0 }}</div>
              <div class="flex items-center gap-2 text-sm">
                <div class="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                <span class="text-white/70">总举报: <span class="text-orange-400 font-semibold">{{ stats.totalReports || 0 }}</span></span>
              </div>
            </div>
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300 border border-orange-400/30 shadow-lg">
              <iconify-icon icon="mdi:alert-circle" class="text-3xl"></iconify-icon>
            </div>
          </div>
          <div class="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div class="h-full bg-gradient-to-r from-orange-500 to-red-400 rounded-full transition-all duration-1000" :style="{ width: `${reportPercentage}%` }"></div>
          </div>
          <div class="mt-3 text-xs text-white/40">{{ reportPercentage }}% 待处理率</div>
        </div>
      </div>
    </div>

    <!-- 快速操作和最近活动 -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- 快速操作 -->
      <div class="xl:col-span-2 relative group">
        <div class="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-purple-500/30 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
        <div class="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
          <div class="p-6 border-b border-white/10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <iconify-icon icon="mdi:lightning-bolt" class="text-white"></iconify-icon>
              </div>
              <h2 class="text-xl font-bold text-white">快速操作</h2>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-4">
              <RouterLink to="/admin/users" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-all border border-blue-400/30">
                    <iconify-icon icon="mdi:account-group" class="text-2xl"></iconify-icon>
                  </div>
                  <span class="text-white font-semibold">用户管理</span>
                  <div class="text-xs text-white/50 text-center">管理系统用户</div>
                </div>
              </RouterLink>
              <RouterLink to="/admin/wallpapers" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-all border border-purple-400/30">
                    <iconify-icon icon="mdi:image" class="text-2xl text-purple-300"></iconify-icon>
                  </div>
                  <span class="text-white font-semibold">壁纸管理</span>
                  <div class="text-xs text-white/50 text-center">管理所有壁纸</div>
                </div>
              </RouterLink>
              <RouterLink to="/admin/reports" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center group-hover:scale-110 transition-all border border-orange-400/30">
                    <iconify-icon icon="mdi:shield-alert" class="text-2xl"></iconify-icon>
                  </div>
                  <span class="text-white font-semibold">举报管理</span>
                  <div class="text-xs text-white/50 text-center">处理用户举报</div>
                </div>
              </RouterLink>
              <RouterLink to="/wallpapers" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-all border border-emerald-400/30">
                    <iconify-icon icon="mdi:eye" class="text-2xl text-emerald-300"></iconify-icon>
                  </div>
                  <span class="text-white font-semibold">浏览壁纸</span>
                  <div class="text-xs text-white/50 text-center">查看首页</div>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="relative group">
        <div class="absolute -inset-1 bg-gradient-to-r from-orange-500/30 via-red-500/30 to-orange-500/30 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
        <div class="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl h-full">
          <div class="p-6 border-b border-white/10">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <iconify-icon icon="mdi:bell-ring" class="text-white"></iconify-icon>
                </div>
                <h2 class="text-xl font-bold text-white">最近活动</h2>
              </div>
              <RouterLink to="/admin/reports" class="text-sm text-purple-300 hover:text-white transition-colors">查看全部</RouterLink>
            </div>
          </div>

          <div class="p-6">
            <div v-if="loading" class="flex justify-center py-12">
              <div class="relative">
                <div class="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
              </div>
            </div>
            <div v-else-if="recentReports.length === 0" class="flex flex-col items-center justify-center py-12">
              <div class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <iconify-icon icon="mdi:inbox" class="text-4xl text-white/30"></iconify-icon>
              </div>
              <p class="text-white/60 font-semibold">暂无最新活动</p>
              <p class="text-xs text-white/40 mt-2">所有系统运行正常</p>
            </div>
            <div v-else class="space-y-3">
              <div v-for="(report, index) in recentReports" :key="report.id" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-4 border border-white/10 hover:border-white/30 transition-all duration-300">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center flex-shrink-0 border border-orange-400/30 shadow-lg group-hover:scale-110 transition-transform">
                    <iconify-icon icon="mdi:alert" class="text-white text-xl"></iconify-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-white truncate">
                      {{ getReasonText(report.reason) }}
                    </p>
                    <div class="flex items-center gap-2 mt-1.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
                      <p class="text-xs text-white/60">
                        {{ report.reporterUsername || '匿名用户' }} · {{ formatDate(report.createdAt) }}
                      </p>
                    </div>
                  </div>
                  <div class="text-xs text-white/40 font-mono">#{{ report.id }}</div>
                </div>
                <div v-if="index < recentReports.length - 1" class="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统信息 -->
    <div class="relative group">
      <div class="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
      <div class="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
        <div class="p-6 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <iconify-icon icon="mdi:information" class="text-white text-xl"></iconify-icon>
            </div>
            <h2 class="text-xl font-bold text-white">系统信息</h2>
          </div>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-5 border border-white/10 hover:border-blue-400/30 transition-all duration-300 hover:scale-105">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-400/30 group-hover:scale-110 transition-transform">
                  <iconify-icon icon="mdi:package-variant" class="text-blue-300"></iconify-icon>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-white/60">版本信息</p>
                  <p class="text-sm font-bold text-white mt-1">v1.0.0</p>
                  <div class="flex items-center gap-2 mt-2">
                    <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span class="text-xs text-green-400">最新版本</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-5 border border-white/10 hover:border-emerald-400/30 transition-all duration-300 hover:scale-105">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-400/30 group-hover:scale-110 transition-transform">
                  <iconify-icon icon="mdi:calendar-clock" class="text-emerald-300"></iconify-icon>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-white/60">最后更新</p>
                  <p class="text-sm font-bold text-white mt-1">{{ new Date().toLocaleDateString('zh-CN') }}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <div class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                    <span class="text-xs text-blue-400">今日</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-5 border border-white/10 hover:border-purple-400/30 transition-all duration-300 hover:scale-105">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-400/30 group-hover:scale-110 transition-transform">
                  <iconify-icon icon="mdi:server" class="text-purple-300 text-xl"></iconify-icon>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-white/60">服务器状态</p>
                  <div class="flex items-center gap-2 mt-2">
                    <div class="badge badge-success badge-sm border-none bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30">运行正常</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-5 border border-white/10 hover:border-orange-400/30 transition-all duration-300 hover:scale-105">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-400/30 group-hover:scale-110 transition-transform">
                  <iconify-icon icon="mdi:chart-line" class="text-orange-300"></iconify-icon>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-white/60">系统负载</p>
                  <p class="text-sm font-bold text-white mt-1">{{ systemLoad }}%</p>
                  <div class="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-orange-500 to-red-400 rounded-full transition-all duration-1000" :style="{ width: `${systemLoad}%` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import adminService, { type DashboardStats, type RecentActivityItem, type ReportReasonValue } from '@/services/admin'

const stats = ref<DashboardStats>({
  totalUsers: 0,
  activeUsers: 0,
  totalWallpapers: 0,
  newWallpapersThisMonth: 0,
  totalPosts: 0,
  newPostsThisMonth: 0,
  pendingReports: 0,
  totalReports: 0
})

const recentReports = ref<RecentActivityItem[]>([])
const loading = ref(false)

const userPercentage = computed(() => {
  if (!stats.value.totalUsers) return 0
  return Math.min((stats.value.activeUsers / stats.value.totalUsers) * 100, 100).toFixed(0)
})

const wallpaperPercentage = computed(() => {
  if (!stats.value.totalWallpapers) return 0
  return Math.min((stats.value.newWallpapersThisMonth / stats.value.totalWallpapers) * 100, 100).toFixed(0)
})

const postPercentage = computed(() => {
  if (!stats.value.totalPosts) return 0
  return Math.min((stats.value.newPostsThisMonth / stats.value.totalPosts) * 100, 100).toFixed(0)
})

const reportPercentage = computed(() => {
  if (!stats.value.totalReports) return 0
  return Math.min((stats.value.pendingReports / stats.value.totalReports) * 100, 100).toFixed(0)
})

const systemLoad = computed(() => {
  const userLoad = stats.value.totalUsers
    ? (stats.value.activeUsers / stats.value.totalUsers) * 60
    : 0
  const reportLoad = stats.value.totalReports
    ? (stats.value.pendingReports / stats.value.totalReports) * 40
    : 0
  return Math.min(Math.round(userLoad + reportLoad), 100)
})

const loadDashboardData = async () => {
  try {
    loading.value = true
    const [statsResponse, activityResponse] = await Promise.all([
      adminService.getDashboardStats(),
      adminService.getRecentActivity()
    ])
    if (statsResponse?.data) {
      stats.value = statsResponse.data
    }
    recentReports.value = activityResponse?.data || []
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  } finally {
    loading.value = false
  }
}

const getReasonText = (reason: ReportReasonValue) => {
  const map: Record<ReportReasonValue, string> = {
    spam: '垃圾信息',
    inappropriate: '不当内容',
    harassment: '骚扰/霸凌',
    violence: '暴力行为',
    copyright: '版权问题',
    misinformation: '虚假信息',
    other: '其他'
  }
  return map[reason] || '新的举报'
}

const formatDate = (date: string) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}

.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-400 {
  animation-delay: 400ms;
}

.animation-delay-600 {
  animation-delay: 600ms;
}
</style>
