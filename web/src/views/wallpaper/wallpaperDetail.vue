<template>
  <div class="min-h-screen bg-slate-50 py-6 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="error" class="flex justify-center px-4 py-12">
      <div
        class="inline-flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
      >
        <svg
          class="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m0 3a.375.375 0 1 1 0 .75.375.375 0 0 1 0-.75ZM10.5 3.75h3L21 18.75H3L10.5 3.75Z"
          />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>

    <div v-else class="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1400px] grid-cols-1 items-stretch gap-5 px-4 lg:grid-cols-[320px_1fr]">
      <aside
        class="flex h-full flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800/90 dark:shadow-black/30"
      >
        <div
          class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50"
        >
          <h3 class="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-300">标签</h3>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="tag in wallpaper.tags"
              :key="tag"
              class="rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800 dark:border-sky-800 dark:bg-sky-900/40 dark:text-sky-100"
            >
              {{ tag }}
            </span>
            <span
              v-if="wallpaper.tags.length === 0"
              class="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              暂无标签
            </span>
          </div>
        </div>

        <div
          class="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50"
        >
          <h3 class="text-sm font-bold tracking-wide text-slate-500 dark:text-slate-300">上传者</h3>
          <div class="flex items-center gap-3">
            <div
              class="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
            >
              <img
                :src="wallpaper.uploader.avatar"
                :alt="wallpaper.uploader.name"
                @error="handleAvatarError"
                class="h-full w-full object-cover"
              />
            </div>
            <div>
              <p class="font-semibold">{{ wallpaper.uploader.name }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ wallpaper.uploadDate }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span class="text-xs text-slate-500 dark:text-slate-400">分类</span>
              <span class="font-semibold">{{ categoryLabel }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span class="text-xs text-slate-500 dark:text-slate-400">点赞</span>
              <span class="font-semibold">{{ wallpaper.likes }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span class="text-xs text-slate-500 dark:text-slate-400">收藏</span>
              <span class="font-semibold">{{ wallpaper.favorites }}</span>
            </div>
          </div>
        </div>

        <div
          class="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50"
        >
          <button
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-gradient-to-r from-emerald-400 to-cyan-300 px-3 py-2 font-semibold text-slate-900 shadow-lg shadow-emerald-200/50"
            :class="{ 'opacity-90 ring-2 ring-emerald-300': isLiked }"
            @click="handleLike"
          >
            <svg
              class="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C4.099 3.75 2 5.765 2 8.25c0 7.22 8 12 8 12s8-4.78 8-12Z"
              />
            </svg>
            {{ isLiked ? "已点赞" : "点赞" }}
          </button>
          <button
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-gradient-to-r from-amber-300 to-orange-400 px-3 py-2 font-semibold text-slate-900 shadow-lg shadow-amber-200/50"
            :class="{ 'opacity-90 ring-2 ring-amber-300': isFavorited }"
            @click="handleFavorite"
          >
            <svg
              class="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m11.48 3.499-2.27 4.61a.75.75 0 0 1-.564.41l-5.067.736c-.613.089-.857.843-.414 1.276l3.664 3.57a.75.75 0 0 1 .216.664l-.864 5.04c-.105.616.54 1.088 1.09.797l4.52-2.377a.75.75 0 0 1 .698 0l4.52 2.377c.55.29 1.195-.18 1.09-.798l-.864-5.039a.75.75 0 0 1 .216-.663l3.664-3.57c.443-.433.199-1.187-.414-1.276l-5.067-.737a.75.75 0 0 1-.564-.409l-2.27-4.611a.75.75 0 0 0-1.354 0Z"
              />
            </svg>
            {{ isFavorited ? "已收藏" : "收藏" }}
          </button>
          <button
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            @click="downloadWallpaper"
          >
            <svg
              class="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 3v12m0 0 3.75-3.75M12 15 8.25 11.25M4.5 15.75V18A2.25 2.25 0 0 0 6.75 20.25h10.5A2.25 2.25 0 0 0 19.5 18v-2.25"
              />
            </svg>
            下载
          </button>
          <p v-if="shareNotice" class="text-sm font-semibold text-emerald-500">
            {{ shareNotice }}
          </p>
        </div>
      </aside>

      <main
        class="flex h-full flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800/90 dark:shadow-black/30"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {{ wallpaper.width }} × {{ wallpaper.height }} px · {{ wallpaper.fileSize }} ·
            {{ wallpaper.format || "未知格式" }}
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="resolution in wallpaper.resolutions"
              :key="resolution"
              class="rounded-full border border-cyan-200 bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-100"
            >
              {{ resolution }}
            </span>
          </div>
        </div>
        <div
          class="relative w-full flex-1 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900"
        >
          <img
            :src="wallpaper.imageUrl"
            class="h-full w-full object-contain"
            @load="imageLoaded = true"
          />
          <div
            v-if="!imageLoaded"
            class="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70"
          >
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"
import { wallpaperService } from "@/services/wallpaper"
import { useUserStore } from "@/stores"
import { useGlobalToast } from "@/composables/useToast"

interface WallpaperDetail {
  id: number
  title: string
  description: string
  category: "general" | "anime" | "people"
  format?: string
  imageUrl: string
  width: number
  height: number
  fileSize: string
  tags: string[]
  uploader: {
    id: number
    name: string
    avatar: string
  }
  uploadDate: string
  likes: number
  favorites: number
  resolutions: string[]
}

const route = useRoute()
const wallpaperId = route.params.id
const userStore = useUserStore()
const toast = useGlobalToast()
const imageLoaded = ref(false)
const isLiked = ref(false)
const isFavorited = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const detailTimeoutId = ref<NodeJS.Timeout | null>(null)
const shareNotice = ref("")

const wallpaper = ref<WallpaperDetail>({
  id: 0,
  title: "",
  description: "",
  category: "general",
  format: "",
  imageUrl: "",
  width: 0,
  height: 0,
  fileSize: "",
  tags: [],
  uploader: {
    id: 0,
    name: "",
    avatar: "",
  },
  uploadDate: "",
  likes: 0,
  favorites: 0,
  resolutions: [],
})

const categoryLabelMap = {
  general: "通用",
  anime: "动漫",
  people: "人物",
} as const

const categoryLabel = computed(() => categoryLabelMap[wallpaper.value.category] || "其他")

onMounted(() => {
  fetchWallpaperDetail()
})

const fetchWallpaperDetail = async () => {
  loading.value = true
  error.value = null

  try {
    const id = Number(wallpaperId)
    if (isNaN(id)) {
      throw new Error("无效的壁纸ID")
    }

    const [wallpaperResponse, tagsResponse] = await Promise.all([
      wallpaperService.getWallpaperDetail(id),
      wallpaperService.getWallpaperTags(id),
    ])

    if (!wallpaperResponse.success) {
      throw new Error(wallpaperResponse.message || "获取壁纸详情失败")
    }

    wallpaper.value = {
      id: wallpaperResponse.data.id,
      title: wallpaperResponse.data.title || "",
      description: wallpaperResponse.data.description || "",
      category: wallpaperResponse.data.category || "general",
      format:
        wallpaperResponse.data.format ||
        wallpaperResponse.data.fileUrl?.split(".").pop()?.toUpperCase() ||
        "",
      imageUrl: wallpaperResponse.data.fileUrl,
      width: wallpaperResponse.data.width,
      height: wallpaperResponse.data.height,
      fileSize: `${(wallpaperResponse.data.fileSize / 1024 / 1024).toFixed(2)} MB`,
      tags: tagsResponse.success ? tagsResponse.data.map((tag: any) => tag.name) : [],
      uploader: {
        id: wallpaperResponse.data.uploaderId,
        name: wallpaperResponse.data.uploader?.username || "未知用户",
        avatar: wallpaperResponse.data.uploader?.avatarUrl || "",
      },
      uploadDate: new Date(wallpaperResponse.data.createdAt).toLocaleDateString(),
      likes: wallpaperResponse.data.likeCount,
      favorites: wallpaperResponse.data.favoriteCount,
      resolutions: [`${wallpaperResponse.data.width}x${wallpaperResponse.data.height}`],
    }

    isLiked.value = wallpaperResponse.data.isLiked || false
    isFavorited.value = wallpaperResponse.data.isFavorited || false
  } catch (err: any) {
    console.error("获取壁纸详情失败:", err)
    if (err.message === "请求已取消" || err.name === "REQUEST_CANCELLED" || err.isCancelled) {
      return
    }
    error.value = err instanceof Error ? err.message : "获取壁纸详情失败"
  } finally {
    loading.value = false
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    toast.warning("请先登录后再点赞")
    return
  }

  const id = Number(wallpaperId)
  if (isNaN(id)) {
    console.error("无效的壁纸ID")
    return
  }

  const previousLiked = isLiked.value
  const previousLikes = wallpaper.value.likes
  const shouldLike = !previousLiked
  isLiked.value = shouldLike
  wallpaper.value.likes += shouldLike ? 1 : -1

  try {
    if (shouldLike) {
      await wallpaperService.likeWallpaper(id)
    } else {
      await wallpaperService.unlikeWallpaper(id)
    }
  } catch (err: any) {
    isLiked.value = previousLiked
    wallpaper.value.likes = previousLikes
    if (err.response?.status === 401) {
      toast.error("登录已过期，请重新登录")
    } else {
      const errorMessage = err.response?.data?.message || err.message || "操作失败，请稍后重试"
      console.error("点赞操作失败:", errorMessage)
      toast.error(errorMessage)
    }
  }
}

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    toast.warning("请先登录后再收藏")
    return
  }

  const id = Number(wallpaperId)
  if (isNaN(id)) {
    console.error("无效的壁纸ID")
    return
  }

  const previousFavorited = isFavorited.value
  const previousFavorites = wallpaper.value.favorites
  const shouldFavorite = !previousFavorited
  isFavorited.value = shouldFavorite
  wallpaper.value.favorites += shouldFavorite ? 1 : -1

  try {
    if (shouldFavorite) {
      await wallpaperService.favoriteWallpaper(id)
    } else {
      await wallpaperService.unfavoriteWallpaper(id)
    }
  } catch (err: any) {
    isFavorited.value = previousFavorited
    wallpaper.value.favorites = previousFavorites
    if (err.response?.status === 401) {
      toast.error("登录已过期，请重新登录")
    } else {
      const errorMessage = err.response?.data?.message || err.message || "操作失败，请稍后重试"
      console.error("收藏操作失败:", errorMessage)
      toast.error(errorMessage)
    }
  }
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = "/uploads/profile-pictures/defaultAvatar.png"
  img.onerror = null
}

const pushShareNotice = (message: string) => {
  shareNotice.value = message
  window.setTimeout(() => {
    shareNotice.value = ""
  }, 2500)
}

const downloadWallpaper = () => {
  if (!wallpaper.value.imageUrl) {
    pushShareNotice("图片链接无效，无法下载")
    return
  }
  const fileName = `${wallpaper.value.title || "wallpaper"}-${wallpaper.value.id}`
  const link = document.createElement("a")
  link.href = wallpaper.value.imageUrl
  link.download = fileName
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  link.remove()
  pushShareNotice("开始下载壁纸")
}

onUnmounted(() => {
  if (detailTimeoutId.value) {
    clearTimeout(detailTimeoutId.value)
    detailTimeoutId.value = null
  }
  loading.value = false
})
</script>
