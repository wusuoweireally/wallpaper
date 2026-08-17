<template>
  <section class="space-y-6" data-gallery="masonry">
    <MasonryWall v-if="loading" :items="skeletonItems">
      <template #default="{ items }">
        <div
          v-for="item in items"
          :key="`skeleton-${item.id}`"
          class="wb-skeleton rounded-tile"
          :class="skeletonAspects[item.id % skeletonAspects.length]"
        ></div>
      </template>
    </MasonryWall>

    <div v-else-if="wallpapers.length === 0" class="wb-empty">
      <i class="i-[mdi--image-off] text-4xl text-faint"></i>
      <p class="mt-4 text-base font-medium text-fg">暂无满足条件的壁纸</p>
      <p class="mt-1 text-sm text-muted">调整筛选，或上传你的第一张作品</p>
      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <button v-if="showReset" type="button" class="wb-btn" @click="$emit('reset-filters')">
          重置筛选
        </button>
        <router-link class="wb-btn-primary" to="/upload">上传壁纸</router-link>
      </div>
    </div>

    <MasonryWall v-else :items="wallpapers" :item-height="cardWeight">
      <template #default="{ items }">
        <WallpaperCard
          v-for="wallpaper in items"
          :key="wallpaper.id"
          :wallpaper="wallpaper"
          :masonry="masonry"
        />
      </template>
    </MasonryWall>

    <div v-if="showPagination && wallpapers.length > 0 && pagination.totalPages > 1" class="mt-6">
      <Pagination
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        @change="(page) => $emit('page-change', page)"
      />
    </div>
  </section>
</template>

<script lang="ts" setup>
import WallpaperCard from "./WallpaperCard.vue"
import MasonryWall from "./MasonryWall.vue"
import Pagination from "./Pagination.vue"
import type { Wallpaper } from "@/services/wallpaper"
import { masonryItemWeight } from "@/utils/wallpaperLayout"

interface Props {
  wallpapers: Wallpaper[]
  loading?: boolean
  showPagination?: boolean
  showReset?: boolean
  /** 瀑布流：按原图比例自然高度排列 */
  masonry?: boolean
  pagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
  }
}

interface Emits {
  (e: "page-change", page: number): void
  (e: "reset-filters"): void
}

withDefaults(defineProps<Props>(), {
  loading: false,
  showPagination: true,
  showReset: true,
  masonry: true,
  pagination: () => ({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  }),
})

defineEmits<Emits>()

const skeletonCount = 16
const skeletonItems = Array.from({ length: skeletonCount }, (_, id) => ({ id }))
/** 瀑布流骨架用参差比例，贴近真实图墙 */
const skeletonAspects = ["aspect-[3/4]", "aspect-[4/3]", "aspect-[1/1]", "aspect-[16/10]"]

const cardWeight = (wallpaper: Wallpaper) => masonryItemWeight(wallpaper.width, wallpaper.height)
</script>
