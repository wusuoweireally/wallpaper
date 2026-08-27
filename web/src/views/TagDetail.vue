<template>
  <div class="wb-page">
    <div class="wb-container-gallery py-5">
      <div v-if="loading" class="flex justify-center py-20">
        <span class="wb-spinner wb-spinner-lg text-muted"></span>
      </div>

      <div v-else-if="!tag" class="wb-empty">
        <p class="text-muted">标签不存在</p>
        <RouterLink to="/tags" class="wb-btn-primary mt-4">返回标签列表</RouterLink>
      </div>

      <div v-else>
        <header class="wb-page-head">
          <RouterLink to="/tags" class="text-xs text-muted hover:text-fg">← 全部标签</RouterLink>
          <h1 class="wb-page-title mt-1">{{ tag.name }}</h1>
          <p class="mt-0.5 text-xs text-muted">{{ getUsageCount(tag) }} 张相关壁纸</p>
        </header>

        <div v-if="relatedTags.length" class="mb-3 flex flex-wrap gap-2">
          <RouterLink
            v-for="relatedTag in relatedTags"
            :key="relatedTag.id"
            :to="`/tag/${relatedTag.id}`"
            class="wb-chip hover:border-primary/40 hover:text-primary"
          >
            {{ relatedTag.name }}
          </RouterLink>
        </div>

        <div class="mb-3 flex flex-wrap items-center gap-1.5">
          <select
            v-model="filters.category"
            class="wb-input h-8 w-28 py-0 text-xs"
            @change="applyFilters"
          >
            <option value="">全部分类</option>
            <option value="general">通用</option>
            <option value="anime">动漫</option>
            <option value="people">真人</option>
          </select>
          <select
            v-model="filters.sort"
            class="wb-input h-8 w-32 py-0 text-xs"
            @change="applyFilters"
          >
            <option value="latest">最新上传</option>
            <option value="popular">最受欢迎</option>
            <option value="random">随机</option>
          </select>
          <form class="wb-nav-search max-w-xs flex-1" @submit.prevent="applyFilters">
            <i class="i-[mdi--magnify] shrink-0 text-base text-faint" aria-hidden="true"></i>
            <input
              v-model="filters.search"
              type="search"
              placeholder="搜索…"
              class="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
            />
          </form>
        </div>

        <div v-if="wallpaperLoading" class="flex justify-center py-20">
          <span class="wb-spinner wb-spinner-lg text-muted"></span>
        </div>
        <div v-else-if="loadError" class="wb-empty">
          <p class="text-muted">壁纸加载失败，请稍后重试</p>
          <button class="wb-btn-primary mt-4" @click="retryLoad">重新加载</button>
        </div>
        <div v-else-if="wallpapers.length === 0" class="wb-empty">
          <p class="text-muted">暂无相关壁纸</p>
        </div>
        <div v-else>
          <WallpaperGrid :wallpapers="wallpapers" :show-pagination="false" masonry />
          <div v-if="pagination.pages > 1" class="mt-6 flex justify-center">
            <Pagination
              :current-page="pagination.page"
              :total-pages="pagination.pages"
              @change="changePage"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import tagService, { type Tag } from "@/services/tag"
import wallpaperService from "@/services/wallpaper"
import WallpaperGrid from "@/components/WallpaperGrid.vue"
import Pagination from "@/components/Pagination.vue"
import type { Wallpaper } from "@/services/wallpaper"

type TagUsage = Tag & { useCount?: number }

const route = useRoute()
const tag = ref<Tag | null>(null)
const relatedTags = ref<Tag[]>([])
const wallpapers = ref<Wallpaper[]>([])
const loading = ref(true)
const wallpaperLoading = ref(true)
const loadError = ref(false)
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })
/** 随机排序会话内种子：换筛选才重掷，翻页保持同一顺序 */
const newRandomSeed = () => Math.floor(Math.random() * 2 ** 31)
const randomSeed = ref(newRandomSeed())

type CategoryFilter = "" | "general" | "anime" | "people"

const filters = reactive<{ category: CategoryFilter; sort: string; search: string }>({
  category: "",
  sort: "latest",
  search: "",
})

const loadTag = async () => {
  const requestedId = route.params.id
  try {
    loading.value = true
    const response = await tagService.getTagById(Number(requestedId))
    // 慢响应守卫：期间已切到别的标签时丢弃，避免旧标签内容顶掉新页面
    if (requestedId !== route.params.id) return
    tag.value = response.data ?? null
  } catch (error) {
    console.error("加载标签详情失败:", error)
    if (requestedId === route.params.id) tag.value = null
  } finally {
    if (requestedId === route.params.id) loading.value = false
  }
}

const loadWallpapers = async () => {
  try {
    wallpaperLoading.value = true
    loadError.value = false
    // 随机排序带会话内固定种子：翻页顺序稳定，不重复/漏图
    const sortParams = (() => {
      switch (filters.sort) {
        case "popular":
          return { sortBy: "popular" as const }
        case "random":
          return { sortBy: "random" as const, seed: randomSeed.value }
        default:
          return { sortBy: "createdAt", sortOrder: "DESC" as const }
      }
    })()

    const response = await wallpaperService.getWallpapers({
      page: pagination.value.page,
      limit: pagination.value.limit,
      category: filters.category || undefined,
      search: filters.search || undefined,
      tags: tag.value ? [tag.value.name] : undefined,
      ...sortParams,
    })

    if (Array.isArray(response.data)) {
      wallpapers.value = response.data
    } else {
      wallpapers.value = []
    }

    if (response.pagination) {
      pagination.value = response.pagination
    }
  } catch (error) {
    console.error("加载壁纸列表失败:", error)
    loadError.value = true
  } finally {
    wallpaperLoading.value = false
  }
}

const loadRelatedTags = async () => {
  try {
    const response = await tagService.getTags({
      sortBy: "usageCount",
      sortOrder: "DESC",
    })
    const tagList = Array.isArray(response.data) ? response.data : []
    relatedTags.value = tagList.filter((t) => t.id !== tag.value?.id).slice(0, 10)
  } catch (error) {
    console.error("加载相关标签失败:", error)
  }
}

/** 筛选条件变化：回第 1 页再请求（随机排序重掷种子开新一轮） */
const applyFilters = () => {
  pagination.value.page = 1
  if (filters.sort === "random") randomSeed.value = newRandomSeed()
  loadWallpapers()
}

const changePage = (page: number) => {
  pagination.value.page = page
  loadWallpapers()
}

const retryLoad = () => {
  loadWallpapers()
}

const getUsageCount = (tag?: TagUsage | null) => tag?.usageCount ?? tag?.useCount ?? 0

const reloadForRoute = async () => {
  // 先清干净上一轮状态：否则新标签加载失败或请求在途时会残留旧标签的数据
  tag.value = null
  relatedTags.value = []
  wallpapers.value = []
  loadError.value = false
  pagination.value.page = 1
  randomSeed.value = newRandomSeed()
  await loadTag()
  if (tag.value) {
    await Promise.all([loadWallpapers(), loadRelatedTags()])
  }
}

onMounted(() => {
  void reloadForRoute()
})

// 同组件切换标签 id 时重新加载，避免残留旧数据
watch(
  () => route.params.id,
  (id, prev) => {
    if (id !== prev) void reloadForRoute()
  },
)
</script>
