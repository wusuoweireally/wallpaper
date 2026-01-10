<template>
  <div class="min-h-screen bg-base-200">
    <!-- 筛选组件 -->
    <WallpaperFilter v-model="filters" @filter-change="handleFilterChange" />

    <!-- 壁纸网格 -->
    <div class="mx-auto w-full px-3 py-6 sm:px-5 lg:px-8">
      <!-- 错误提示 -->
      <div v-if="error" class="alert alert-error mb-6">
        <i class="i-mdi-alert-circle text-lg"></i>
        <span>{{ error }}</span>
        <button class="btn btn-ghost btn-sm" @click="() => fetchWallpapers()">重试</button>
      </div>

      <WallpaperGrid
        :wallpapers="wallpapers"
        :loading="loading"
        :show-pagination="true"
        :show-reset="true"
        :pagination="{
          currentPage: currentPage,
          totalPages: totalPages,
          totalCount: totalCount,
        }"
        @wallpaper-click="handleWallpaperClick"
        @page-change="goToPage"
        @reset-filters="resetFilters"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { wallpaperService, type Wallpaper } from "@/services/wallpaper"
import WallpaperFilter from "@/components/WallpaperFilter.vue"
import WallpaperGrid from "@/components/WallpaperGrid.vue"

// API拦截器返回的格式
interface ApiWallpaperResponse {
  success: boolean
  message?: string
  data: Wallpaper[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface Filters {
  sortBy: "latest" | "popular" | "random"
  category: string
  resolution: string
  ratio: string
  search: string
}

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const wallpapers = ref<Wallpaper[]>([])
const currentPage = ref(1)
const pageSize = 20
const totalCount = ref(0)
const error = ref<string | null>(null)
const retryCount = ref(0)
const maxRetries = 3
const fetchTimeoutId = ref<NodeJS.Timeout | null>(null)

// 筛选条件
const filters = ref<Filters>({
  sortBy: "latest",
  category: "",
  resolution: "",
  ratio: "",
  search: "",
})

// 排序映射表：前端值 -> API 参数
const sortMapping = {
  latest: { sortBy: "createdAt", sortOrder: "DESC" },
  popular: { sortBy: "popular", sortOrder: "DESC" },
  random: { sortBy: "random", sortOrder: "DESC" },
} as const

// 计算属性
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))

// 初始化
onMounted(() => {
  initFiltersFromRoute()
  fetchWallpapers()
})

// 监听筛选条件变化
watch(
  [filters, currentPage],
  () => {
    fetchWallpapers()
  },
  { deep: true },
)

// 从路由查询参数初始化筛选条件
const initFiltersFromRoute = () => {
  const sortParam = route.query.sort as string
  if (sortParam && ["latest", "popular", "random"].includes(sortParam)) {
    filters.value.sortBy = sortParam as "latest" | "popular" | "random"
  }
}

// 获取壁纸列表
const fetchWallpapers = async (isRetry: boolean = false) => {
  if (!isRetry) {
    retryCount.value = 0 // 非重试调用时重置重试次数
  }

  loading.value = true
  error.value = null

  try {
    // 使用映射表获取排序参数
    const sortConfig = sortMapping[filters.value.sortBy]

    // 解析分辨率 - 使用±10%的容忍度范围
    let minWidth: number | undefined
    let maxWidth: number | undefined
    let minHeight: number | undefined
    let maxHeight: number | undefined

    if (filters.value.resolution) {
      const [width, height] = filters.value.resolution.split("x").map(Number)
      // 计算±10%的分辨率范围，提供更宽松的匹配
      const tolerance = 0.1 // 10%容忍度
      const widthTolerance = Math.floor(width * tolerance)
      const heightTolerance = Math.floor(height * tolerance)

      minWidth = Math.max(width - widthTolerance, 1) // 确保最小值不小于1
      maxWidth = width + widthTolerance
      minHeight = Math.max(height - heightTolerance, 1)
      maxHeight = height + heightTolerance
    }

    // 解析宽高比
    let aspectRatio: number | undefined
    if (filters.value.ratio) {
      const [width, height] = filters.value.ratio.split(":").map(Number)
      aspectRatio = width / height
    }

    const tagKeyword = filters.value.search.trim() || undefined

    const response = await wallpaperService.getWallpapers({
      page: currentPage.value,
      limit: pageSize,
      tagKeyword,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      category: filters.value.category
        ? (filters.value.category as "general" | "anime" | "people")
        : undefined,
      aspectRatio,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
    })

    // API拦截后直接返回 response.data，格式: { success: boolean, data: Wallpaper[], pagination: {...} }
    const apiResponse = response as unknown as ApiWallpaperResponse
    if (apiResponse.success && apiResponse.data) {
      wallpapers.value = apiResponse.data
      totalCount.value = apiResponse.pagination.total
      retryCount.value = 0 // 成功时重置重试次数
    } else if (apiResponse.message === "请求已取消") {
      // 请求被取消，静默处理，不更新状态
      return
    }
  } catch (err: any) {
    console.error("获取壁纸失败:", err)

    // 智能重试机制 - 针对超时和网络错误
    if (
      retryCount.value < maxRetries &&
      (err.message.includes("超时") || err.code === "ECONNABORTED" || err.code === "NETWORK_ERROR")
    ) {
      retryCount.value++
      const retryDelay = 1000 * retryCount.value // 1秒、2秒、3秒递增

      // 清除之前的重试计时器
      if (fetchTimeoutId.value) {
        clearTimeout(fetchTimeoutId.value)
      }

      // 设置新的重试计时器
      fetchTimeoutId.value = setTimeout(() => fetchWallpapers(true), retryDelay)
      return
    }

    // 重试次数用完或不属于可重试错误，设置错误状态
    wallpapers.value = []
    totalCount.value = 0
    error.value = err.message || "获取壁纸失败，请稍后重试"
  } finally {
    loading.value = false
  }
}

// 筛选条件变化处理
const handleFilterChange = () => {
  currentPage.value = 1
}

// 壁纸点击处理
const handleWallpaperClick = (wallpaper: Wallpaper) => {
  router.push(`/wallpaper/${wallpaper.id}`)
}

// 重置筛选条件
const resetFilters = () => {
  filters.value = {
    sortBy: "latest",
    category: "",
    resolution: "",
    ratio: "",
    search: "",
  }
  currentPage.value = 1
}

// 跳转到指定页码
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 组件卸载时清理所有pending请求
onUnmounted(() => {
  // 清理重试计时器
  if (fetchTimeoutId.value) {
    clearTimeout(fetchTimeoutId.value)
  }

  // 重置加载状态
  loading.value = false
})
</script>
