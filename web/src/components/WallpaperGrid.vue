<template>
  <section class="space-y-6 px-2 sm:px-4">
    <!-- 加载骨架 -->
    <div v-if="loading" class="auto-grid">
      <div
        v-for="index in skeletonCount"
        :key="`skeleton-${index}`"
        class="h-60 animate-pulse rounded-[1.75rem] bg-gradient-to-br from-slate-100 via-slate-50 to-white shadow-inner shadow-black/5"
      ></div>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="wallpapers.length === 0"
      class="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-3xl border border-dashed border-slate-200 bg-white/80 px-10 py-16 text-center shadow-sm"
    >
      <div class="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <i class="i-mdi-image-off text-4xl text-slate-400"></i>
      </div>
      <div>
        <p class="text-lg font-semibold text-slate-800">暂无满足条件的壁纸</p>
        <p class="mt-2 text-sm text-slate-500">
          尝试调整筛选条件或换一个关键词，也可以上传你的第一张作品
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-3">
        <button v-if="showReset" class="btn btn-primary" @click="$emit('reset-filters')">
          重置筛选
        </button>
        <router-link class="btn btn-outline" to="/upload"> 上传壁纸 </router-link>
      </div>
    </div>

    <!-- 壁纸网格 -->
    <div v-else class="auto-grid">
      <WallpaperCard
        v-for="wallpaper in wallpapers"
        :key="wallpaper.id"
        :wallpaper="wallpaper"
        @click="$emit('wallpaper-click', wallpaper)"
      />
    </div>

    <!-- 分页 -->
    <div
      v-if="showPagination && wallpapers.length > 0 && pagination.totalPages > 1"
      class="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        class="btn btn-sm h-10 w-10 rounded-xl bg-base-100 border-2 border-base-content/20 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
        :class="{ 'btn-disabled opacity-50 cursor-not-allowed': pagination.currentPage === 1 }"
        @click="$emit('page-change', pagination.currentPage - 1)"
        title="上一页"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 16.58L10.83 12L15.41 7.41L14 6L8 12L14 18L15.41 16.58Z"/>
        </svg>
      </button>

      <div class="flex items-center gap-1.5">
        <button
          v-for="page in visiblePages"
          :key="page"
          class="btn btn-sm h-10 w-10 rounded-xl border-2 transition-all shadow-sm"
          :class="page === pagination.currentPage
            ? 'bg-gradient-to-r from-primary to-secondary text-white border-primary shadow-md'
            : 'bg-base-100 border-base-content/20 hover:border-primary/50 hover:bg-primary/5'"
          @click="$emit('page-change', page)"
        >
          <span class="font-medium">{{ page }}</span>
        </button>
      </div>

      <button
        class="btn btn-sm h-10 w-10 rounded-xl bg-base-100 border-2 border-base-content/20 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
        :class="{ 'btn-disabled opacity-50 cursor-not-allowed': pagination.currentPage === pagination.totalPages }"
        @click="$emit('page-change', pagination.currentPage + 1)"
        title="下一页"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59 16.58L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.58Z"/>
        </svg>
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import WallpaperCard from './WallpaperCard.vue'
import type { Wallpaper } from '@/services/wallpaper'

interface Props {
  wallpapers: Wallpaper[]
  loading?: boolean
  showPagination?: boolean
  showReset?: boolean
  pagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
  }
}

interface Emits {
  (e: 'wallpaper-click', wallpaper: Wallpaper): void
  (e: 'page-change', page: number): void
  (e: 'reset-filters'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showPagination: true,
  showReset: true,
  pagination: () => ({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  }),
})

defineEmits<Emits>()

const skeletonCount = 8

const visiblePages = computed(() => {
  const total = props.pagination.totalPages
  const current = props.pagination.currentPage
  const maxVisible = 5
  const pages: number[] = []

  if (total <= maxVisible) {
    for (let i = 1; i <= total; i += 1) pages.push(i)
    return pages
  }

  let start = Math.max(1, current - Math.floor(maxVisible / 2))
  let end = start + maxVisible - 1

  if (end > total) {
    end = total
    start = end - maxVisible + 1
  }

  for (let i = start; i <= end; i += 1) {
    pages.push(i)
  }
  return pages
})
</script>

<style scoped>
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1rem;
}
</style>
