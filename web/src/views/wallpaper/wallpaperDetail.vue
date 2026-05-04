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

    <div
      v-else
      class="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1400px] grid-cols-1 items-stretch gap-5 px-4 lg:grid-cols-[320px_1fr]"
    >
      <aside
        class="flex h-full flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800/90 dark:shadow-black/30"
      >
        <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
          <button
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
            @click="$router.back()"
            title="返回 (Esc)"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">
            壁纸 #{{ wallpaper.id }}
          </h2>
        </div>

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
            <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span class="text-xs text-slate-500 dark:text-slate-400">下载</span>
              <span class="font-semibold">{{ wallpaper.downloads }}</span>
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
            :src="`${wallpaper.imageUrl}?t=${wallpaper.updatedAt || wallpaper.id}`"
            class="h-full w-full cursor-zoom-in object-contain"
            @load="imageLoaded = true"
            @click="openLightbox"
          />
          <div
            v-if="!imageLoaded"
            class="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70"
          >
            <span class="loading loading-spinner loading-lg"></span>
          </div>
          <!-- 全屏按钮 -->
          <button
            class="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
            @click="openLightbox"
            title="全屏预览 (F)"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </button>
        </div>

        <!-- Lightbox 全屏预览 -->
        <Teleport to="body">
          <Transition
            enter-active-class="transition-opacity duration-200"
            leave-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <div
              v-if="lightboxVisible"
              class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
              @click.self="closeLightbox"
            >
              <button
                class="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                @click="closeLightbox"
                title="关闭 (Esc)"
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                :src="`${wallpaper.imageUrl}?t=${wallpaper.updatedAt || wallpaper.id}`"
                class="max-h-[95vh] max-w-[95vw] object-contain"
                @click.stop
              />
              <!-- 图片信息 -->
              <div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm text-white/80 backdrop-blur">
                {{ wallpaper.width }} × {{ wallpaper.height }} · {{ wallpaper.fileSize }} · {{ wallpaper.format || '未知' }}
              </div>
            </div>
          </Transition>
        </Teleport>
      </main>
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

    <!-- 相关推荐 -->
    <div v-if="relatedWallpapers.length > 0" class="mx-auto mt-8 max-w-[1400px] px-4">
      <h2 class="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
        相关推荐
      </h2>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <div
          v-for="item in relatedWallpapers"
          :key="item.id"
          class="group cursor-pointer overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
          @click="$router.push(`/wallpaper/${item.id}`)"
        >
          <div class="relative h-36 overflow-hidden">
            <img
              :src="`${item.thumbnailUrl || item.fileUrl}?t=${item.updatedAt || item.id}`"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div class="flex items-center justify-between px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{{ item.width }}×{{ item.height }}</span>
            <span class="inline-flex items-center gap-1">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C4.099 3.75 2 5.765 2 8.25c0 7.22 8 12 8 12s8-4.78 8-12Z" />
              </svg>
              {{ item.likeCount }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { wallpaperService } from "@/services/wallpaper"
import { useUserStore } from "@/stores/user"
import { useGlobalToast } from "@/composables/useToast"

interface WallpaperDetail {
  id: number
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
  downloads: number
  resolutions: string[]
}

const route = useRoute()
const router = useRouter()
const wallpaperId = computed(() => Number(route.params.id))
const userStore = useUserStore()
const toast = useGlobalToast()
const imageLoaded = ref(false)
const isLiked = ref(false)
const isFavorited = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const detailTimeoutId = ref<NodeJS.Timeout | null>(null)
const shareNotice = ref("")
const liking = ref(false)
const favoriting = ref(false)
const downloading = ref(false)
const lightboxVisible = ref(false)
const showBackToTop = ref(false)
const relatedWallpapers = ref<Array<{
  id: number
  fileUrl: string
  thumbnailUrl?: string
  width: number
  height: number
  likeCount: number
  category: string
}>>([])

const wallpaper = ref<WallpaperDetail>({
  id: 0,
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
  downloads: 0,
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
  window.addEventListener("keydown", handleKeydown)
  window.addEventListener("scroll", handleScroll, { passive: true })
})

// 监听路由变化，点击推荐壁纸时重新加载
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      imageLoaded.value = false
      lightboxVisible.value = false
      showBackToTop.value = false
      relatedWallpapers.value = []
      shareNotice.value = ""
      fetchWallpaperDetail()
      window.scrollTo({ top: 0 })
    }
  },
)

const fetchWallpaperDetail = async () => {
  loading.value = true
  error.value = null

  try {
    const id = wallpaperId.value
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
      category: wallpaperResponse.data.category || "general",
      format:
        wallpaperResponse.data.format ||
        wallpaperResponse.data.fileUrl?.split(".").pop()?.toUpperCase() ||
        "",
      imageUrl: wallpaperResponse.data.fileUrl,
      width: wallpaperResponse.data.width,
      height: wallpaperResponse.data.height,
      fileSize: `${(wallpaperResponse.data.fileSize / 1024 / 1024).toFixed(2)} MB`,
      tags: tagsResponse.success ? tagsResponse.data.map((tag: { name: string }) => tag.name) : [],
      uploader: {
        id: wallpaperResponse.data.uploaderId,
        name: wallpaperResponse.data.uploader?.username || "未知用户",
        avatar: wallpaperResponse.data.uploader?.avatarUrl || "",
      },
      uploadDate: new Date(wallpaperResponse.data.createdAt).toLocaleDateString(),
      likes: wallpaperResponse.data.likeCount,
      favorites: wallpaperResponse.data.favoriteCount,
      downloads: wallpaperResponse.data.downloadCount || 0,
      resolutions: [`${wallpaperResponse.data.width}x${wallpaperResponse.data.height}`],
    }

    isLiked.value = wallpaperResponse.data.isLiked || false
    isFavorited.value = wallpaperResponse.data.isFavorited || false

    // 异步加载相关推荐（不阻塞主流程）
    wallpaperService.getRelatedWallpapers(id, 8).then((res) => {
      if (res.success && res.data) {
        relatedWallpapers.value = res.data
      }
    }).catch(() => {})

  } catch (err: unknown) {
    const errObj = err as Error & { message?: string; name?: string; isCancelled?: boolean }
    console.error("获取壁纸详情失败:", errObj)
    if (
      errObj.message === "请求已取消" ||
      errObj.name === "REQUEST_CANCELLED" ||
      errObj.isCancelled
    ) {
      return
    }
    error.value = errObj instanceof Error ? errObj.message : "获取壁纸详情失败"
  } finally {
    loading.value = false
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    toast.warning("请先登录后再点赞")
    return
  }
  if (liking.value) return

  const id = wallpaperId.value
  if (isNaN(id)) return

  const previousLiked = isLiked.value
  const previousLikes = wallpaper.value.likes
  const shouldLike = !previousLiked
  isLiked.value = shouldLike
  wallpaper.value.likes += shouldLike ? 1 : -1
  liking.value = true

  try {
    if (shouldLike) {
      await wallpaperService.likeWallpaper(id)
    } else {
      await wallpaperService.unlikeWallpaper(id)
    }
  } catch (err: unknown) {
    isLiked.value = previousLiked
    wallpaper.value.likes = previousLikes
    const errObj = err as Error & { response?: { status?: number } }
    if (errObj.response?.status === 401) {
      toast.error("登录已过期，请重新登录")
    } else {
      toast.error("点赞失败，请稍后重试")
    }
  } finally {
    liking.value = false
  }
}

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    toast.warning("请先登录后再收藏")
    return
  }
  if (favoriting.value) return

  const id = wallpaperId.value
  if (isNaN(id)) return

  const previousFavorited = isFavorited.value
  const previousFavorites = wallpaper.value.favorites
  const shouldFavorite = !previousFavorited
  isFavorited.value = shouldFavorite
  wallpaper.value.favorites += shouldFavorite ? 1 : -1
  favoriting.value = true

  try {
    if (shouldFavorite) {
      await wallpaperService.favoriteWallpaper(id)
    } else {
      await wallpaperService.unfavoriteWallpaper(id)
    }
  } catch (err: unknown) {
    isFavorited.value = previousFavorited
    wallpaper.value.favorites = previousFavorites
    const errObj = err as Error & { response?: { status?: number } }
    if (errObj.response?.status === 401) {
      toast.error("登录已过期，请重新登录")
    } else {
      toast.error("收藏失败，请稍后重试")
    }
  } finally {
    favoriting.value = false
  }
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = "/uploads/profile-pictures/defaultAvatar.png"
  img.onerror = null
}

const openLightbox = () => {
  lightboxVisible.value = true
  document.body.style.overflow = "hidden"
}

const closeLightbox = () => {
  lightboxVisible.value = false
  document.body.style.overflow = ""
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    if (lightboxVisible.value) {
      closeLightbox()
    } else {
      window.history.back()
    }
    return
  }
  if (e.key === "f" || e.key === "F") {
    if (!lightboxVisible.value && !e.ctrlKey && !e.metaKey) {
      const target = e.target as HTMLElement
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        e.preventDefault()
        openLightbox()
      }
    }
  }
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" })
}

const pushShareNotice = (message: string) => {
  shareNotice.value = message
  window.setTimeout(() => {
    shareNotice.value = ""
  }, 2500)
}

const downloadWallpaper = async () => {
  if (!wallpaper.value.imageUrl || downloading.value) return

  downloading.value = true
  try {
    const id = wallpaperId.value
    if (!isNaN(id)) {
      await wallpaperService.recordDownload(id)
    }
  } catch {
    // 下载计数失败不影响下载本身
  }

  const fileName = `wallpaper-${wallpaper.value.id}`
  const link = document.createElement("a")
  link.href = wallpaper.value.imageUrl
  link.download = fileName
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  link.remove()
  pushShareNotice("开始下载壁纸")
  downloading.value = false
}

onUnmounted(() => {
  if (detailTimeoutId.value) {
    clearTimeout(detailTimeoutId.value)
    detailTimeoutId.value = null
  }
  loading.value = false
  window.removeEventListener("keydown", handleKeydown)
  window.removeEventListener("scroll", handleScroll)
  document.body.style.overflow = ""
})
</script>
