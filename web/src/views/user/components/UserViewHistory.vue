<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div>
      <h2 class="wb-page-title">浏览记录</h2>
      <p class="mt-1 text-sm text-muted">
        共 <span class="font-semibold text-fg">{{ pagination.total }}</span> 条 · 保留近 30 天
      </p>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="flex flex-col items-center gap-3">
        <span class="wb-spinner wb-spinner-lg text-faint"></span>
        <p class="text-sm text-faint">加载中…</p>
      </div>
    </div>

    <!-- 错误 -->
    <div
      v-else-if="error"
      class="wb-alert flex items-center justify-between gap-4 px-5 py-4"
    >
      <span class="text-sm font-medium text-error">{{ error }}</span>
      <button
        type="button"
        class="wb-btn-ghost wb-btn-sm shrink-0 text-error"
        @click="() => fetchData()"
      >
        重试
      </button>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="items.length === 0"
      class="flex flex-col items-center rounded-panel border border-dashed border-line bg-subtle/60 px-6 py-16 text-center"
    >
      <div
        class="mb-4 flex h-14 w-14 items-center justify-center rounded-card bg-surface text-faint ring-1 ring-line"
      >
        <svg
          class="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-fg">暂无浏览记录</h3>
      <p class="mt-1.5 max-w-sm text-sm text-muted">查看过的壁纸会出现在这里，方便你回头寻找</p>
      <button
        type="button"
        class="wb-btn-primary mt-6 inline-flex items-center gap-1.5 rounded-full"
        @click="router.push('/wallpapers')"
      >
        去发现壁纸
      </button>
    </div>

    <MasonryWall v-else :items="items" :item-height="historyWeight">
      <template #default="{ items: cols }">
        <article
          v-for="item in cols"
          :key="item.wallpaper.id"
          class="group relative overflow-hidden rounded-tile bg-inset"
        >
          <div
            class="relative overflow-hidden"
            :style="{ aspectRatio: `${item.wallpaper.width}/${item.wallpaper.height}` }"
          >
            <button
              type="button"
              class="absolute inset-0 block w-full"
              @click="goToWallpaper(item.wallpaper)"
            >
              <img
                :src="item.wallpaper.thumbnailUrl || item.wallpaper.fileUrl"
                :alt="`壁纸 ${item.wallpaper.id}`"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </button>
            <!-- 浏览时间角标：不用 wb-quality（那是分辨率徽章），这里是时间语义 -->
            <span
              class="absolute left-2 top-2 z-[2] rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
            >
              {{ formatViewedAt(item.viewedAt) }}
            </span>
            <div class="wb-card-overlay">
              <span class="text-xs tabular-nums text-white/90">
                {{ item.wallpaper.width }}×{{ item.wallpaper.height }}
              </span>
              <span class="inline-flex items-center gap-1 text-xs text-white/90">
                <i class="i-[mdi--heart] text-xs" aria-hidden="true"></i>
                {{ item.wallpaper.favoriteCount || 0 }}
              </span>
            </div>
          </div>
        </article>
      </template>
    </MasonryWall>

    <!-- 分页 -->
    <div
      v-if="!loading && items.length > 0 && pagination.pages > 1"
      class="flex justify-center pt-2"
    >
      <Pagination
        :current-page="pagination.page"
        :total-pages="pagination.pages || 1"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { userService, type ViewHistoryItem } from "@/services/user"
import type { Wallpaper } from "@/services/wallpaper"
import Pagination from "@/components/Pagination.vue"
import MasonryWall from "@/components/MasonryWall.vue"
import { formatTime } from "@/utils/format"
import { masonryItemWeight } from "@/utils/wallpaperLayout"

const router = useRouter()

const items = ref<ViewHistoryItem[]>([])
const loading = ref(false)
const error = ref("")
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })

/** 相对时间：刚刚 / N 分钟前 / N 小时前 / 日期 */
const formatViewedAt = (iso?: string) => (iso ? formatTime(iso) : "")
const historyWeight = (item: ViewHistoryItem) =>
  masonryItemWeight(item.wallpaper.width, item.wallpaper.height)

const fetchData = async (page: number = 1) => {
  loading.value = true
  error.value = ""
  try {
    const result = await userService.getViewHistory(page, pagination.value.limit)
    items.value = result?.data || []
    pagination.value = result?.pagination || {
      page,
      limit: pagination.value.limit,
      total: 0,
      pages: 0,
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取数据失败"
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > pagination.value.pages) return
  fetchData(page)
}

const goToWallpaper = (wallpaper: Wallpaper) => {
  router.push(`/wallpaper/${wallpaper.id}`)
}

onMounted(() => {
  fetchData()
})
</script>
