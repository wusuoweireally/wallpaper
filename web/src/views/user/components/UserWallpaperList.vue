<template>
  <div class="space-y-8">
    <!-- 页面标题和统计 -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-3xl font-bold text-slate-900">{{ config.title }}</h2>
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
          <h3 class="text-2xl font-semibold text-slate-700">{{ config.emptyTitle }}</h3>
          <p class="mt-3 text-slate-500">{{ config.emptyDescription }}</p>
        </div>
        <button
          class="group mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 px-8 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] hover:shadow-xl"
          @click="router.push(config.emptyRoute)"
        >
          {{ config.emptyText }}
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
        @click="goToWallpaper(wallpaper.id)"
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
import { useRouter } from "vue-router"
import WallpaperCard from "@/components/WallpaperCard.vue"
import { useUserStore } from "@/stores/user"
import type { Wallpaper } from "@/services/wallpaper"

type ListType = "uploads" | "favorites" | "likes"

const props = defineProps<{ type: ListType }>()

const router = useRouter()
const userStore = useUserStore()

// 各列表的标题与空状态文案
const TYPE_CONFIG: Record<
  ListType,
  { title: string; emptyTitle: string; emptyDescription: string; emptyText: string; emptyRoute: string }
> = {
  uploads: {
    title: "我的上传",
    emptyTitle: "暂无上传的壁纸",
    emptyDescription: "开始分享你的精彩壁纸吧",
    emptyText: "开始上传",
    emptyRoute: "/upload",
  },
  favorites: {
    title: "我的收藏",
    emptyTitle: "暂无收藏的壁纸",
    emptyDescription: "收藏你喜欢的壁纸，方便随时查看",
    emptyText: "去发现壁纸",
    emptyRoute: "/latest",
  },
  likes: {
    title: "我的点赞",
    emptyTitle: "暂无点赞的壁纸",
    emptyDescription: "为你喜欢的壁纸点赞，支持创作者",
    emptyText: "去发现壁纸",
    emptyRoute: "/wallpapers",
  },
}

const config = computed(() => TYPE_CONFIG[props.type])

const wallpapers = ref<Wallpaper[]>([])
const loading = ref(false)
const error = ref<string>("")
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })

// 计算可见的页码：当前页前后各 2 页
const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.pages
  const pages: number[] = []
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i)
  }
  return pages
})

const fetchData = async (page: number = 1) => {
  try {
    loading.value = true
    error.value = ""
    const result = await userStore.fetchUserWallpapers(props.type, page, pagination.value.limit)
    wallpapers.value = result?.data || []
    pagination.value = result?.pagination || { page, limit: pagination.value.limit, total: 0, pages: 0 }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取数据失败"
    console.error("获取壁纸列表失败:", err)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > pagination.value.pages) return
  pagination.value.page = page
  fetchData(page)
}

const goToWallpaper = (id: number) => {
  router.push(`/wallpaper/${id}`)
}

onMounted(() => {
  fetchData()
})

watch(
  () => pagination.value.page,
  (newPage) => {
    fetchData(newPage)
  },
)
</script>
