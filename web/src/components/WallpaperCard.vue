<template>
  <div
    class="group flex flex-col overflow-hidden rounded-[1rem] border border-slate-200/60 bg-white/90 shadow-[0_24px_45px_rgba(15,23,42,0.12)] transition hover:-translate-y-1 hover:shadow-[0_30px_55px_rgba(15,23,42,0.18)] dark:border-slate-700/60 dark:bg-slate-800/90 dark:shadow-[0_24px_45px_rgba(0,0,0,0.35)]"
    @click="handleClick"
  >
    <figure class="relative h-56 w-full overflow-hidden">
      <img
        :src="wallpaper.thumbnailUrl || wallpaper.fileUrl"
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
      class="flex items-center justify-start gap-2 border border-slate-200/60 bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    >
      <span class="inline-flex items-center gap-1.5">
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        {{ wallpaper.viewCount || 0 }}
      </span>
      <span class="inline-flex items-center gap-1.5">
        <svg
          class="h-3.5 w-3.5"
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
      <span class="inline-flex items-center gap-1.5">
        <svg
          class="h-3.5 w-3.5"
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
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { useRouter } from "vue-router"
import type { Wallpaper } from "@/services/wallpaper"
import { wallpaperService } from "@/services/wallpaper"
import { useUserStore } from "@/stores"

interface Props {
  wallpaper: Wallpaper
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
})

const router = useRouter()
const userStore = useUserStore()

const imageLoaded = ref(false)
const imageError = ref(false)
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
    alert("点赞失败，请稍后重试")
  } finally {
    liking.value = false
  }
}

const handleFavorite = async () => {
  if (!ensureAuth() || favoriting.value) {
    return
  }

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
    alert("收藏失败，请稍后重试")
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
</script>
