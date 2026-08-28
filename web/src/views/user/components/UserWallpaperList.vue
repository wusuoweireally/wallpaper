<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="wb-page-title">{{ config.title }}</h2>
        <p class="mt-1 text-sm text-muted">
          共 <span class="font-semibold text-fg">{{ pagination.total }}</span> 个壁纸
          <template v-if="props.type === 'uploads' && draftCount > 0">
            ·
            <span class="font-medium text-warning">{{ draftCount }} 张待发布</span>
          </template>
        </p>
      </div>

      <div v-if="props.type === 'uploads'" class="flex flex-wrap items-center gap-2">
        <button
          v-if="draftCount > 0"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-4 py-2 text-sm font-semibold text-warning transition hover:bg-warning/20"
          @click="publishAllDrafts"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 16.5V3.75m0 12.75 3.75-3.75M12 16.5l-3.75-3.75M6 20.25h12"
            />
          </svg>
          发布草稿 ({{ draftCount }})
        </button>
        <button type="button" class="wb-btn-primary" @click="router.push('/upload')">
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          上传壁纸
        </button>
      </div>
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
      class="flex items-center justify-between gap-4 rounded-2xl border border-error/30 bg-[color:var(--wb-danger-subtle)] px-5 py-4"
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
      v-else-if="!loading && wallpapers.length === 0"
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
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-fg">{{ config.emptyTitle }}</h3>
      <p class="mt-1.5 max-w-sm text-sm text-muted">{{ config.emptyDescription }}</p>
      <button
        type="button"
        class="wb-btn-primary mt-6 inline-flex items-center gap-1.5 rounded-full"
        @click="router.push(config.emptyRoute)"
      >
        {{ config.emptyText }}
      </button>
    </div>

    <WallpaperGrid
      v-else-if="props.type === 'favorites'"
      :wallpapers="wallpapers"
      :loading="false"
      :show-pagination="false"
      :show-reset="false"
      masonry
    />

    <MasonryWall v-else :items="wallpapers" :item-height="cardWeight">
      <template #default="{ items }">
        <article
          v-for="wallpaper in items"
          :key="wallpaper.id"
          class="group relative overflow-hidden rounded-tile bg-inset"
        >
          <div
            class="relative overflow-hidden"
            :style="{ aspectRatio: `${wallpaper.width}/${wallpaper.height}` }"
          >
            <RouterLink
              :to="`/wallpaper/${wallpaper.id}`"
              class="absolute inset-0 block w-full"
            >
              <img
                :src="wallpaper.thumbnailUrl || wallpaper.fileUrl"
                :alt="`壁纸 ${wallpaper.id}`"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </RouterLink>

            <span
              v-if="props.type === 'uploads'"
              class="pointer-events-none absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white"
              :class="isDraft(wallpaper) ? 'bg-warning' : 'bg-success'"
            >
              {{ isDraft(wallpaper) ? "未发布" : "已公开" }}
            </span>

            <div class="wb-card-overlay !pointer-events-none">
              <span class="text-xs tabular-nums text-white/90"
                >{{ wallpaper.width }}×{{ wallpaper.height }}</span
              >
              <span class="inline-flex items-center gap-1 text-xs text-white/90">
                <i class="i-[mdi--heart] text-xs" aria-hidden="true"></i>
                {{ wallpaper.favoriteCount || 0 }}
              </span>
            </div>

            <div
              v-if="props.type === 'uploads'"
              class="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-end gap-1.5 px-2 pb-7 pt-10 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
            >
              <button
                v-if="isDraft(wallpaper)"
                type="button"
                class="pointer-events-auto inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-success disabled:opacity-50"
                :disabled="actionLoadingId === wallpaper.id"
                @click.stop="toggleVisibility(wallpaper, true)"
              >
                公开
              </button>
              <button
                v-else
                type="button"
                class="pointer-events-auto inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-fg disabled:opacity-50"
                :disabled="actionLoadingId === wallpaper.id"
                @click.stop="toggleVisibility(wallpaper, false)"
              >
                下架
              </button>
              <button
                type="button"
                class="pointer-events-auto inline-flex items-center gap-1 rounded-md bg-error/95 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                :disabled="actionLoadingId === wallpaper.id"
                @click.stop="removeWallpaper(wallpaper)"
              >
                删除
              </button>
            </div>
          </div>
        </article>
      </template>
    </MasonryWall>

    <!-- 分页 -->
    <div
      v-if="!loading && wallpapers.length > 0 && pagination.pages > 1"
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
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import { useGlobalToast } from "@/composables/useToast"
import { confirmAction } from "@/composables/useConfirm"
import { wallpaperService, type Wallpaper } from "@/services/wallpaper"
import Pagination from "@/components/Pagination.vue"
import WallpaperGrid from "@/components/WallpaperGrid.vue"
import MasonryWall from "@/components/MasonryWall.vue"
import { masonryItemWeight } from "@/utils/wallpaperLayout"

type ListType = "uploads" | "favorites"

const props = defineProps<{ type: ListType }>()

const router = useRouter()
const userStore = useUserStore()
const toast = useGlobalToast()

const TYPE_CONFIG: Record<
  ListType,
  {
    title: string
    emptyTitle: string
    emptyDescription: string
    emptyText: string
    emptyRoute: string
  }
> = {
  uploads: {
    title: "我的上传",
    emptyTitle: "暂无上传的壁纸",
    emptyDescription: "开始分享你的精彩壁纸吧",
    emptyText: "开始上传",
    emptyRoute: "/upload",
  },
  favorites: {
    title: "我的收藏",
    emptyTitle: "暂无收藏的壁纸",
    emptyDescription: "收藏你喜欢的壁纸，方便随时查看",
    emptyText: "去发现壁纸",
    emptyRoute: "/wallpapers",
  },
}

const config = computed(() => TYPE_CONFIG[props.type])
const wallpapers = ref<Wallpaper[]>([])
const loading = ref(false)
const error = ref("")
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })

const isDraft = (w: Wallpaper) => Number(w.status) === 0
const cardWeight = (w: Wallpaper) => masonryItemWeight(w.width, w.height)
const draftCount = computed(() => wallpapers.value.filter((w) => isDraft(w)).length)
/** 正在操作的壁纸 id（防连点） */
const actionLoadingId = ref<number | null>(null)

/**
 * 拉取列表；silent=true 时静默刷新（不切 loading、不卸载列表）
 * 操作后的局部刷新用它，避免列表卸载导致页面高度骤变、滚动条被顶回顶部
 */
const fetchData = async (page: number = 1, silent = false) => {
  try {
    if (!silent) loading.value = true
    error.value = ""
    const result = await userStore.fetchUserWallpapers(props.type, page, pagination.value.limit)
    wallpapers.value = result?.data || []
    pagination.value = result?.pagination || {
      page,
      limit: pagination.value.limit,
      total: 0,
      pages: 0,
    }
  } catch (err) {
    // 静默刷新失败不切错误态（操作失败已 toast 提示），保留当前列表
    if (!silent) error.value = err instanceof Error ? err.message : "获取数据失败"
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > pagination.value.pages) return
  fetchData(page)
}

/** 公开/不公开切换（本人；公开=1，下架=0） */
const toggleVisibility = async (w: Wallpaper, isPublic: boolean) => {
  actionLoadingId.value = w.id
  try {
    await wallpaperService.updateWallpaper(w.id, { status: isPublic ? 1 : 0 })
    toast.success(isPublic ? "已公开" : "已下架")
    fetchData(pagination.value.page, true)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "操作失败")
  } finally {
    actionLoadingId.value = null
  }
}

/** 删除壁纸（确认后不可恢复，COS 文件一并删除） */
const removeWallpaper = async (w: Wallpaper) => {
  const ok = await confirmAction({
    title: "删除壁纸",
    message: `确认删除壁纸 #${w.id}？删除后不可恢复。`,
    confirmText: "删除",
    danger: true,
  })
  if (!ok) return
  actionLoadingId.value = w.id
  try {
    await wallpaperService.deleteWallpaper(w.id)
    toast.success("壁纸已删除")
    const page =
      wallpapers.value.length === 1 && pagination.value.page > 1
        ? pagination.value.page - 1
        : pagination.value.page
    fetchData(page, true)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "删除失败")
  } finally {
    actionLoadingId.value = null
  }
}

const publishAllDrafts = () => {
  const ids = wallpapers.value.filter(isDraft).map((w) => w.id)
  if (!ids.length) return
  router.push({ path: "/upload", query: { drafts: ids.join(",") } })
}

onMounted(() => {
  fetchData()
})
</script>
