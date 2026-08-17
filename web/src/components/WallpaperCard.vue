<template>
  <article class="wallpaper-card group relative" data-card="overlay">
    <div
      class="relative overflow-hidden rounded-tile bg-inset transition-transform duration-200 ease-out group-hover:-translate-y-1"
      :class="{ 'aspect-[16/10]': !masonry }"
      :style="masonry ? { aspectRatio: aspect } : undefined"
    >
      <RouterLink
        :to="`/wallpaper/${wallpaper.id}`"
        class="absolute inset-0 block"
        :title="`${wallpaper.width}×${wallpaper.height}`"
        :aria-label="`查看壁纸 ${displayTitle}`"
      >
        <img
          :src="`${wallpaper.thumbnailUrl || wallpaper.fileUrl}?t=${wallpaper.updatedAt || wallpaper.id}`"
          class="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
          loading="lazy"
          :alt="`壁纸 ${displayTitle}`"
          @load="handleImageLoad"
          @error="handleImageError"
        />
        <div
          v-if="!imageLoaded && !imageError"
          class="absolute inset-0 animate-pulse bg-inset"
          aria-hidden="true"
        ></div>
        <div
          v-if="imageError"
          class="absolute inset-0 flex items-center justify-center bg-subtle"
          role="img"
          aria-label="壁纸加载失败"
        >
          <i class="i-[mdi--image-off] text-3xl text-faint"></i>
        </div>
      </RouterLink>

      <!-- 默认纯图不遮挡；hover/聚焦时浮出画质角标 + 浏览/收藏（不显示作者名） -->
      <span
        class="wb-quality opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100"
        data-overlay="quality"
        >{{ quality }}</span
      >
      <div
        class="wb-card-overlay translate-y-1 justify-end opacity-0 transition-all duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
      >
        <div class="flex shrink-0 items-center gap-2.5">
          <span
            class="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-white/90"
            data-overlay="views"
          >
            <i class="i-[mdi--eye-outline] text-sm" aria-hidden="true"></i>
            {{ formatNumber(wallpaper.viewCount || 0) }}
          </span>
          <button
            v-if="showActions"
            type="button"
            class="favorite-action pointer-events-none group-focus-within:pointer-events-auto group-hover:pointer-events-auto"
            :class="{ 'favorite-action--active': isFavorited }"
            :disabled="favoriting"
            data-overlay="favorite"
            :aria-label="isFavorited ? '取消收藏' : '收藏壁纸'"
            :aria-pressed="isFavorited"
            @click="handleFavorite"
          >
            <i
              :class="isFavorited ? 'i-[mdi--heart]' : 'i-[mdi--heart-outline]'"
              class="text-sm"
              aria-hidden="true"
            ></i>
            {{ formatNumber(favoriteCount) }}
          </button>
          <span v-else class="favorite-action favorite-action--static" data-overlay="favorite">
            <i class="i-[mdi--heart-outline] text-sm" aria-hidden="true"></i>
            {{ formatNumber(favoriteCount) }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import type { Wallpaper } from "@/services/wallpaper"
import { wallpaperService } from "@/services/wallpaper"
import { useUserStore } from "@/stores/user"
import { useGlobalToast } from "@/composables/useToast"
import { formatNumber } from "@/utils/format"
import { masonryAspectRatio, qualityLabel, wallpaperDisplayTitle } from "@/utils/wallpaperLayout"

const props = withDefaults(
  defineProps<{ wallpaper: Wallpaper; showActions?: boolean; masonry?: boolean }>(),
  { showActions: true, masonry: true },
)

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const toast = useGlobalToast()

const imageLoaded = ref(false)
const imageError = ref(false)
const favoriteCount = ref(props.wallpaper.favoriteCount || 0)
const isFavorited = ref(Boolean(props.wallpaper.isFavorited))
const favoriting = ref(false)

const displayTitle = computed(() =>
  wallpaperDisplayTitle(props.wallpaper.tags, props.wallpaper.category),
)

const quality = computed(() => qualityLabel(props.wallpaper.width, props.wallpaper.height))

const aspect = computed(() => masonryAspectRatio(props.wallpaper.width, props.wallpaper.height))

watch(
  () => props.wallpaper,
  (wallpaper) => {
    favoriteCount.value = wallpaper.favoriteCount || 0
    isFavorited.value = Boolean(wallpaper.isFavorited)
    imageLoaded.value = false
    imageError.value = false
  },
)

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    void router.push({ path: "/auth/login", query: { redirect: route.fullPath } })
    return
  }
  if (favoriting.value) return
  const original = { favorited: isFavorited.value, count: favoriteCount.value }
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
  } catch {
    isFavorited.value = original.favorited
    favoriteCount.value = original.count
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
</script>

<style scoped>
/* 触屏无 hover：画质角标与收藏常显，避免收藏在移动端不可达 */
@media (hover: none) {
  .wb-quality {
    opacity: 1;
  }
  .wb-card-overlay {
    opacity: 1;
    transform: none;
  }
  .favorite-action {
    pointer-events: auto;
  }
}

.favorite-action {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  border-radius: 0.375rem;
  padding: 0.1rem 0.15rem;
  font-size: 0.75rem;
  line-height: 1;
  color: rgb(255 255 255 / 0.92);
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.45);
  pointer-events: auto;
  transition: color 0.2s;
}
.favorite-action:hover:not(:disabled),
.favorite-action--active {
  color: var(--wb-accent);
}
.favorite-action--static {
  pointer-events: none;
}
</style>
