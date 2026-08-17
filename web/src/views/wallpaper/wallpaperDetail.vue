<template>
  <!-- 详情页：主图居左陈列（880 上限）+ 右侧信息栏；跟随站点浅色/深色主题 -->
  <div class="wb-page overflow-x-clip bg-canvas text-fg">
    <div v-if="loading" class="flex items-center justify-center py-24">
      <span class="wb-spinner wb-spinner-lg"></span>
    </div>

    <div v-else-if="error" class="flex items-center justify-center px-4 py-20">
      <div
        class="inline-flex items-center gap-3 rounded-control border border-error/30 bg-[color:var(--wb-danger-subtle)] px-4 py-3 text-error"
      >
        <span>{{ error }}</span>
        <button type="button" class="wb-btn-ghost wb-btn-sm" @click="$router.back()">返回</button>
      </div>
    </div>

    <div
      v-else
      class="wb-container-gallery flex flex-col gap-8 py-7 lg:flex-row lg:flex-wrap lg:gap-6"
    >
      <!-- 主观图区：环境光晕包裹 + 预览→原图淡入 -->
      <main class="relative min-w-0 flex-1">
        <!-- 环境光晕：与画框同位、放大糊化后向四周溢出，把观图区裹进图片自身色调，消除"装在盒子里"的割裂感 -->
        <div
          v-if="ambientSrc"
          aria-hidden="true"
          class="pointer-events-none absolute inset-x-0 top-6 mx-auto max-w-[880px] scale-105 bg-cover bg-center opacity-40 blur-3xl lg:top-10"
          :style="{ height: 'min(70vh, 700px)', backgroundImage: `url(${ambientSrc})` }"
        ></div>
        <!-- 观图台：880 × min(70vh,700px)，任意比例 contain 居中，观感一致且加载不闪跳 -->
        <div
          class="relative mx-auto mt-6 w-full max-w-[880px] overflow-hidden rounded-tile border border-line lg:mt-10"
          :style="{ height: 'min(70vh, 700px)' }"
        >
          <!-- 框内环境底：同图糊化填满，消除 contain 两侧的生硬空隙 -->
          <div
            v-if="ambientSrc"
            aria-hidden="true"
            class="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
            :style="{ backgroundImage: `url(${ambientSrc})` }"
          ></div>
          <Transition name="preview-fade">
            <img
              v-if="!imageLoaded && wallpaper.previewUrl"
              :key="`prev-${wallpaper.id}`"
              :src="wallpaper.previewUrl"
              class="absolute inset-0 h-full w-full cursor-zoom-in select-none object-contain"
              :alt="`壁纸 ${wallpaper.id} 预览`"
              draggable="false"
              @click="openLightbox"
            />
          </Transition>
          <img
            v-show="imageLoaded"
            :src="imageSrc"
            class="absolute inset-0 h-full w-full cursor-zoom-in select-none object-contain"
            :alt="`壁纸 ${wallpaper.id}`"
            draggable="false"
            @load="imageLoaded = true"
            @error="imageError = true"
            @click="openLightbox"
          />
          <!-- 原图加载失败：预览兜底 + 重试 -->
          <div
            v-if="imageError"
            class="absolute inset-x-0 bottom-4 z-10 flex flex-col items-center gap-2"
            role="alert"
          >
            <p class="rounded-control bg-black/60 px-3 py-1.5 text-xs text-white">
              原图加载失败，当前显示预览图
            </p>
            <button type="button" class="wb-btn wb-btn-sm" @click="retryImage">
              <i class="i-[mdi--refresh]" aria-hidden="true"></i>
              重试
            </button>
          </div>
          <div
            v-if="!imageLoaded && !imageError && !wallpaper.previewUrl"
            class="absolute inset-0 flex items-center justify-center"
          >
            <span class="wb-spinner wb-spinner-lg text-faint"></span>
          </div>
        </div>
      </main>

      <!-- 右侧信息栏：无壳透明堆叠（贴画布）；桌面 360 固定宽，移动端在图下方 -->
      <aside class="w-full shrink-0 lg:w-[360px]">
        <!-- 作者 -->
        <div class="mb-5 flex items-center gap-3">
          <router-link :to="`/u/${wallpaper.uploader.id}`" class="shrink-0">
            <img
              :src="wallpaper.uploader.avatar || '/defaultAvatar.png'"
              :alt="wallpaper.uploader.name || '上传者'"
              class="h-9 w-9 rounded-full object-cover ring-1 ring-line"
              @error="handleAvatarError"
            />
          </router-link>
          <div class="min-w-0">
            <router-link
              :to="`/u/${wallpaper.uploader.id}`"
              class="block truncate text-sm font-bold text-fg transition-colors hover:text-primary"
            >
              {{ wallpaper.uploader.name }}
            </router-link>
            <p class="mt-0.5 truncate text-xs text-faint">
              {{ wallpaper.uploadDate }} 发布 · {{ wallpaper.views ?? "—" }} 次浏览
            </p>
          </div>
        </div>

        <!-- 收藏：主按钮 + 右侧合集下拉（wallhaven 布局） -->
        <div class="fav-split relative mb-4">
          <div
            class="wb-shadow-pop flex overflow-hidden rounded-control border-[1.5px] border-fg/85 text-sm font-bold text-primary-content"
            :class="isFavorited ? 'bg-primary-fill' : 'bg-primary-fill/90'"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center justify-center gap-2 px-3 py-2.5 transition hover:brightness-110 disabled:opacity-60"
              :disabled="favoriting"
              @click="handleFavorite"
            >
              <svg
                class="h-4 w-4 shrink-0"
                :class="isFavorited ? 'fill-current' : 'fill-none stroke-current'"
                viewBox="0 0 24 24"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                />
              </svg>
              <span class="truncate">{{ isFavorited ? "已收藏" : "添加收藏" }}</span>
            </button>
            <button
              type="button"
              class="flex w-10 shrink-0 items-center justify-center border-l border-primary-content/25 bg-black/10 transition hover:brightness-110"
              :disabled="collectionBusy"
              title="加入合集"
              aria-label="加入合集"
              @click="toggleCollectionMenu"
            >
              <svg
                class="h-4 w-4 transition-transform duration-200"
                :class="{ 'rotate-180': showCollectionMenu }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>

          <!-- 合集下拉 -->
          <div
            v-if="showCollectionMenu"
            class="absolute left-0 right-0 z-40 mt-1.5 overflow-hidden rounded-control border border-line bg-surface text-fg shadow-lg"
          >
            <div
              class="pointer-events-none absolute -top-1.5 right-3 h-3 w-3 rotate-45 border-l border-t border-line bg-surface"
            ></div>
            <p v-if="!userStore.isLoggedIn" class="px-3 py-2.5 text-xs text-muted">请先登录</p>
            <p v-else-if="collectionsLoading" class="px-3 py-2.5 text-xs text-muted">加载中…</p>
            <template v-else>
              <button
                v-for="c in myCollections"
                :key="c.id"
                type="button"
                class="flex w-full items-center gap-2 border-b border-line/60 px-3 py-2.5 text-left text-sm transition hover:bg-subtle disabled:cursor-default disabled:opacity-70"
                :disabled="collectionBusy"
                @click="addWallpaperToCollection(c.id, c.name)"
              >
                <i
                  class="w-5 shrink-0 text-center text-base"
                  :class="
                    containingCollectionIds.has(c.id)
                      ? 'i-[mdi--check] text-success'
                      : 'i-[mdi--folder-outline] text-faint'
                  "
                ></i>
                <span class="truncate">{{ c.name }}</span>
                <span v-if="containingCollectionIds.has(c.id)" class="ml-auto text-xs text-muted">
                  已加入
                </span>
              </button>
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-subtle"
                :disabled="collectionBusy"
                @click="createCollectionAndAdd"
              >
                <i class="i-[mdi--plus] w-5 shrink-0 text-center text-base text-faint"></i>
                新建合集并加入
              </button>
            </template>
          </div>
        </div>

        <!-- 下载操作行：下载原图 + 裁剪下载（照设计稿并排半宽贴纸） -->
        <div class="mb-5 flex gap-3">
          <button
            type="button"
            class="wb-btn flex-1"
            :disabled="downloading"
            @click="downloadWallpaper"
          >
            <i class="i-[mdi--download] text-base" aria-hidden="true"></i>
            {{ downloading ? "下载中…" : "下载原图" }}
          </button>
          <button type="button" class="wb-btn flex-1" @click="cropScaleOpen = true">
            <i class="i-[mdi--content-cut] text-base" aria-hidden="true"></i>
            裁剪下载
          </button>
        </div>
        <p v-if="shareNotice" class="-mt-3 mb-4 text-center text-xs font-medium text-success">
          {{ shareNotice }}
        </p>

        <!-- 主色板:wallhaven 色板条,点击按此色筛选 -->
        <section v-if="wallpaper.dominantColor" class="mb-4">
          <h2 class="mb-2 text-xs font-bold tracking-wide text-primary">主色</h2>
          <router-link
            :to="{
              path: '/wallpapers',
              query: { color: wallpaper.colorBucket || wallpaper.dominantColor },
            }"
            class="group block"
            title="按此主色筛选相似壁纸"
          >
            <span
              class="block h-7 w-full rounded-control ring-1 ring-inset ring-black/10 transition group-hover:ring-primary/50"
              :style="{ background: wallpaper.dominantColor }"
            ></span>
            <span
              class="mt-1 block font-mono text-[11px] uppercase tracking-wide text-faint transition group-hover:text-primary"
            >
              {{ wallpaper.dominantColor }}
            </span>
          </router-link>
        </section>

        <div
          v-if="wallpaper.status === 0"
          class="mb-3 rounded-control border border-warning/30 bg-[color:var(--wb-warning-subtle)] p-3 text-[color:var(--wb-warning)]"
        >
          <p class="text-sm font-semibold">未公开发布</p>
          <p class="mt-1 text-xs opacity-90">完善分类与标签后发布，他人才能看到。</p>
          <button type="button" class="wb-btn wb-btn-sm mt-2 w-full" @click="goPublishDraft">
            去发布
          </button>
        </div>

        <section class="mb-4">
          <h2 class="mb-2 text-xs font-bold tracking-wide text-primary">标签</h2>
          <div class="flex flex-wrap gap-1.5">
            <router-link
              v-for="tag in wallpaper.tags"
              :key="tag"
              :to="{ path: '/wallpapers', query: { tags: tag } }"
              class="rounded-md border border-primary/20 bg-[color:var(--wb-accent-subtle)] px-2 py-0.5 text-xs font-medium text-primary transition hover:border-primary/50"
            >
              #{{ tag }}
            </router-link>
            <span v-if="!wallpaper.tags.length" class="text-xs text-faint">暂无标签</span>
          </div>
          <button
            v-if="wallpaper.status === 1 && wallpaper.tags.length"
            type="button"
            class="mt-2 text-xs text-muted underline-offset-2 hover:text-primary hover:underline"
            @click="searchSimilarTags"
          >
            更多相似 →
          </button>
        </section>

        <section class="mb-4">
          <h2 class="mb-2 text-xs font-bold tracking-wide text-primary">属性</h2>
          <dl class="space-y-2.5 text-sm">
            <div class="flex items-center gap-2">
              <dt class="w-16 shrink-0 text-xs text-faint">分类</dt>
              <dd class="font-medium">{{ categoryLabel }}</dd>
            </div>
            <div class="flex items-center gap-2">
              <dt class="w-16 shrink-0 text-xs text-faint">尺寸</dt>
              <dd class="font-mono font-medium tabular-nums">
                {{ wallpaper.width }} × {{ wallpaper.height }}
              </dd>
            </div>
            <div class="flex items-center gap-2">
              <dt class="w-16 shrink-0 text-xs text-faint">大小</dt>
              <dd class="font-mono">{{ wallpaper.fileSize }}</dd>
            </div>
            <div class="flex items-center gap-2">
              <dt class="w-16 shrink-0 text-xs text-faint">浏览</dt>
              <dd class="font-mono tabular-nums">
                {{ wallpaper.views ?? "—" }}
              </dd>
            </div>
            <div class="flex items-center gap-2">
              <dt class="w-16 shrink-0 text-xs text-faint">收藏</dt>
              <dd class="font-mono font-medium tabular-nums text-primary">
                {{ wallpaper.favorites }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- 底部：分享 -->
        <div class="mt-6 border-t border-line pt-4">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-faint transition-colors hover:text-primary"
            @click="shareWallpaper"
          >
            <i class="i-[mdi--share-variant] text-sm" aria-hidden="true"></i>
            分享这张壁纸
          </button>
        </div>
      </aside>

      <!-- 相关推荐：通栏横向轨，单行固定高、行内横滑，不再撑高页面 -->
      <section v-if="relatedWallpapers.length" class="w-full">
        <div class="mb-3 flex items-center gap-3">
          <h2 class="text-xs font-bold tracking-wide text-primary">相关推荐</h2>
          <router-link
            :to="relatedMoreTo"
            class="inline-flex items-center gap-0.5 text-xs font-medium text-muted transition-colors hover:text-primary"
          >
            查看全部
            <i class="i-[mdi--chevron-right] text-sm" aria-hidden="true"></i>
          </router-link>
        </div>
        <div
          class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            v-for="item in relatedWallpapers.slice(0, 8)"
            :key="item.id"
            type="button"
            class="group w-44 shrink-0 snap-start overflow-hidden rounded-control ring-1 ring-line transition hover:ring-primary/50"
            @click="router.push(`/wallpaper/${item.id}`)"
          >
            <div class="aspect-[3/2] bg-inset">
              <img
                :src="item.thumbnailUrl || item.fileUrl"
                class="h-full w-full object-cover opacity-90 transition group-hover:scale-105 group-hover:opacity-100"
                loading="lazy"
                alt=""
              />
            </div>
          </button>
        </div>
      </section>

      <!-- Lightbox：双击缩放、滚轮缩放、拖拽平移 -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition-opacity duration-200"
          leave-active-class="transition-opacity duration-200"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div
            v-if="lightboxVisible"
            class="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/95"
            :class="
              dragging ? 'cursor-grabbing' : lightboxScale > 1 ? 'cursor-grab' : 'cursor-zoom-out'
            "
            @click.self="closeLightbox"
            @wheel.prevent="onLightboxWheel"
            @mousedown="onLightboxDragStart"
            @mousemove="onLightboxDragMove"
            @mouseup="onLightboxDragEnd"
            @mouseleave="onLightboxDragEnd"
            @touchstart="onLightboxTouchStart"
            @touchmove.prevent="onLightboxTouchMove"
            @touchend="onLightboxTouchEnd"
            @touchcancel="onLightboxTouchEnd"
          >
            <button
              type="button"
              class="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              title="关闭 (Esc)"
              @click="closeLightbox"
            >
              <i class="i-[mdi--close]" aria-hidden="true"></i>
            </button>
            <p
              v-if="lightboxScale > 1"
              class="pointer-events-none absolute left-4 top-4 z-10 rounded-control bg-white/10 px-2.5 py-1 text-xs text-white/90"
            >
              {{ Math.round(lightboxScale * 100) }}%
            </p>
            <img
              :src="wallpaper.imageUrl"
              class="max-h-[100dvh] max-w-[100vw] select-none object-contain"
              :class="dragging ? '' : 'transition-transform duration-200'"
              :style="lightboxStyle"
              alt=""
              draggable="false"
              @click.stop
              @dblclick.prevent.stop="toggleLightboxZoom"
            />
          </div>
        </Transition>
      </Teleport>

      <CropScaleDownload
        v-model:open="cropScaleOpen"
        :wallpaper-id="wallpaper.id"
        :source-width="wallpaper.width"
        :source-height="wallpaper.height"
        :file-url="wallpaper.imageUrl"
        :format="wallpaper.format"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { wallpaperService, type Collection } from "@/services/wallpaper"
import { useUserStore } from "@/stores/user"
import { useGlobalToast } from "@/composables/useToast"
import CropScaleDownload from "@/components/CropScaleDownload.vue"
import { createFetchGeneration } from "@/utils/fetchGeneration"

interface WallpaperDetail {
  id: number
  category: "general" | "anime" | "people"
  format?: string
  imageUrl: string
  previewUrl?: string
  width: number
  height: number
  fileSize: string
  tags: string[]
  status: number
  uploader: { id: number; name: string; avatar: string }
  uploadDate: string
  favorites: number
  views?: number
  /** 主色 hex(色板条 + 点击按色筛选) */
  dominantColor?: string | null
  /** 主色粗分桶(筛选用) */
  colorBucket?: string | null
}

const route = useRoute()
const router = useRouter()
const wallpaperId = computed(() => Number(route.params.id))
const userStore = useUserStore()
const toast = useGlobalToast()

const imageLoaded = ref(false)
const imageError = ref(false)
/** 重试计数拼进缓存参数，强制浏览器重新拉原图 */
const imageRetry = ref(0)
/** 避免已有 query 的 URL 被再拼一个 "?" 拼坏 */
const withQuery = (url: string, param: string) =>
  (url.includes("?") ? `${url}&` : `${url}?`) + param
const imageSrc = computed(() =>
  wallpaper.value.imageUrl
    ? withQuery(wallpaper.value.imageUrl, `t=${wallpaper.value.id}-${imageRetry.value}`)
    : "",
)
/** 环境光晕用图：优先小体积预览图（糊化后看不出分辨率），避免重复拉原图 */
const ambientSrc = computed(() => wallpaper.value.previewUrl || imageSrc.value)
const retryImage = () => {
  imageLoaded.value = false
  imageError.value = false
  imageRetry.value += 1
}
const isFavorited = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const shareNotice = ref("")
const favoriting = ref(false)
const downloading = ref(false)
const cropScaleOpen = ref(false)
const lightboxVisible = ref(false)
const showCollectionMenu = ref(false)
const myCollections = ref<Collection[]>([])
/** 已包含当前壁纸的合集 ID（下拉勾选态） */
const containingCollectionIds = ref<Set<number>>(new Set())
const collectionsLoading = ref(false)
const collectionBusy = ref(false)
/** 详情请求代数：快速切图时旧响应不得覆盖新数据 */
const detailGeneration = createFetchGeneration()
/** 相关推荐最多展示 8 张 */
const relatedWallpapers = ref<
  Array<{
    id: number
    fileUrl: string
    thumbnailUrl?: string
    width: number
    height: number
    category: string
  }>
>([])

/** 「查看全部」：相关推荐按同分类随机取，故跳到同分类浏览页 */
const relatedMoreTo = computed(() => ({
  path: "/wallpapers",
  query: { category: wallpaper.value.category },
}))

const wallpaper = ref<WallpaperDetail>({
  id: 0,
  category: "general",
  format: "",
  imageUrl: "",
  previewUrl: "",
  width: 0,
  height: 0,
  fileSize: "",
  tags: [],
  status: 1,
  uploader: { id: 0, name: "", avatar: "" },
  uploadDate: "",
  favorites: 0,
  views: 0,
})

const categoryLabelMap = {
  general: "通用",
  anime: "动漫",
  people: "真人",
} as const
const categoryLabel = computed(() => categoryLabelMap[wallpaper.value.category] || "其他")

const goPublishDraft = () => {
  router.push({ path: "/upload", query: { drafts: String(wallpaper.value.id) } })
}

const searchSimilarTags = () => {
  const tag = wallpaper.value.tags[0]
  // 按精确标签筛，不用全文搜索
  if (tag) router.push({ path: "/wallpapers", query: { tags: tag } })
}

const fetchWallpaperDetail = async () => {
  const gen = detailGeneration.next()
  loading.value = true
  error.value = null
  try {
    const id = wallpaperId.value
    if (isNaN(id)) throw new Error("无效的壁纸ID")

    const wallpaperResponse = await wallpaperService.getWallpaperDetail(id)
    if (!detailGeneration.isCurrent(gen)) return
    if (!wallpaperResponse.success) {
      throw new Error(wallpaperResponse.message || "获取壁纸详情失败")
    }

    const d = wallpaperResponse.data
    wallpaper.value = {
      id: d.id,
      category: d.category || "general",
      format: d.format || d.fileUrl?.split(".").pop()?.toUpperCase() || "",
      imageUrl: d.fileUrl,
      previewUrl: d.previewUrl || "",
      width: d.width,
      height: d.height,
      fileSize: `${(d.fileSize / 1024 / 1024).toFixed(2)} MB`,
      tags: (d.tags || []).map((tag: { name: string }) => tag.name),
      status: d.status ?? 1,
      uploader: {
        id: d.uploader?.id || d.uploaderId,
        name: d.uploader?.username || "未知用户",
        avatar: d.uploader?.avatarUrl || "",
      },
      uploadDate: new Date(d.createdAt).toLocaleDateString(),
      favorites: d.favoriteCount,
      views: d.viewCount || 0,
      dominantColor: d.dominantColor || null,
      colorBucket: d.colorBucket || null,
    }

    isFavorited.value = d.isFavorited || false
    imageLoaded.value = false
    imageError.value = false

    if (wallpaper.value.status === 1) {
      wallpaperService
        .getRelatedWallpapers(id, 8)
        .then((res) => {
          // 相关推荐晚到但已切图：丢弃
          if (detailGeneration.isCurrent(gen) && res.success && res.data) {
            relatedWallpapers.value = res.data
          }
        })
        .catch(() => {})
    } else {
      relatedWallpapers.value = []
    }
  } catch (err: unknown) {
    const errObj = err as Error & { name?: string; isCancelled?: boolean }
    if (
      errObj.message === "请求已取消" ||
      errObj.name === "REQUEST_CANCELLED" ||
      errObj.isCancelled
    ) {
      return
    }
    if (!detailGeneration.isCurrent(gen)) return
    error.value = errObj instanceof Error ? errObj.message : "获取壁纸详情失败"
  } finally {
    // 旧请求不得关掉新请求的 loading
    if (detailGeneration.isCurrent(gen)) {
      loading.value = false
    }
  }
}

const loadCollections = async () => {
  collectionsLoading.value = true
  try {
    // 带当前壁纸 ID：一次拿到列表 + 勾选态（哪些合集已包含）
    const res = await wallpaperService.listCollections(wallpaperId.value)
    myCollections.value = res.data || []
    containingCollectionIds.value = new Set(res.containingIds || [])
  } catch {
    myCollections.value = []
    containingCollectionIds.value = new Set()
  } finally {
    collectionsLoading.value = false
  }
}

const toggleCollectionMenu = async () => {
  if (!userStore.isLoggedIn) {
    toast.warning("请先登录后再加入合集")
    return
  }
  showCollectionMenu.value = !showCollectionMenu.value
  if (showCollectionMenu.value) {
    await loadCollections()
  }
}

const addWallpaperToCollection = async (collectionId: number, name: string) => {
  if (collectionBusy.value) return
  const id = wallpaperId.value
  if (isNaN(id)) return
  collectionBusy.value = true
  try {
    await wallpaperService.addToCollection(collectionId, id)
    containingCollectionIds.value.add(collectionId)
    toast.success(`已加入「${name}」`)
    showCollectionMenu.value = false
    const c = myCollections.value.find((x) => x.id === collectionId)
    if (c && typeof c.itemCount === "number") c.itemCount += 1
  } catch (e: unknown) {
    toast.error((e as Error).message || "加入合集失败")
  } finally {
    collectionBusy.value = false
  }
}

/** 新建合集并加入当前壁纸 */
const createCollectionAndAdd = async () => {
  if (!userStore.isLoggedIn) {
    toast.warning("请先登录")
    return
  }
  const name = window.prompt("新建合集名称")?.trim()
  if (!name) return
  if (collectionBusy.value) return
  collectionBusy.value = true
  try {
    const res = await wallpaperService.createCollection(name)
    const col = res.data
    if (!col?.id) throw new Error("创建失败")
    myCollections.value = [col, ...myCollections.value]
    await wallpaperService.addToCollection(col.id, wallpaperId.value)
    toast.success(`已加入「${col.name}」`)
    showCollectionMenu.value = false
  } catch (e: unknown) {
    toast.error((e as Error).message || "创建合集失败")
  } finally {
    collectionBusy.value = false
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
    if (shouldFavorite) await wallpaperService.favoriteWallpaper(id)
    else await wallpaperService.unfavoriteWallpaper(id)
  } catch {
    isFavorited.value = previousFavorited
    wallpaper.value.favorites = previousFavorites
    toast.error("收藏失败，请稍后重试")
  } finally {
    favoriting.value = false
  }
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = "/defaultAvatar.png"
  img.onerror = null
}

/* ---------- Lightbox：缩放 + 拖拽 ---------- */

const lightboxScale = ref(1)
const lightboxX = ref(0)
const lightboxY = ref(0)
const dragging = ref(false)
let dragStart = { x: 0, y: 0, ox: 0, oy: 0 }

const lightboxStyle = computed(() => ({
  transform: `translate(${lightboxX.value}px, ${lightboxY.value}px) scale(${lightboxScale.value})`,
}))

const resetLightboxTransform = () => {
  lightboxScale.value = 1
  lightboxX.value = 0
  lightboxY.value = 0
  dragging.value = false
}

const toggleLightboxZoom = () => {
  if (lightboxScale.value > 1) {
    resetLightboxTransform()
  } else {
    lightboxScale.value = 2
  }
}

const onLightboxWheel = (e: WheelEvent) => {
  const factor = e.deltaY < 0 ? 1.15 : 0.87
  const next = Math.min(4, Math.max(1, lightboxScale.value * factor))
  lightboxScale.value = next
  if (next === 1) {
    lightboxX.value = 0
    lightboxY.value = 0
  }
}

const onLightboxDragStart = (e: MouseEvent) => {
  if (e.button !== 0 || lightboxScale.value <= 1) return
  dragging.value = true
  dragStart = { x: e.clientX, y: e.clientY, ox: lightboxX.value, oy: lightboxY.value }
}

const onLightboxDragMove = (e: MouseEvent) => {
  if (!dragging.value) return
  lightboxX.value = dragStart.ox + (e.clientX - dragStart.x)
  lightboxY.value = dragStart.oy + (e.clientY - dragStart.y)
}

const onLightboxDragEnd = () => {
  dragging.value = false
}

/* ---------- 触屏：单指平移（放大后）+ 双指捏合缩放 ---------- */

let touchState: {
  mode: "pan" | "pinch"
  startX: number
  startY: number
  ox: number
  oy: number
  dist?: number
  scale0?: number
} | null = null

const touchDist = (t: TouchList) =>
  Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

const onLightboxTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 2) {
    touchState = {
      mode: "pinch",
      startX: 0,
      startY: 0,
      ox: lightboxX.value,
      oy: lightboxY.value,
      dist: touchDist(e.touches),
      scale0: lightboxScale.value,
    }
  } else if (e.touches.length === 1 && lightboxScale.value > 1) {
    const t = e.touches[0]
    touchState = {
      mode: "pan",
      startX: t.clientX,
      startY: t.clientY,
      ox: lightboxX.value,
      oy: lightboxY.value,
    }
  } else {
    touchState = null
  }
}

const onLightboxTouchMove = (e: TouchEvent) => {
  if (!touchState) return
  if (touchState.mode === "pinch" && e.touches.length === 2 && touchState.dist) {
    const next = Math.min(
      4,
      Math.max(1, (touchState.scale0 ?? 1) * (touchDist(e.touches) / touchState.dist)),
    )
    lightboxScale.value = next
    if (next === 1) {
      lightboxX.value = 0
      lightboxY.value = 0
    }
  } else if (touchState.mode === "pan" && e.touches.length === 1) {
    const t = e.touches[0]
    lightboxX.value = touchState.ox + (t.clientX - touchState.startX)
    lightboxY.value = touchState.oy + (t.clientY - touchState.startY)
  }
}

const onLightboxTouchEnd = () => {
  touchState = null
}

const openLightbox = () => {
  lightboxVisible.value = true
  resetLightboxTransform()
  document.body.style.overflow = "hidden"
}

const closeLightbox = () => {
  lightboxVisible.value = false
  resetLightboxTransform()
  document.body.style.overflow = ""
}

const handleKeydown = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

  if (e.key === "Escape") {
    if (lightboxVisible.value) closeLightbox()
    else if (showCollectionMenu.value) showCollectionMenu.value = false
    return
  }
  if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    if (!lightboxVisible.value) openLightbox()
  }
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
    // 原图直链已带 attachment 响应头，直接触发浏览器下载
    const fileUrl = wallpaper.value.imageUrl
    const ext = wallpaper.value.format?.toLowerCase() || fileUrl.split(".").pop() || "jpg"
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = `wallpaper-${wallpaper.value.id}.${ext}`
    link.rel = "noopener"
    document.body.appendChild(link)
    link.click()
    link.remove()
    pushShareNotice("开始下载壁纸")
  } catch {
    pushShareNotice("下载失败，请稍后重试")
  } finally {
    downloading.value = false
  }
}

/** 分享：优先系统分享面板，退回复制链接 */
const shareWallpaper = async () => {
  const shareUrl = `${window.location.origin}/wallpaper/${wallpaper.value.id}`
  if (navigator.share) {
    try {
      await navigator.share({ title: "Wallbay 壁纸", url: shareUrl })
      return
    } catch {
      /* 用户取消 */
    }
  }
  try {
    await navigator.clipboard.writeText(shareUrl)
    pushShareNotice("链接已复制到剪贴板")
  } catch {
    toast.error("复制失败，请手动复制地址栏链接")
  }
}

onMounted(() => {
  fetchWallpaperDetail()
  window.addEventListener("keydown", handleKeydown)
})

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      imageLoaded.value = false
      imageError.value = false
      lightboxVisible.value = false
      resetLightboxTransform()
      relatedWallpapers.value = []
      shareNotice.value = ""
      showCollectionMenu.value = false
      fetchWallpaperDetail()
    }
  },
)

onUnmounted(() => {
  loading.value = false
  window.removeEventListener("keydown", handleKeydown)
})
</script>

<style scoped>
/* 预览图 → 原图 淡出过渡 */
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.3s ease;
}
.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}
</style>
