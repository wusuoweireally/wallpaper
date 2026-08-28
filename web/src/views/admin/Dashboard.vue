<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-fg">仪表盘</h1>
        <p class="mt-1 text-sm text-muted">系统概览</p>
      </div>
      <p class="text-sm text-faint">
        {{
          new Date().toLocaleDateString("zh-CN", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })
        }}
      </p>
    </header>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="wb-card p-4">
        <p class="text-xs text-muted">用户</p>
        <p class="mt-2 text-3xl font-bold tabular-nums text-fg">{{ stats.totalUsers || 0 }}</p>
        <p class="mt-1 text-xs text-faint">
          活跃 {{ stats.activeUsers || 0 }} · {{ userPercentage }}%
        </p>
      </div>
      <div class="wb-card p-4">
        <p class="text-xs text-muted">壁纸</p>
        <p class="mt-2 text-3xl font-bold tabular-nums text-fg">
          {{ stats.totalWallpapers || 0 }}
        </p>
        <p class="mt-1 text-xs text-faint">本月 +{{ stats.newWallpapersThisMonth || 0 }}</p>
      </div>
      <div class="wb-card p-4">
        <p class="text-xs text-muted">帖子</p>
        <p class="mt-2 text-3xl font-bold tabular-nums text-fg">{{ stats.totalPosts || 0 }}</p>
        <p class="mt-1 text-xs text-faint">本月 +{{ stats.newPostsThisMonth || 0 }}</p>
      </div>
      <div class="wb-card p-4">
        <p class="text-xs text-muted">待处理举报</p>
        <p class="mt-2 text-3xl font-bold tabular-nums text-fg">
          {{ stats.pendingReports || 0 }}
        </p>
        <p class="mt-1 text-xs text-faint">
          共 {{ stats.totalReports || 0 }} · {{ reportPercentage }}%
        </p>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-3">
      <div class="wb-card xl:col-span-2">
        <div class="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 class="text-sm font-semibold text-fg">快速操作</h2>
        </div>
        <div class="grid grid-cols-2 gap-2 p-4">
          <RouterLink to="/admin/users" class="wb-btn justify-start">
            <i class="i-[mdi--account-group-outline] text-primary" aria-hidden="true"></i>
            用户管理
          </RouterLink>
          <RouterLink to="/admin/wallpapers" class="wb-btn justify-start">
            <i class="i-[mdi--image-multiple-outline] text-primary" aria-hidden="true"></i>
            壁纸管理
          </RouterLink>
          <RouterLink to="/admin/reports" class="wb-btn justify-start">
            <i class="i-[mdi--flag-outline] text-primary" aria-hidden="true"></i>
            举报管理
          </RouterLink>
          <RouterLink to="/wallpapers" class="wb-btn justify-start">
            <i class="i-[mdi--compass-outline] text-primary" aria-hidden="true"></i>
            浏览前台
          </RouterLink>
        </div>
      </div>

      <div class="wb-card">
        <div class="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 class="text-sm font-semibold text-fg">最近举报</h2>
          <RouterLink to="/admin/reports" class="text-xs text-primary">查看全部</RouterLink>
        </div>
        <div class="p-4">
          <div v-if="loading" class="flex justify-center py-8">
            <span class="wb-spinner text-muted"></span>
          </div>
          <div
            v-else-if="recentReports.length === 0"
            class="flex flex-col items-center gap-2 py-10 text-sm text-faint"
          >
            <i class="i-[mdi--inbox-outline] text-2xl" aria-hidden="true"></i>
            <span>暂无最新活动</span>
          </div>
          <ul v-else class="space-y-3">
            <li v-for="report in recentReports" :key="report.id" class="text-sm">
              <p class="font-medium text-fg">{{ getReasonText(report.reason) }}</p>
              <p class="mt-0.5 text-xs text-faint">
                {{ report.reporterUsername || "匿名用户" }} · {{ formatTime(report.createdAt) }}
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 text-xs text-muted">
      <span class="wb-chip">本月新增壁纸占比 {{ wallpaperPercentage }}%</span>
      <span class="wb-chip">本月新增帖子占比 {{ postPercentage }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import adminService, {
  type DashboardStats,
  type RecentActivityItem,
  type ReportReasonValue,
} from "@/services/admin"
import { formatTime } from "@/utils/format"

const stats = ref<DashboardStats>({
  totalUsers: 0,
  activeUsers: 0,
  totalWallpapers: 0,
  newWallpapersThisMonth: 0,
  totalPosts: 0,
  newPostsThisMonth: 0,
  pendingReports: 0,
  totalReports: 0,
})

const recentReports = ref<RecentActivityItem[]>([])
const loading = ref(false)

const userPercentage = computed(() => {
  if (!stats.value.totalUsers) return 0
  return Math.min((stats.value.activeUsers / stats.value.totalUsers) * 100, 100).toFixed(0)
})

const wallpaperPercentage = computed(() => {
  if (!stats.value.totalWallpapers) return 0
  return Math.min(
    (stats.value.newWallpapersThisMonth / stats.value.totalWallpapers) * 100,
    100,
  ).toFixed(0)
})

const postPercentage = computed(() => {
  if (!stats.value.totalPosts) return 0
  return Math.min((stats.value.newPostsThisMonth / stats.value.totalPosts) * 100, 100).toFixed(0)
})

const reportPercentage = computed(() => {
  if (!stats.value.totalReports) return 0
  return Math.min((stats.value.pendingReports / stats.value.totalReports) * 100, 100).toFixed(0)
})

const loadDashboardData = async () => {
  try {
    loading.value = true
    const [statsResponse, activityResponse] = await Promise.all([
      adminService.getDashboardStats(),
      adminService.getRecentActivity(),
    ])
    if (statsResponse?.data) {
      stats.value = statsResponse.data
    }
    recentReports.value = activityResponse?.data || []
  } catch (error) {
    console.error("加载仪表盘数据失败:", error)
  } finally {
    loading.value = false
  }
}

const getReasonText = (reason: ReportReasonValue) => {
  const map: Record<ReportReasonValue, string> = {
    spam: "垃圾信息",
    inappropriate: "不当内容",
    harassment: "骚扰/霸凌",
    violence: "暴力行为",
    copyright: "版权问题",
    misinformation: "虚假信息",
    other: "其他",
  }
  return map[reason] || "新的举报"
}

onMounted(() => {
  loadDashboardData()
})
</script>
