<template>
  <div class="min-h-screen bg-base-200">
    <!-- 筛选 + 网格同一内容栏，宽度对齐 -->
    <div class="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 lg:px-8">
      <WallpaperFilter v-model="filters" @filter-change="handleFilterChange" />

      <div class="mt-4">
        <div v-if="error" class="alert alert-error mb-6">
          <i class="i-[mdi--alert-circle] text-lg"></i>
          <span>{{ error }}</span>
          <button class="btn btn-ghost btn-sm" @click="() => loadFirst()">重试</button>
        </div>

        <WallpaperGrid
          :wallpapers="wallpapers"
          :loading="loading && wallpapers.length === 0"
          :show-pagination="false"
          :show-reset="true"
          :pagination="{ currentPage: 1, totalPages: 1, totalCount: totalCount }"
          @wallpaper-click="handleWallpaperClick"
          @reset-filters="resetFilters"
        />

        <div
          v-if="wallpapers.length > 0"
          ref="sentinelRef"
          class="flex flex-col items-center gap-3 py-10"
        >
          <div v-if="loading" class="flex items-center gap-2 text-sm text-base-content/55">
            <span class="loading loading-spinner loading-sm"></span>
            加载中...
          </div>
          <template v-else-if="noMore">
            <div class="flex items-center gap-2 text-sm text-base-content/40">
              <div class="h-px w-16 bg-base-content/15"></div>
              <span>没有更多了 ({{ totalCount }} 张壁纸)</span>
              <div class="h-px w-16 bg-base-content/15"></div>
            </div>
          </template>
          <button
            v-else
            type="button"
            class="btn btn-outline btn-sm"
            @click="loadMore"
          >
            加载更多
          </button>
        </div>
      </div>
    </div>

    <!-- 返回顶部 -->
    <Transition
      enter-active-class="transition-all duration-300"
      leave-active-class="transition-all duration-300"
      enter-from-class="opacity-0 translate-y-4"
      leave-to-class="opacity-0 translate-y-4"
    >
      <button
        v-if="showBackToTop"
        class="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition hover:scale-110 dark:bg-slate-100 dark:text-slate-900"
        @click="scrollToTop"
        title="回到顶部"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
        </svg>
      </button>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import { wallpaperService, type Wallpaper } from "@/services/wallpaper"
import WallpaperFilter from "@/components/WallpaperFilter.vue"
import WallpaperGrid from "@/components/WallpaperGrid.vue"
import { createFetchGeneration } from "@/utils/fetchGeneration"

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
  sortBy: "latest" | "popular" | "random" | "likes" | "downloads"
  category: string
  subCategory: string
  resolution: string
  ratio: string
  orientation: string
  format: string
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
const totalPages = ref(0)
const error = ref<string | null>(null)
const retryCount = ref(0)
const maxRetries = 3
const fetchTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null)
const filterDebounceId = ref<ReturnType<typeof setTimeout> | null>(null)
const noMore = ref(false)
const showBackToTop = ref(false)
const sentinelRef = ref<HTMLElement | null>(null)
const listFetchGeneration = createFetchGeneration()
const FILTER_DEBOUNCE_MS = 400

// 筛选条件
const filters = ref<Filters>({
  sortBy: "latest",
  category: "",
  subCategory: "",
  resolution: "",
  ratio: "",
  orientation: "",
  format: "",
  search: "",
})

// 排序映射表
const sortMapping = {
  latest: { sortBy: "createdAt", sortOrder: "DESC" },
  popular: { sortBy: "popular", sortOrder: "DESC" },
  likes: { sortBy: "likeCount", sortOrder: "DESC" },
  downloads: { sortBy: "downloadCount", sortOrder: "DESC" },
  random: { sortBy: "random", sortOrder: "DESC" },
} as const

// IntersectionObserver：在 sentinel 挂载后再绑定
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }

  const el = sentinelRef.value
  if (!el) return

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && !loading.value && !noMore.value && wallpapers.value.length > 0) {
        loadMore()
      }
    },
    { rootMargin: "300px" },
  )
  observer.observe(el)
}

const bindObserverAfterRender = async () => {
  await nextTick()
  setupObserver()
}

// 从路由查询参数初始化筛选条件（须在 watch filters 之前）
const initFiltersFromRoute = () => {
  const sortParam = route.query.sort as string
  if (sortParam && ["latest", "popular", "random", "likes", "downloads"].includes(sortParam)) {
    filters.value.sortBy = sortParam as "latest" | "popular" | "random" | "likes" | "downloads"
  }
}
initFiltersFromRoute()

// 初始化
onMounted(() => {
  fetchWallpapers(false)
  window.addEventListener("scroll", handleScroll, { passive: true })
})

// sentinel 出现/替换时重新观察
watch(sentinelRef, (el) => {
  if (el) setupObserver()
})

// 筛选条件变化：debounce，避免搜索每个字符打一次接口
watch(
  filters,
  () => {
    if (filterDebounceId.value) clearTimeout(filterDebounceId.value)
    filterDebounceId.value = setTimeout(() => {
      wallpapers.value = []
      currentPage.value = 1
      noMore.value = false
      error.value = null
      fetchWallpapers(false)
    }, FILTER_DEBOUNCE_MS)
  },
  { deep: true },
)

// 构建查询参数
const buildQueryParams = () => {
  const sortConfig = sortMapping[filters.value.sortBy]

  let minWidth: number | undefined
  let maxWidth: number | undefined
  let minHeight: number | undefined
  let maxHeight: number | undefined

  // 分辨率档位 → 最小宽高阈值（模糊匹配，不锁上限）
  const resolutionTiers: Record<string, { minW: number; minH: number }> = {
    "5k":          { minW: 4800, minH: 2700 },
    "4k":          { minW: 3000, minH: 1600 },
    "2k":          { minW: 2200, minH: 1200 },
    "1080p":       { minW: 1600, minH: 900 },
    "720p":        { minW: 1000, minH: 600 },
    "4k-portrait":   { minW: 1600, minH: 3000 },
    "2k-portrait":   { minW: 1200, minH: 2200 },
    "1080p-portrait": { minW: 900, minH: 1600 },
  }

  if (filters.value.resolution) {
    const tier = resolutionTiers[filters.value.resolution]
    if (tier) {
      minWidth = tier.minW
      minHeight = tier.minH
    }
  }

  let aspectRatio: number | undefined
  if (filters.value.ratio) {
    const [width, height] = filters.value.ratio.split(":").map(Number)
    aspectRatio = width / height
  }

  return {
    page: currentPage.value,
    limit: pageSize,
    tagKeyword: filters.value.search.trim() || undefined,
    sortBy: sortConfig.sortBy,
    sortOrder: sortConfig.sortOrder,
    category: filters.value.category
      ? (filters.value.category as "general" | "anime" | "people")
      : undefined,
    subCategory: filters.value.subCategory || undefined,
    format: filters.value.format || undefined,
    aspectRatio,
    orientation: filters.value.orientation || undefined,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
  }
}

// 获取壁纸列表：首屏/筛选递增代数；追加沿用代数；乱序旧响应丢弃
const fetchWallpapers = async (append: boolean) => {
  const gen = append ? listFetchGeneration.current : listFetchGeneration.next()
  loading.value = true
  if (!append) error.value = null

  try {
    const response = await wallpaperService.getWallpapers(buildQueryParams())
    if (!listFetchGeneration.isCurrent(gen)) return

    const apiResponse = response as unknown as ApiWallpaperResponse

    if (apiResponse.success && apiResponse.data) {
      if (append) {
        wallpapers.value = [...wallpapers.value, ...apiResponse.data]
      } else {
        wallpapers.value = apiResponse.data
      }
      totalCount.value = apiResponse.pagination.total
      totalPages.value = apiResponse.pagination.pages
      noMore.value = currentPage.value >= apiResponse.pagination.pages
      retryCount.value = 0
      await bindObserverAfterRender()
    } else if (apiResponse.message === "请求已取消") {
      return
    }
  } catch (err: unknown) {
    if (!listFetchGeneration.isCurrent(gen)) return

    const errObj = err as Error & { message?: string; code?: string }
    console.error("获取壁纸失败:", errObj)

    if (
      retryCount.value < maxRetries &&
      (errObj.message?.includes("超时") ||
        errObj.code === "ECONNABORTED" ||
        errObj.code === "NETWORK_ERROR")
    ) {
      retryCount.value++
      const retryDelay = 1000 * retryCount.value
      if (fetchTimeoutId.value) clearTimeout(fetchTimeoutId.value)
      fetchTimeoutId.value = setTimeout(() => fetchWallpapers(append), retryDelay)
      return
    }

    if (!append) {
      wallpapers.value = []
      totalCount.value = 0
    }
    error.value = errObj.message || "获取壁纸失败，请稍后重试"
  } finally {
    if (listFetchGeneration.isCurrent(gen)) {
      loading.value = false
    }
  }
}

// 加载更多（下一页）
const loadMore = () => {
  if (loading.value || noMore.value) return
  currentPage.value++
  fetchWallpapers(true)
}

// 重新加载第一页
const loadFirst = () => {
  wallpapers.value = []
  currentPage.value = 1
  noMore.value = false
  fetchWallpapers(false)
}

// 筛选条件变化处理
const handleFilterChange = () => {
  // watch filters 已经处理了重置
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
    subCategory: "",
    resolution: "",
    ratio: "",
    orientation: "",
    format: "",
    search: "",
  }
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" })
}

// 清理
onUnmounted(() => {
  if (observer) observer.disconnect()
  if (fetchTimeoutId.value) clearTimeout(fetchTimeoutId.value)
  if (filterDebounceId.value) clearTimeout(filterDebounceId.value)
  window.removeEventListener("scroll", handleScroll)
  loading.value = false
})
</script>
