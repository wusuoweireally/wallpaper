<template>
  <div class="wb-page">
    <div class="sticky top-14 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
      <div class="wb-container-gallery py-2">
        <WallpaperFilter v-model="filters" />
      </div>
    </div>

    <div class="wb-container-gallery py-3">
      <header class="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div class="min-w-0">
          <h1 class="wb-page-title truncate">{{ hero.title }}</h1>
          <p class="mt-0.5 text-xs text-muted">{{ hero.subtitle }}</p>
        </div>
        <p v-if="!loading && totalCount > 0" class="shrink-0 text-xs tabular-nums text-faint">
          共 {{ totalCount }} 张
        </p>
      </header>

      <div>
        <div v-if="error" class="wb-alert-danger mb-6">
          <i class="i-[mdi--alert-circle] text-lg"></i>
          <span>{{ error }}</span>
          <button class="wb-btn-ghost wb-btn-sm" @click="() => loadFirst()">重试</button>
        </div>

        <!-- 零结果空态 -->
        <div v-if="!loading && !error && wallpapers.length === 0" class="wb-empty">
          <p class="text-base font-medium text-fg">暂无壁纸</p>
          <p class="mt-1 text-sm text-muted">调整筛选条件或稍后再来</p>
          <button v-if="hasActiveFilters" type="button" class="wb-btn mt-4" @click="resetFilters">
            重置筛选
          </button>
        </div>

        <WallpaperGrid
          v-else
          :wallpapers="wallpapers"
          :loading="loading && wallpapers.length === 0"
          :show-pagination="false"
          :show-reset="true"
          masonry
          :pagination="{ currentPage: 1, totalPages: 1, totalCount: totalCount }"
          @reset-filters="resetFilters"
        />

        <div
          v-if="wallpapers.length > 0"
          ref="sentinelRef"
          class="flex flex-col items-center gap-3 py-10"
        >
          <div v-if="loading" class="flex items-center gap-2 text-sm text-muted">
            <span class="wb-spinner"></span>
            加载中…
          </div>
          <div v-else-if="appendError" class="flex items-center gap-3 text-sm text-error">
            <i class="i-[mdi--alert-circle]" aria-hidden="true"></i>
            <span>{{ appendError }}</span>
            <button type="button" class="wb-btn-ghost wb-btn-sm text-error" @click="retryAppend">
              重试
            </button>
          </div>
          <template v-else-if="noMore">
            <div class="flex items-center gap-2 text-sm text-faint">
              <div class="h-px w-16 bg-line"></div>
              <span>没有更多了 ({{ totalCount }} 张壁纸)</span>
              <div class="h-px w-16 bg-line"></div>
            </div>
          </template>
          <button v-else type="button" class="wb-btn" @click="loadMore">加载更多</button>
        </div>
      </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-300"
      leave-active-class="transition-all duration-300"
      enter-from-class="opacity-0 translate-y-4"
      leave-to-class="opacity-0 translate-y-4"
    >
      <button
        v-if="showBackToTop"
        class="wb-icon-btn fixed bottom-6 right-6 z-50 h-10 w-10 shadow-sm"
        title="回到顶部"
        @click="scrollToTop"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
          />
        </svg>
      </button>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import { wallpaperService, type Wallpaper } from "@/services/wallpaper"
import WallpaperFilter from "@/components/WallpaperFilter.vue"
import WallpaperGrid from "@/components/WallpaperGrid.vue"
import { createFetchGeneration } from "@/utils/fetchGeneration"
import {
  buildApiListQuery,
  defaultBrowseFilters,
  filtersFromRouteQuery,
  filtersToRouteQuery,
  hasActiveBrowseFilters,
  sceneHeroFromFilters,
  type BrowseFilters,
} from "@/utils/wallpaperBrowse"

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

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const wallpapers = ref<Wallpaper[]>([])
const currentPage = ref(1)
const pageSize = 20
const totalCount = ref(0)
const error = ref<string | null>(null)
const retryCount = ref(0)
const maxRetries = 3
const fetchTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null)
const filterDebounceId = ref<ReturnType<typeof setTimeout> | null>(null)
const noMore = ref(false)
/** 追加页加载失败的信息（与首屏 error 分开，避免清空已浏览内容） */
const appendError = ref("")
const showBackToTop = ref(false)
const sentinelRef = ref<HTMLElement | null>(null)
const listFetchGeneration = createFetchGeneration()
const FILTER_DEBOUNCE_MS = 400
const syncingFromRoute = ref(false)

/** 随机排序种子：一轮筛选会话内固定，翻页不重复；换筛选/回退前进时重掷 */
const newRandomSeed = () => Math.floor(Math.random() * 2 ** 31)
const randomSeed = ref(newRandomSeed())

const filters = ref<BrowseFilters>(defaultBrowseFilters())

const hero = computed(() => {
  if (filters.value.search.trim()) {
    return { title: `搜索「${filters.value.search.trim()}」`, subtitle: "按关键词匹配壁纸标签" }
  }
  return sceneHeroFromFilters({
    sortBy: filters.value.sortBy,
    topRange: filters.value.topRange,
  })
})

const hasActiveFilters = computed(() => hasActiveBrowseFilters(filters.value))

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

const applyRouteQuery = () => {
  const next = filtersFromRouteQuery(route.query as Record<string, unknown>)
  syncingFromRoute.value = true
  filters.value = next
  nextTick(() => {
    syncingFromRoute.value = false
  })
}

const writeFiltersToRoute = () => {
  const query = filtersToRouteQuery(filters.value)
  router.replace({ path: route.path, query })
}

onMounted(() => {
  applyRouteQuery()
  fetchWallpapers(false)
  window.addEventListener("scroll", handleScroll, { passive: true })
})

watch(sentinelRef, (el) => {
  if (el) setupObserver()
})

watch(
  filters,
  () => {
    if (syncingFromRoute.value) return
    if (filterDebounceId.value) clearTimeout(filterDebounceId.value)
    filterDebounceId.value = setTimeout(() => {
      writeFiltersToRoute()
      wallpapers.value = []
      currentPage.value = 1
      noMore.value = false
      error.value = null
      randomSeed.value = newRandomSeed() // 换筛选 = 新一轮随机池
      fetchWallpapers(false)
    }, FILTER_DEBOUNCE_MS)
  },
  { deep: true },
)

// 浏览器前进后退：同步 URL → filters
watch(
  () => route.fullPath,
  () => {
    if (route.path !== "/wallpapers") return
    const next = filtersFromRouteQuery(route.query as Record<string, unknown>)
    const cur = filtersToRouteQuery(filters.value)
    const nxt = filtersToRouteQuery(next)
    if (JSON.stringify(cur) === JSON.stringify(nxt)) return
    syncingFromRoute.value = true
    filters.value = next
    nextTick(() => {
      syncingFromRoute.value = false
      wallpapers.value = []
      currentPage.value = 1
      noMore.value = false
      randomSeed.value = newRandomSeed()
      fetchWallpapers(false)
    })
  },
)

const fetchWallpapers = async (append: boolean) => {
  const gen = append ? listFetchGeneration.current : listFetchGeneration.next()
  loading.value = true
  if (!append) error.value = null
  // 开始新请求前清掉上一轮“加载更多”的行内错误
  appendError.value = ""

  try {
    const params = buildApiListQuery(
      filters.value,
      currentPage.value,
      pageSize,
      randomSeed.value,
    )
    const response = await wallpaperService.getWallpapers(params)
    if (!listFetchGeneration.isCurrent(gen)) return

    const apiResponse = response as unknown as ApiWallpaperResponse

    if (apiResponse.success && apiResponse.data) {
      if (append) {
        wallpapers.value = [...wallpapers.value, ...apiResponse.data]
      } else {
        wallpapers.value = apiResponse.data
      }
      totalCount.value = apiResponse.pagination.total
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

    if (append) {
      // 追加失败：页码回退，保留已加载内容，行内提示重试
      currentPage.value = Math.max(1, currentPage.value - 1)
      appendError.value = errObj.message || "加载更多失败，请稍后重试"
    } else {
      wallpapers.value = []
      totalCount.value = 0
      error.value = errObj.message || "获取壁纸失败，请稍后重试"
    }
  } finally {
    if (listFetchGeneration.isCurrent(gen)) {
      loading.value = false
    }
  }
}

const loadMore = () => {
  if (loading.value || noMore.value) return
  currentPage.value++
  fetchWallpapers(true)
}

/** 行内重试：清掉错误再追加，模板多语句表达式交给方法避免编译问题 */
const retryAppend = () => {
  appendError.value = ""
  loadMore()
}

const loadFirst = () => {
  wallpapers.value = []
  currentPage.value = 1
  noMore.value = false
  randomSeed.value = newRandomSeed()
  fetchWallpapers(false)
}

const resetFilters = () => {
  filters.value = defaultBrowseFilters()
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" })
}

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (fetchTimeoutId.value) clearTimeout(fetchTimeoutId.value)
  if (filterDebounceId.value) clearTimeout(filterDebounceId.value)
  window.removeEventListener("scroll", handleScroll)
  loading.value = false
})
</script>
