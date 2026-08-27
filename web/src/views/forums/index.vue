<template>
  <div class="wb-page">
    <main class="wb-container-gallery space-y-4 py-5">
      <section class="wb-page-head flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="wb-page-title">论坛</h1>
          <p class="mt-0.5 max-w-xl text-xs text-muted">
            分享壁纸创作经验、技术讨论与资源
            <span class="ml-2 tabular-nums text-faint">
              {{ heroStats[0].value }} 帖 · {{ heroStats[1].value }} 热度 ·
              {{ heroStats[2].value }} 互动
            </span>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="wb-btn-primary h-8" @click="handleCreatePost">发帖</button>
          <button type="button" class="wb-btn h-8" @click="handleScrollToContent">浏览讨论</button>
        </div>
      </section>

      <!-- 主内容 -->
      <div id="forum-content" class="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <!-- 左：讨论区 -->
        <section class="space-y-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <form class="wb-nav-search min-w-0 flex-1 sm:max-w-xs" @submit.prevent>
                <i class="i-[mdi--magnify] shrink-0 text-base text-faint" aria-hidden="true"></i>
                <input
                  v-model="searchQuery"
                  type="search"
                  placeholder="搜索帖子…"
                  class="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
                  @input="handleSearch"
                />
              </form>
              <select
                v-model="forumStore.filters.sortBy"
                class="wb-input h-8 w-auto py-0 text-xs"
                @change="handleSortChange"
              >
                <option value="createdAt">最新</option>
                <option value="viewCount">最热</option>
                <option value="likeCount">点赞</option>
                <option value="commentCount">评论</option>
              </select>
            </div>
          </div>

          <!-- 分类 -->
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-full px-3.5 py-1.5 text-sm font-medium transition"
              :class="
                forumStore.filters.category === ''
                  ? 'bg-primary-fill text-primary-content'
                  : 'border border-line bg-subtle text-muted hover:border-primary/40 hover:text-primary'
              "
              @click="handleCategoryChange('')"
            >
              全部
            </button>
            <button
              v-for="category in forumStore.postCategories"
              :key="category.value"
              type="button"
              class="rounded-full px-3.5 py-1.5 text-sm font-medium transition"
              :class="
                forumStore.filters.category === category.value
                  ? 'bg-primary-fill text-primary-content'
                  : 'border border-line bg-subtle text-muted hover:border-primary/40 hover:text-primary'
              "
              @click="handleCategoryChange(category.value)"
            >
              {{ category.label }}
            </button>
          </div>

          <!-- 列表 -->
          <div
            v-if="forumStore.loading"
            class="flex min-h-[36vh] flex-col items-center justify-center gap-3"
          >
            <span class="wb-spinner wb-spinner-lg"></span>
            <p class="text-sm text-muted">正在加载讨论…</p>
          </div>

          <div v-else-if="forumStore.error" class="wb-alert-danger">
            <span>{{ forumStore.error }}</span>
            <button type="button" class="wb-btn-ghost wb-btn-xs" @click="handleRetry">重试</button>
          </div>

          <div v-else class="space-y-4">
            <PostCard
              v-for="post in forumStore.filteredPosts"
              :key="post.id"
              :post="post"
              @like="handleLike"
              @comment="handleComment"
              @edit="handleEdit"
              @delete="handleDelete"
              @share="handleShare"
            />

            <div v-if="forumStore.filteredPosts.length === 0" class="wb-empty">
              <p class="text-base font-semibold text-fg">
                {{
                  forumStore.filters.search ? "没有找到相关帖子" : "暂时还没有帖子，来分享第一个吧"
                }}
              </p>
              <p class="mt-1 text-sm text-muted">可调整分类/排序，或直接发布新讨论</p>
              <div class="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" class="wb-btn-primary" @click="handleCreatePost">
                  发布帖子
                </button>
                <button
                  v-if="forumStore.filters.search || forumStore.filters.category"
                  type="button"
                  class="wb-btn"
                  @click="clearFilters"
                >
                  清除筛选
                </button>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div
            v-if="forumStore.filteredPosts.length > 0 && forumStore.postsPagination.totalPages > 1"
            class="pt-2"
          >
            <Pagination
              :current-page="forumStore.postsPagination.currentPage"
              :total-pages="forumStore.postsPagination.totalPages"
              @change="goToPage"
            />
          </div>
        </section>

        <!-- 右：侧栏 -->
        <aside class="space-y-4">
          <div>
            <div class="mb-3 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-fg">热门帖子</h3>
                <p class="text-xs text-faint">按热度排序</p>
              </div>
            </div>
            <ul v-if="forumStore.popularPosts.length" class="space-y-2.5">
              <li
                v-for="(post, index) in forumStore.popularPosts"
                :key="`popular-${post.id}`"
                class="cursor-pointer rounded-control border border-line bg-subtle p-3 transition hover:border-primary/40 hover:bg-primary/5"
                @click="$router.push(`/forums/post/${post.id}`)"
              >
                <div class="flex items-start gap-3">
                  <span
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                    :class="
                      index < 3 ? 'bg-primary-fill text-primary-content' : 'bg-inset text-muted'
                    "
                  >
                    {{ index + 1 }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="line-clamp-2 text-sm font-medium text-fg">
                      {{ post.title }}
                    </p>
                    <div class="mt-1.5 flex gap-3 text-xs text-faint">
                      <span>阅 {{ formatNumber(post.viewCount) }}</span>
                      <span>赞 {{ formatNumber(post.likeCount) }}</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
            <p v-else class="py-6 text-center text-sm text-faint">暂无热门帖子</p>
          </div>

          <div class="rounded-tile border border-line p-4">
            <h3 class="text-sm font-semibold text-fg">快速发帖</h3>
            <p class="mt-1 text-xs text-muted">有灵感就写下标题，可先存草稿再完善。</p>
            <div class="mt-3 space-y-2">
              <button type="button" class="wb-btn-primary w-full" @click="handleCreatePost">
                去创作
              </button>
              <button type="button" class="wb-btn w-full" @click="clearFilters">重置筛选</button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue"
import { useRouter } from "vue-router"
import { useForumStore } from "@/stores/forum"
import { useUserStore } from "@/stores/user"
import { forumService } from "@/services/forum"
import PostCard from "@/components/PostCard.vue"
import Pagination from "@/components/Pagination.vue"
import type { Post, PostCategory } from "@/stores/forum"
import { formatNumber } from "@/utils/format"
import { createFetchGeneration } from "@/utils/fetchGeneration"

defineOptions({ name: "ForumIndex" })

const router = useRouter()
const forumStore = useForumStore()
const userStore = useUserStore()

const searchQuery = ref("")
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
type CategoryFilter = PostCategory["value"] | ""

const heroStats = computed(() => [
  {
    label: "帖子",
    hint: "当前列表总数",
    value: formatNumber(forumStore.postsPagination.totalCount || 0),
  },
  {
    label: "热度",
    hint: "热门帖浏览合计",
    value: formatNumber(
      forumStore.popularPosts.slice(0, 5).reduce((sum, item) => sum + (item.viewCount || 0), 0),
    ),
  },
  {
    label: "互动",
    hint: "点赞 + 评论",
    value: formatNumber(
      forumStore.posts.reduce(
        (sum, item) => sum + (item.likeCount || 0) + (item.commentCount || 0),
        0,
      ),
    ),
  },
])

// 列表请求代数：筛选/分类快速切换时丢弃过期响应
const postsFetchGeneration = createFetchGeneration()

const fetchPosts = async (reset = false) => {
  if (reset) {
    forumStore.setPostsPagination({ currentPage: 1 })
  }

  const gen = postsFetchGeneration.next()
  const isCurrent = () => postsFetchGeneration.isCurrent(gen)

  try {
    forumStore.setLoading(true)
    forumStore.setError(null)

    const { data, pagination } = await forumService.getPosts({
      page: forumStore.postsPagination.currentPage,
      limit: forumStore.postsPagination.pageSize,
      sortBy: forumStore.filters.sortBy,
      sortOrder: forumStore.filters.sortOrder as "ASC" | "DESC",
      category: forumStore.filters.category || undefined,
      search: forumStore.filters.search || undefined,
    })

    // 已有更新请求发出，过期响应直接丢弃
    if (!isCurrent()) return

    forumStore.setPosts(data)
    forumStore.setPostsPagination({
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      totalCount: pagination.totalCount,
    })
  } catch (error) {
    if (!isCurrent()) return
    console.error("获取帖子失败:", error)
    forumStore.setError("获取帖子失败，请稍后重试")
  } finally {
    if (isCurrent()) {
      forumStore.setLoading(false)
    }
  }
}

/** 筛选/页码变化时同步到 URL（省略默认值），便于分享与后退还原 */
const syncQuery = () => {
  const query: Record<string, string> = {}
  const { category, sortBy, search } = forumStore.filters
  if (category) query.category = category
  if (sortBy && sortBy !== "createdAt") query.sort = sortBy
  if (search) query.search = search
  const page = forumStore.postsPagination.currentPage
  if (page > 1) query.page = String(page)
  router.replace({ query })
}

const normalizeCategory = (value: unknown): CategoryFilter => {
  if (typeof value !== "string" || value === "") {
    return ""
  }
  const match = forumStore.postCategories.find((item) => item.value === value)
  return match ? match.value : ""
}

const handleRetry = () => {
  fetchPosts()
}

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    forumStore.updateFilters({ search: searchQuery.value })
    fetchPosts(true)
    syncQuery()
  }, 500)
}

const handleCategoryChange = (category: CategoryFilter) => {
  const newCategory = forumStore.filters.category === category ? "" : category
  forumStore.updateFilters({ category: newCategory })
  fetchPosts(true)
  syncQuery()
}

const handleSortChange = () => {
  fetchPosts(true)
  syncQuery()
}

const clearFilters = () => {
  forumStore.resetFilters()
  searchQuery.value = ""
  fetchPosts(true)
  syncQuery()
}

const handleScrollToContent = () => {
  const el = document.getElementById("forum-content")
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= forumStore.postsPagination.totalPages) {
    forumStore.setPostsPagination({ currentPage: page })
    fetchPosts()
    syncQuery()
  }
}

const handleCreatePost = () => {
  if (!userStore.isLoggedIn) {
    router.push("/auth/login")
    return
  }
  router.push("/forums/new")
}

/** PostCard 内已完成 like API 与 store 更新，此处不再重复请求 */
const handleLike = (_post: Post) => {
  // no-op：保留事件位以兼容模板 @like
}

const handleComment = (post: Post) => {
  router.push(`/forums/post/${post.id}#comments`)
}

const handleEdit = (post: Post) => {
  router.push(`/forums/edit/${post.id}`)
}

/** PostCard 内已确认并调删除 API，这里经 store 同步移除与分页扣减；删空当前页时回退末页重拉 */
const handleDelete = (post: Post) => {
  const targetPage = forumStore.removePost(post.id)
  if (targetPage !== null) {
    fetchPosts()
    syncQuery()
  }
}

const handleShare = (post: Post) => {
  const shareUrl = `${window.location.origin}/forums/post/${post.id}`
  if (navigator.share) {
    navigator
      .share({
        title: post.title,
        text: post.summary || post.title,
        url: shareUrl,
      })
      .catch(() => {})
  } else {
    navigator.clipboard.writeText(shareUrl)
    // PostCard 内已 toast，此处不再弹窗
  }
}

onMounted(() => {
  const query = router.currentRoute.value.query
  if (query.category) {
    forumStore.updateFilters({ category: normalizeCategory(query.category) })
  }
  if (query.search) {
    searchQuery.value = query.search as string
    forumStore.updateFilters({ search: query.search as string })
  }
  if (typeof query.sort === "string" && query.sort) {
    forumStore.updateFilters({ sortBy: query.sort })
  }
  const page = Number(query.page) || 1
  if (page > 1) {
    forumStore.setPostsPagination({ currentPage: page })
  }
  fetchPosts()
})

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
    searchTimeout.value = null
  }
})

// 浏览器前进/后退等外部 query 变化时还原筛选并刷新
watch(
  () => router.currentRoute.value.query,
  (query) => {
    let changed = false
    const category = normalizeCategory(query.category)
    if (category !== forumStore.filters.category) {
      forumStore.updateFilters({ category })
      changed = true
    }
    const search = (query.search as string) || ""
    if (search !== forumStore.filters.search) {
      searchQuery.value = search
      forumStore.updateFilters({ search })
      changed = true
    }
    const sort = typeof query.sort === "string" ? query.sort : ""
    if (sort && sort !== forumStore.filters.sortBy) {
      forumStore.updateFilters({ sortBy: sort })
      changed = true
    }
    const page = Number(query.page) || 1
    if (page !== forumStore.postsPagination.currentPage) {
      forumStore.setPostsPagination({ currentPage: page })
      changed = true
    }
    if (changed) fetchPosts()
  },
)
</script>
