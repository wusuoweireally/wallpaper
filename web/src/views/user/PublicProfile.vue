<template>
  <div class="wb-page">
    <div class="wb-container-gallery py-5">
      <div v-if="loadingProfile" class="flex justify-center py-20">
        <span class="wb-spinner wb-spinner-lg text-muted"></span>
      </div>
      <template v-else-if="profile">
        <header
          class="wb-page-head mb-5 flex flex-wrap items-center gap-4 border-b border-line pb-4"
        >
          <img
            :src="profile.avatarUrl || '/defaultAvatar.png'"
            class="h-12 w-12 rounded-full object-cover ring-1 ring-line"
            alt=""
            @error="onAvatarError"
          />
          <div class="min-w-0 flex-1">
            <h1 class="wb-page-title">{{ profile.username }}</h1>
            <p v-if="profile.bio" class="mt-0.5 text-xs text-muted">{{ profile.bio }}</p>
          </div>
          <router-link to="/wallpapers" class="wb-link text-sm">浏览壁纸</router-link>
        </header>

        <h2 class="mb-3 text-sm font-medium text-muted">公开上传</h2>

        <div
          v-if="error"
          class="border-[color:var(--wb-danger)]/30 rounded-tile border bg-[color:var(--wb-danger-subtle)] px-3 py-2 text-sm text-[color:var(--wb-danger)]"
        >
          {{ error }}
        </div>

        <div v-else-if="loadingList" class="flex justify-center py-16">
          <span class="wb-spinner text-muted"></span>
        </div>

        <WallpaperGrid
          v-else-if="items.length > 0"
          :wallpapers="items"
          :loading="false"
          :show-pagination="false"
          :show-reset="false"
          masonry
        />

        <!-- 空态：壁纸网格的文案面向筛选场景，这里给出主页语境 -->
        <div v-else class="wb-empty">
          <p class="text-base font-medium text-fg">TA 还没有公开的壁纸</p>
          <p class="mt-1 text-sm text-muted">去看看其他作者的作品吧</p>
          <router-link to="/wallpapers" class="wb-btn-primary mt-5">浏览壁纸</router-link>
        </div>

        <div v-if="!loadingList && hasMore" class="mt-6 flex justify-center">
          <button type="button" class="wb-btn" :disabled="loadingMore" @click="loadMore">
            {{ loadingMore ? "加载中…" : "加载更多" }}
          </button>
        </div>
      </template>
      <div v-else class="py-20 text-center text-muted">用户不存在</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import { wallpaperService, type Wallpaper } from "@/services/wallpaper"
import WallpaperGrid from "@/components/WallpaperGrid.vue"

const route = useRoute()
const userId = () => Number(route.params.id)

const profile = ref<{
  id: number
  username: string
  avatarUrl?: string
  bio?: string
} | null>(null)
const loadingProfile = ref(true)
const loadingList = ref(false)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const items = ref<Wallpaper[]>([])
/** 分页状态：不靠一次拉 40 条静默截断 */
const page = ref(1)
const pageSize = 24
const hasMore = ref(false)

const onAvatarError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = "/defaultAvatar.png"
}

const loadProfile = async () => {
  loadingProfile.value = true
  try {
    const res = await wallpaperService.getPublicUser(userId())
    if (res.success && res.data) profile.value = res.data
    else profile.value = null
  } catch {
    profile.value = null
  } finally {
    loadingProfile.value = false
  }
}

const loadList = async (append = false) => {
  loadingList.value = !append
  error.value = null
  if (!append) items.value = []
  try {
    const res = await wallpaperService.getPublicUserUploads(userId(), page.value, pageSize)
    items.value = append ? [...items.value, ...(res.data || [])] : res.data || []
    const p = res.pagination
    hasMore.value = !!p && p.page < p.pages
  } catch (e: unknown) {
    error.value = (e as Error).message || "加载失败"
  } finally {
    loadingList.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value) return
  loadingMore.value = true
  page.value += 1
  try {
    await loadList(true)
  } finally {
    loadingMore.value = false
  }
}

onMounted(() => {
  // 两个请求互不依赖，并行加载
  void loadProfile()
  void loadList()
})

watch(
  () => route.params.id,
  () => {
    page.value = 1
    hasMore.value = false
    void loadProfile()
    void loadList()
  },
)
</script>
