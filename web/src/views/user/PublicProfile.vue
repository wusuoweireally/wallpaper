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
            :src="resolveAvatarUrl(profile.avatarUrl)"
            class="h-12 w-12 rounded-full object-cover ring-1 ring-line"
            alt=""
            @error="handleAvatarError"
          />
          <div class="min-w-0 flex-1">
            <h1 class="wb-page-title">{{ profile.username }}</h1>
            <p v-if="profile.bio" class="mt-0.5 text-xs text-muted">{{ profile.bio }}</p>
          </div>
          <router-link to="/wallpapers" class="wb-link text-sm">浏览壁纸</router-link>
        </header>

        <h2 class="mb-3 text-sm font-medium text-muted">公开上传</h2>

        <!-- 首屏加载失败：还没内容，可整块提示 -->
        <div
          v-if="listError && items.length === 0"
          class="wb-alert px-3 py-2.5 text-sm"
        >
          {{ listError }}
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

        <!-- 追加失败：行内提示，顶掉已加载网格太伤浏览体验 -->
        <div
          v-if="appendError"
          class="mt-4 flex items-center justify-center gap-3 text-sm text-[color:var(--wb-danger)]"
        >
          <span>{{ appendError }}</span>
          <button type="button" class="wb-btn-ghost wb-btn-sm" @click="retryAppend">重试</button>
        </div>

        <div v-if="!loadingList && hasMore && !appendError" class="mt-6 flex justify-center">
          <button type="button" class="wb-btn" :disabled="loadingMore" @click="loadMore">
            {{ loadingMore ? "加载中…" : "加载更多" }}
          </button>
        </div>

        <!-- TA 的帖子：独立分页，与上方壁纸互不影响 -->
        <section class="mt-10">
          <h2 class="mb-3 text-sm font-medium text-muted">TA 的帖子</h2>

          <div v-if="postsError" class="wb-alert px-3 py-2.5 text-sm">
            {{ postsError }}
          </div>

          <div v-else-if="postsLoading" class="flex justify-center py-12">
            <span class="wb-spinner text-muted"></span>
          </div>

          <div v-else-if="posts.length > 0" class="space-y-4">
            <PostCard v-for="post in posts" :key="post.id" :post="post" @like="() => {}" />
          </div>

          <div v-else class="wb-empty">
            <p class="text-base font-medium text-fg">TA 还没有发过帖子</p>
            <router-link to="/forums" class="wb-btn mt-5">去逛论坛</router-link>
          </div>

          <div
            v-if="!postsLoading && posts.length > 0 && postsPagination.totalPages > 1"
            class="mt-6 flex justify-center"
          >
            <Pagination
              :current-page="postsPagination.currentPage"
              :total-pages="postsPagination.totalPages"
              @change="handlePostsPageChange"
            />
          </div>
        </section>
      </template>
      <div v-else class="py-20 text-center text-muted">用户不存在</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import { wallpaperService, type Wallpaper } from "@/services/wallpaper"
import { forumService } from "@/services/forum"
import type { Post } from "@/stores/forum"
import WallpaperGrid from "@/components/WallpaperGrid.vue"
import PostCard from "@/components/PostCard.vue"
import Pagination from "@/components/Pagination.vue"
import { usePaginatedList } from "@/composables/usePaginatedList"
import { resolveAvatarUrl, handleAvatarError } from "@/utils/avatar"

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
/** 首屏列表错误与追加错误分开：追加失败不能顶掉已加载的网格 */
const listError = ref<string | null>(null)
const appendError = ref("")
const items = ref<Wallpaper[]>([])
/** 分页状态：不靠一次拉 40 条静默截断 */
const page = ref(1)
const pageSize = 24
const hasMore = ref(false)

/**
 * TA 的帖子：独立分页，与服务端 authorId 筛选直连。
 * fetcher 内读 userId() 而非闭包捕获，路由切人后自动指向新用户；
 * 过期响应由 composable 的代数守卫丢弃。
 */
const {
  items: posts,
  loading: postsLoading,
  error: postsError,
  pagination: postsPagination,
  fetchData: fetchPosts,
  handlePageChange: handlePostsPageChange,
} = usePaginatedList<Post>(
  (page, pageSize) =>
    forumService.getPosts({ authorId: userId(), page, limit: pageSize }),
  { errorMessage: "获取 TA 的帖子失败" },
)

const loadProfile = async () => {
  const requestedId = userId()
  loadingProfile.value = true
  try {
    const res = await wallpaperService.getPublicUser(requestedId)
    // 路由已切到别的用户时丢弃过期响应，避免头身不符
    if (requestedId !== userId()) return
    if (res.success && res.data) profile.value = res.data
    else profile.value = null
  } catch {
    if (requestedId !== userId()) return
    profile.value = null
  } finally {
    if (requestedId === userId()) loadingProfile.value = false
  }
}

const loadList = async (append = false) => {
  const requestedId = userId()
  loadingList.value = !append
  if (!append) {
    listError.value = null
    items.value = []
  }
  try {
    const res = await wallpaperService.getPublicUserUploads(
      requestedId,
      page.value,
      pageSize,
    )
    if (requestedId !== userId()) return
    items.value = append ? [...items.value, ...(res.data || [])] : res.data || []
    const p = res.pagination
    hasMore.value = !!p && p.page < p.pages
  } catch (e: unknown) {
    if (requestedId !== userId()) return
    const message = (e as Error).message || "加载失败"
    if (append) {
      // 页码回退：否则下次重试会跳过失败的那一页
      page.value = Math.max(1, page.value - 1)
      appendError.value = message
    } else {
      listError.value = message
    }
  } finally {
    if (requestedId === userId()) loadingList.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value) return
  loadingMore.value = true
  appendError.value = ""
  page.value += 1
  try {
    await loadList(true)
  } finally {
    loadingMore.value = false
  }
}

const retryAppend = () => {
  appendError.value = ""
  void loadMore()
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
    appendError.value = ""
    void loadProfile()
    void loadList()
    void fetchPosts(1)
  },
)
</script>
