<template>
  <div
    class="group relative flex flex-col overflow-visible rounded-[1rem] border border-slate-200/60 bg-white/90 shadow-[0_24px_45px_rgba(15,23,42,0.12)] transition hover:-translate-y-1 hover:shadow-[0_30px_55px_rgba(15,23,42,0.18)] dark:border-slate-700/60 dark:bg-slate-800/90 dark:shadow-[0_24px_45px_rgba(0,0,0,0.35)]"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Hover 预览浮层 -->
    <Teleport to="body">
      <transition name="preview-fade">
        <div
          v-if="showPreview && previewReady"
          ref="previewEl"
          class="pointer-events-none fixed z-[9999] w-80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/30 dark:border-slate-600/80 dark:bg-slate-800 dark:shadow-black/50"
          :style="previewStyle"
          @mouseenter="keepPreview"
          @mouseleave="hidePreview"
        >
          <div class="relative">
            <img
              :src="`${wallpaper.fileUrl}?t=${wallpaper.updatedAt || wallpaper.id}`"
              class="h-48 w-full object-cover"
              loading="lazy"
              :alt="wallpaper.title || `壁纸 ${wallpaper.id}`"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          </div>
          <div class="space-y-3 p-4">
            <h3 v-if="wallpaper.title" class="line-clamp-1 text-sm font-bold text-slate-800 dark:text-slate-100">
              {{ wallpaper.title }}
            </h3>
            <p v-if="wallpaper.description" class="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
              {{ wallpaper.description }}
            </p>
            <div v-if="wallpaper.tags?.length" class="flex flex-wrap gap-1">
              <span
                v-for="tag in wallpaper.tags.slice(0, 4)"
                :key="tag.id"
                class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              >
                #{{ tag.name }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span class="inline-flex items-center gap-1">
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                  {{ likeCount }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                  {{ favoriteCount }}
                </span>
              </div>
              <button
                class="pointer-events-auto rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-md transition hover:scale-105 hover:shadow-lg"
                @click.stop="router.push(`/wallpaper/${wallpaper.id}`)"
              >
                查看详情
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
    <figure class="relative h-56 w-full overflow-hidden">
      <img
        :src="`${wallpaper.thumbnailUrl || wallpaper.fileUrl}?t=${wallpaper.updatedAt || wallpaper.id}`"
        class="h-full w-full object-cover"
        loading="lazy"
        :alt="`壁纸 ${wallpaper.id}`"
        @load="handleImageLoad"
        @error="handleImageError"
      />

      <div
        v-if="!imageLoaded && !imageError"
        class="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-950"
      ></div>
      <div
        v-if="imageError"
        class="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900"
      >
        <i class="i-mdi-image-off text-4xl text-slate-400 dark:text-slate-500"></i>
      </div>
      <div
        class="absolute inset-0 bg-gradient-to-t from-emerald-500/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100"
      ></div>
      <div
        v-if="showActions"
        class="pointer-events-none absolute inset-0 flex items-start justify-end p-4"
      >
        <div class="flex gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            class="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:-translate-y-0.5 hover:bg-slate-900"
            :class="{ 'text-red-300': isLiked }"
            :disabled="liking"
            @click.stop="handleLike"
            title="点赞"
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
                d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0-4.145-6.3H7.5a2.25 2.25 0 0 0-2.25 2.25c0 1.152.388 1.923.439 2.028M6.633 10.5H5.25A2.25 2.25 0 0 0 3 12.75v6A2.25 2.25 0 0 0 5.25 21h1.5A2.25 2.25 0 0 0 9 18.75v-6a2.25 2.25 0 0 0-2.367-2.25ZM14.25 6.75h2.819a2.25 2.25 0 0 1 2.206 2.709l-1.194 5.217A3 3 0 0 1 15.14 18H12"
              />
            </svg>
          </button>
          <button
            class="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:-translate-y-0.5 hover:bg-slate-900"
            :class="{ 'text-yellow-200': isFavorited }"
            :disabled="favoriting"
            @click.stop="handleFavorite"
            title="收藏"
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
                d="m11.48 3.499-2.27 4.61a.75.75 0 0 1-.564.41l-5.067.736c-.613.089-.857.843-.414 1.276l3.664 3.57a.75.75 0 0 1 .216.664l-.864 5.04c-.105.616.54 1.088 1.09.797l4.52-2.377a.75.75 0 0 1 .698 0l4.52 2.377c.55.29 1.195-.18 1.09-.798l-.864-5.039a.75.75 0 0 1 .216-.663l3.664-3.57c.443-.433.199-1.187-.414-1.276l-5.067-.737a.75.75 0 0 1-.564-.409l-2.27-4.611a.75.75 0 0 0-1.354 0Z"
              />
            </svg>
          </button>
        </div>
      </div>
    </figure>

    <div
      class="flex items-center justify-between gap-2 border border-slate-200/60 bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    >
      <div class="flex items-center gap-1.5">
        <span
          class="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          :class="{
            'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300': wallpaper.category === 'general',
            'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300': wallpaper.category === 'anime',
            'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300': wallpaper.category === 'people',
          }"
        >
          {{ { general: '通用', anime: '动漫', people: '人物' }[wallpaper.category] || '其他' }}
        </span>
        <span class="text-slate-400 dark:text-slate-500">{{ wallpaper.width }}×{{ wallpaper.height }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1">
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          {{ wallpaper.viewCount || 0 }}
        </span>
        <span class="inline-flex items-center gap-1">
          <svg
            class="h-3 w-3"
            :class="isLiked ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-current'"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {{ likeCount }}
        </span>
        <span class="inline-flex items-center gap-1">
          <svg
            class="h-3 w-3"
            :class="isFavorited ? 'fill-amber-400 stroke-amber-400' : 'fill-none stroke-current'"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
        {{ favoriteCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue"
import { useRouter } from "vue-router"
import type { Wallpaper } from "@/services/wallpaper"
import { wallpaperService } from "@/services/wallpaper"
import { useUserStore } from "@/stores/user"
import { useGlobalToast } from "@/composables/useToast"

interface Props {
  wallpaper: Wallpaper
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
})

const router = useRouter()
const userStore = useUserStore()
const toast = useGlobalToast()

const imageLoaded = ref(false)
const imageError = ref(false)
const showPreview = ref(false)
const previewReady = ref(false)
const previewEl = ref<HTMLElement | null>(null)
let hoverTimer: ReturnType<typeof setTimeout> | null = null
let leaveTimer: ReturnType<typeof setTimeout> | null = null
const previewPosition = ref({ x: 0, y: 0 })
const cardEl = ref<HTMLElement | null>(null)
const likeCount = ref(props.wallpaper.likeCount || 0)
const favoriteCount = ref(props.wallpaper.favoriteCount || 0)
const isLiked = ref(Boolean(props.wallpaper.isLiked))
const isFavorited = ref(Boolean(props.wallpaper.isFavorited))
const liking = ref(false)
const favoriting = ref(false)

const handleCardClick = () => {
  router.push(`/wallpaper/${props.wallpaper.id}`)
}

const syncState = (wallpaper: Wallpaper) => {
  likeCount.value = wallpaper.likeCount || 0
  favoriteCount.value = wallpaper.favoriteCount || 0
  isLiked.value = Boolean(wallpaper.isLiked)
  isFavorited.value = Boolean(wallpaper.isFavorited)
}

watch(
  () => props.wallpaper,
  (newWallpaper) => {
    if (newWallpaper) {
      syncState(newWallpaper)
    }
  },
)
syncState(props.wallpaper)

const ensureAuth = () => {
  if (userStore.isLoggedIn) {
    return true
  }
  router.push("/auth/login")
  return false
}

const handleLike = async () => {
  if (!ensureAuth() || liking.value) {
    return
  }

  // 保存原始状态，用于失败时恢复
  const originalIsLiked = isLiked.value
  const originalLikeCount = likeCount.value

  liking.value = true
  try {
    if (isLiked.value) {
      await wallpaperService.unlikeWallpaper(props.wallpaper.id)
      isLiked.value = false
      likeCount.value = Math.max(0, likeCount.value - 1)
    } else {
      await wallpaperService.likeWallpaper(props.wallpaper.id)
      isLiked.value = true
      likeCount.value += 1
    }
  } catch (error) {
    console.error("点赞壁纸失败:", error)
    // 恢复原始状态
    isLiked.value = originalIsLiked
    likeCount.value = originalLikeCount
    toast.error("点赞失败，请稍后重试")
  } finally {
    liking.value = false
  }
}

const handleFavorite = async () => {
  if (!ensureAuth() || favoriting.value) {
    return
  }

  // 保存原始状态，用于失败时恢复
  const originalIsFavorited = isFavorited.value
  const originalFavoriteCount = favoriteCount.value

  favoriting.value = true
  try {
    if (isFavorited.value) {
      await wallpaperService.unfavoriteWallpaper(props.wallpaper.id)
      isFavorited.value = false
      favoriteCount.value = Math.max(0, favoriteCount.value - 1)
    } else {
      await wallpaperService.favoriteWallpaper(props.wallpaper.id)
      isFavorited.value = true
      favoriteCount.value += 1
    }
  } catch (error) {
    console.error("收藏壁纸失败:", error)
    // 恢复原始状态
    isFavorited.value = originalIsFavorited
    favoriteCount.value = originalFavoriteCount
    toast.error("收藏失败，请稍后重试")
  } finally {
    favoriting.value = false
  }
}

const handleImageLoad = () => {
  imageLoaded.value = true
  imageError.value = false
}

const handleImageError = () => {
  imageLoaded.value = false
  imageError.value = true
}

const handleClick = (event: Event) => {
  const target = event.target as HTMLElement
  if (target.closest("button")) {
    return
  }
  handleCardClick()
}

// --- 预览浮层逻辑 ---
const handleMouseEnter = (event: MouseEvent) => {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
  cardEl.value = (event.currentTarget as HTMLElement)
  hoverTimer = setTimeout(() => {
    calcPreviewPosition()
    previewReady.value = true
    showPreview.value = true
  }, 500)
}

const handleMouseLeave = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
  leaveTimer = setTimeout(() => {
    showPreview.value = false
    previewReady.value = false
  }, 200)
}

const keepPreview = () => {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
}

const hidePreview = () => {
  leaveTimer = setTimeout(() => {
    showPreview.value = false
    previewReady.value = false
  }, 150)
}

const calcPreviewPosition = () => {
  if (!cardEl.value) return
  const rect = cardEl.value.getBoundingClientRect()
  const previewWidth = 320 // w-80 = 320px
  const previewHeight = 360
  const padding = 12

  let x = rect.left + rect.width / 2 - previewWidth / 2
  let y = rect.bottom + padding

  // 不超出右边界
  if (x + previewWidth > window.innerWidth - padding) {
    x = window.innerWidth - previewWidth - padding
  }
  // 不超出左边界
  if (x < padding) {
    x = padding
  }
  // 如果下方空间不足，显示在上方
  if (y + previewHeight > window.innerHeight - padding) {
    y = rect.top - previewHeight - padding
  }
  // 如果上方也不足，居中显示
  if (y < padding) {
    y = padding
  }

  previewPosition.value = { x, y }
}

const previewStyle = computed(() => ({
  left: `${previewPosition.value.x}px`,
  top: `${previewPosition.value.y}px`,
}))
</script>

<style scoped>
.preview-fade-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.preview-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.preview-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(4px);
}
.preview-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
