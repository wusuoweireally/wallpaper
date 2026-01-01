<template>
  <div class="space-y-8">
    <!-- 页面标题和统计 -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-3xl font-bold text-slate-900">{{ title }}</h2>
        <p class="mt-2 text-sm text-slate-500">
          共 <span class="font-semibold text-slate-900">{{ pagination.total }}</span> 个壁纸
        </p>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="flex flex-col items-center gap-4">
        <div class="relative">
          <div class="h-16 w-16 animate-spin rounded-full border-4 border-slate-200"></div>
          <div
            class="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent"
          ></div>
        </div>
        <p class="text-slate-500">加载中...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="error"
      class="flex items-center justify-between rounded-2xl border-2 border-red-200 bg-red-50 p-6"
    >
      <div class="flex items-center gap-3">
        <i class="icon-[mdi--alert-circle] text-2xl text-red-500"></i>
        <span class="font-medium text-red-900">{{ error }}</span>
      </div>
      <button
        class="rounded-lg border border-red-300 bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200"
        @click="() => fetchData()"
      >
        重试
      </button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading && wallpapers.length === 0" class="py-20 text-center">
      <div class="flex flex-col items-center gap-6">
        <div class="relative">
          <div
            class="absolute inset-0 rounded-full bg-gradient-to-r from-purple-200/50 to-pink-200/50 blur-3xl"
          ></div>
          <i class="icon-[mdi--image-off] relative text-8xl text-slate-300"></i>
        </div>
        <div>
          <h3 class="text-2xl font-semibold text-slate-700">{{ emptyTitle }}</h3>
          <p class="mt-3 text-slate-500">{{ emptyDescription }}</p>
        </div>
        <button
          v-if="emptyAction"
          class="group mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 px-8 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] hover:shadow-xl"
          @click="emptyAction.handler"
        >
          {{ emptyAction.text }}
          <i class="icon-[mdi--arrow-right] text-lg transition-transform group-hover:translate-x-1"></i>
        </button>
      </div>
    </div>

    <!-- 壁纸网格 -->
    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <WallpaperCard
        v-for="wallpaper in wallpapers"
        :key="wallpaper.id"
        :wallpaper="wallpaper"
        :show-uploader="showUploader"
        :show-actions="showActions"
      />
    </div>

    <!-- 分页 -->
    <div v-if="!loading && wallpapers.length > 0" class="flex justify-center pt-4">
      <div class="inline-flex items-center gap-2 rounded-2xl bg-white/90 p-2 shadow-lg shadow-slate-200/60 ring-1 ring-black/5">
        <button
          class="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="pagination.page <= 1"
          @click="handlePageChange(pagination.page - 1)"
        >
          <i class="icon-[mdi--chevron-left] text-xl"></i>
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl text-sm font-semibold transition-all"
            :class="
              page === pagination.page
                ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-100'
            "
            @click="handlePageChange(page)"
          >
            {{ page }}
          </button>
        </div>

        <button
          class="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="pagination.page >= pagination.pages"
          @click="handlePageChange(pagination.page + 1)"
        >
          <i class="icon-[mdi--chevron-right] text-xl"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue"
import WallpaperCard from "@/components/WallpaperCard.vue"

interface WallpaperItem {
  id: number
  title?: string
  fileUrl: string
  thumbnailUrl?: string
  uploader?: {
    username: string
  }
  likeCount: number
  favoriteCount: number
  createdAt?: string
  isLiked?: boolean
  isFavorited?: boolean
  width?: number
  height?: number
  aspectRatio?: string
  category?: string
  viewCount?: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface EmptyAction {
  text: string
  handler: () => void
}

interface Props {
  title: string
  emptyTitle: string
  emptyDescription: string
  emptyAction?: EmptyAction
  showUploader?: boolean
  showActions?: boolean
  fetchFunction: (
    page: number,
    limit: number,
    search?: string,
  ) => Promise<{
    data: WallpaperItem[]
    pagination: Pagination
  }>
}

const props = withDefaults(defineProps<Props>(), {
  showUploader: true,
  showActions: true,
})

// 响应式数据
const wallpapers = ref<WallpaperItem[]>([])
const loading = ref(false)
const error = ref<string>("")

// 分页数据
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
})

// 计算可见的页码
const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.pages
  const pages: number[] = []

  // 显示当前页前后各2页
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i)
  }

  return pages
})

// 转换后端数据为前端组件期望的格式
const transformWallpaperData = (data: any): WallpaperItem => {
  return {
    id: data.id,
    title: data.title || `壁纸-${data.id}`,
    fileUrl: data.fileUrl,
    thumbnailUrl: data.thumbnailUrl,
    uploader: data.uploader ? { username: data.uploader.username } : undefined,
    likeCount: data.likeCount || 0,
    favoriteCount: data.favoriteCount || 0,
    createdAt: data.createdAt,
    isLiked: data.isLiked || false,
    isFavorited: data.isFavorited || false,
    width: data.width,
    height: data.height,
    aspectRatio: data.aspectRatio,
    category: data.category,
    viewCount: data.viewCount,
  }
}

// 获取数据
const fetchData = async (page: number = 1) => {
  try {
    loading.value = true
    error.value = ""

    const result = await props.fetchFunction(page, pagination.value.limit)
    // 转换数据格式
    wallpapers.value = result.data.map(transformWallpaperData)

    pagination.value = result.pagination
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取数据失败"
    console.error("获取壁纸列表失败:", err)
  } finally {
    loading.value = false
  }
}

// 搜索处理（防抖）
// 分页处理
const handlePageChange = (page: number) => {
  if (page < 1 || page > pagination.value.pages) return
  pagination.value.page = page
  fetchData(page)
}

// 页面加载时获取数据
onMounted(() => {
  fetchData()
})

// 监听分页变化
watch(
  () => pagination.value.page,
  (newPage) => {
    fetchData(newPage)
  },
)

// 暴露方法供父组件调用
defineExpose({
  refresh: () => fetchData(pagination.value.page),
})
</script>
