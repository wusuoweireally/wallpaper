<template>
  <div class="min-h-screen bg-base-200">
    <!-- 顶部横幅 -->
    <div class="hero bg-gradient-to-r from-primary to-secondary text-white">
      <div class="hero-content text-center">
        <div class="max-w-2xl">
          <h1 class="mb-4 text-5xl font-bold">🏷️ {{ tag?.name || "标签" }}</h1>
          <p v-if="tag" class="mb-6 text-xl">共有 {{ getUsageCount(tag) }} 张相关壁纸</p>
          <RouterLink to="/tags" class="btn btn-outline text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回标签列表
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="!tag" class="py-20 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mx-auto h-20 w-20 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="mt-4 text-gray-500">标签不存在</p>
        <RouterLink to="/tags" class="btn btn-primary mt-4">返回标签列表</RouterLink>
      </div>

      <div v-else>
        <!-- 相关标签 -->
        <div class="mb-6">
          <h2 class="mb-3 text-xl font-bold">相关标签</h2>
          <div class="flex flex-wrap gap-2">
            <RouterLink
              v-for="relatedTag in relatedTags"
              :key="relatedTag.id"
              :to="`/tag/${relatedTag.id}`"
              class="badge badge-outline badge-lg transition-colors hover:badge-primary"
            >
              {{ relatedTag.name }} ({{ getUsageCount(relatedTag) }})
            </RouterLink>
          </div>
        </div>

        <!-- 筛选器 -->
        <div class="card mb-6 bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex flex-wrap gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">分类</span>
                </label>
                <select
                  v-model="filters.category"
                  class="select-bordered select"
                  @change="loadWallpapers"
                >
                  <option value="">全部</option>
                  <option value="general">通用</option>
                  <option value="anime">动漫</option>
                  <option value="people">人物</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">排序</span>
                </label>
                <select
                  v-model="filters.sort"
                  class="select-bordered select"
                  @change="loadWallpapers"
                >
                  <option value="latest">最新上传</option>
                  <option value="popular">最受欢迎</option>
                  <option value="random">随机</option>
                </select>
              </div>

              <div class="form-control min-w-[200px] flex-1">
                <label class="label">
                  <span class="label-text">搜索</span>
                </label>
                <input
                  v-model="filters.search"
                  type="text"
                  placeholder="搜索壁纸标题..."
                  class="input-bordered input"
                  @keyup.enter="loadWallpapers"
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">&nbsp;</span>
                </label>
                <button class="btn btn-primary" @click="loadWallpapers">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  搜索
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 壁纸网格 -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body p-0">
            <div v-if="wallpaperLoading" class="flex items-center justify-center py-20">
              <span class="loading loading-spinner loading-lg"></span>
            </div>

            <div v-else-if="wallpapers.length === 0" class="py-20 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="mx-auto h-20 w-20 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p class="mt-4 text-gray-500">暂无相关壁纸</p>
            </div>

            <div v-else>
              <!-- 桌面端网格 -->
              <div class="hidden p-6 lg:block">
                <WallpaperGrid :wallpapers="wallpapers" />
              </div>

              <!-- 移动端列表 -->
              <div class="lg:hidden">
                <div
                  v-for="wallpaper in wallpapers"
                  :key="wallpaper.id"
                  class="border-b border-base-300 p-4"
                >
                  <div class="flex gap-3">
                    <img
                      :src="`${wallpaper.thumbnailUrl || wallpaper.fileUrl}?t=${wallpaper.updatedAt || wallpaper.id}`"
                      :alt="`壁纸 #${wallpaper.id}`"
                      class="h-20 w-20 cursor-pointer rounded object-cover"
                      @click="goToWallpaperDetail(wallpaper.id)"
                    />
                    <div class="flex-1">
                      <h3 class="text-sm font-bold">
                        壁纸 #{{ wallpaper.id }}
                      </h3>
                      <p class="mt-1 text-xs text-gray-500">
                        作者: {{ wallpaper.uploader?.username || "未知用户" }}
                      </p>
                      <p class="mt-1 text-xs text-gray-500">
                        {{ wallpaper.viewCount }} 浏览 • {{ wallpaper.likeCount }} 点赞
                      </p>
                      <button
                        class="btn btn-primary btn-xs mt-2"
                        @click="goToWallpaperDetail(wallpaper.id)"
                      >
                        查看详情
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分页 -->
              <div v-if="pagination.pages > 1" class="p-4">
                <div class="flex justify-center join">
                  <button
                    class="btn join-item"
                    :disabled="pagination.page === 1"
                    @click="changePage(pagination.page - 1)"
                  >
                    上一页
                  </button>
                  <button class="btn join-item" disabled>
                    第 {{ pagination.page }} / {{ pagination.pages }} 页
                  </button>
                  <button
                    class="btn join-item"
                    :disabled="pagination.page === pagination.pages"
                    @click="changePage(pagination.page + 1)"
                  >
                    下一页
                  </button>
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
import { ref, reactive, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import tagService, { type Tag } from "@/services/tag"
import wallpaperService from "@/services/wallpaper"
import WallpaperGrid from "@/components/WallpaperGrid.vue"
import type { Wallpaper } from "@/services/wallpaper"

type TagUsage = Tag & { useCount?: number }

const route = useRoute()
const router = useRouter()
const tag = ref<Tag | null>(null)
const relatedTags = ref<Tag[]>([])
const wallpapers = ref<Wallpaper[]>([])
const loading = ref(true)
const wallpaperLoading = ref(true)
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })

type CategoryFilter = "" | "general" | "anime" | "people"

const filters = reactive<{ category: CategoryFilter; sort: string; search: string }>({
  category: "",
  sort: "latest",
  search: "",
})

const loadTag = async () => {
  try {
    loading.value = true
    const response = await tagService.getTagById(Number(route.params.id))
    tag.value = response.data ?? null
  } catch (error) {
    console.error("加载标签详情失败:", error)
  } finally {
    loading.value = false
  }
}

const loadWallpapers = async () => {
  try {
    wallpaperLoading.value = true
    const sortParams = (() => {
      switch (filters.sort) {
        case "popular":
          return { sortBy: "popular" as const }
        case "random":
          return { sortBy: "random" as const }
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

const changePage = (page: number) => {
  pagination.value.page = page
  loadWallpapers()
}

const goToWallpaperDetail = (id: number) => {
  router.push(`/wallpaper/${id}`)
}

const getUsageCount = (tag?: TagUsage | null) => tag?.usageCount ?? tag?.useCount ?? 0

onMounted(async () => {
  await loadTag()
  if (tag.value) {
    await loadWallpapers()
    await loadRelatedTags()
  }
})
</script>
