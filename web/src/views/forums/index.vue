<template>
  <div
    class="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100"
  >
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute left-1/2 top-[-15%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-purple-200/50 blur-[200px] dark:bg-purple-900/30"
      ></div>
      <div
        class="absolute left-[10%] top-1/2 h-[22rem] w-[22rem] -translate-y-1/2 rounded-full bg-sky-200/40 blur-[220px] dark:bg-sky-900/30"
      ></div>
      <div
        class="absolute bottom-[-10%] right-[-5%] h-[28rem] w-[28rem] rounded-full bg-pink-100/60 blur-[200px] dark:bg-fuchsia-900/30"
      ></div>
    </div>

    <main class="relative mx-auto max-w-7xl space-y-10 px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <!-- Hero -->
      <section
        class="grid items-center gap-8 rounded-[2.5rem] bg-gradient-to-br from-white/90 via-white/80 to-white/60 p-8 shadow-2xl ring-1 ring-black/5 sm:p-10 lg:grid-cols-[1.25fr_0.75fr] dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-900/60 dark:ring-white/10"
      >
        <div class="space-y-6">
          <span
            class="inline-flex items-center gap-2 rounded-full bg-sky-100/80 px-4 py-1.5 text-sm font-medium text-sky-700 ring-1 ring-sky-200/70 dark:bg-sky-900/40 dark:text-sky-100 dark:ring-sky-800"
          >
            社区论坛
          </span>
          <div class="space-y-3">
            <h1 class="text-3xl font-bold tracking-tight sm:text-4xl dark:text-slate-100">
              创意灵感
              <span
                class="bg-gradient-to-r from-purple-600 to-sky-500 bg-clip-text text-transparent"
                >集散地</span
              >
            </h1>
            <p class="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              分享壁纸创作经验、技术讨论与资源。按分类与热度筛选，内容来自社区真实发帖。
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-500 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:scale-[1.02]"
              @click="handleCreatePost"
            >
              <span class="text-lg leading-none">+</span>
              立即发帖
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-6 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600"
              @click="handleScrollToContent"
            >
              浏览讨论
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 sm:grid-cols-1 sm:gap-3 lg:grid-cols-1">
          <div
            v-for="stat in heroStats"
            :key="stat.label"
            class="rounded-2xl border border-slate-100 bg-white/90 px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
          >
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ stat.label }}</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
              {{ stat.value }}
            </p>
            <p class="mt-0.5 text-xs text-slate-400">{{ stat.hint }}</p>
          </div>
        </div>
      </section>

      <!-- 主内容 -->
      <div id="forum-content" class="grid gap-6 lg:grid-cols-[1fr_320px]">
        <!-- 左：讨论区 -->
        <section
          class="space-y-5 rounded-[2.25rem] bg-white/85 p-5 shadow-2xl ring-1 ring-black/5 sm:p-7 dark:bg-slate-900/80 dark:ring-white/10"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">讨论区</h2>
              <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                按分类、热度或关键词筛选
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <div
                class="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-[0_0_0_3px] focus-within:shadow-primary/10 sm:flex-initial sm:w-56 dark:border-slate-600 dark:bg-slate-800/60 dark:focus-within:bg-slate-900"
              >
                <svg
                  class="h-4 w-4 shrink-0 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"
                  />
                </svg>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜索帖子..."
                  class="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
                  @input="handleSearch"
                />
              </div>
              <select
                v-model="forumStore.filters.sortBy"
                class="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-primary/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                @change="handleSortChange"
              >
                <option value="createdAt">最新</option>
                <option value="viewCount">最热</option>
                <option value="likeCount">点赞</option>
                <option value="commentCount">评论</option>
              </select>
              <button
                type="button"
                class="inline-flex h-10 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-content shadow-md shadow-primary/25 transition hover:brightness-110"
                @click="handleCreatePost"
              >
                <span>+</span>
                发帖
              </button>
            </div>
          </div>

          <!-- 分类 -->
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-full px-3.5 py-1.5 text-sm font-medium transition"
              :class="
                forumStore.filters.category === ''
                  ? 'bg-primary text-primary-content shadow-sm shadow-primary/25'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/40 hover:text-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
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
                  ? 'bg-primary text-primary-content shadow-sm shadow-primary/25'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/40 hover:text-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
              "
              @click="handleCategoryChange(category.value)"
            >
              {{ category.emoji || "" }} {{ category.label }}
            </button>
          </div>

          <!-- 列表 -->
          <div
            v-if="forumStore.loading"
            class="flex min-h-[36vh] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50"
          >
            <span
              class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
            ></span>
            <p class="text-sm text-slate-500">正在加载讨论...</p>
          </div>

          <div
            v-else-if="forumStore.error"
            class="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <span>{{ forumStore.error }}</span>
            <button
              type="button"
              class="rounded-full border border-red-300 px-3 py-1 text-xs font-medium hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40"
              @click="handleRetry"
            >
              重试
            </button>
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

            <div
              v-if="forumStore.filteredPosts.length === 0"
              class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-800/40"
            >
              <p class="text-base font-semibold text-slate-800 dark:text-slate-200">
                {{
                  forumStore.filters.search
                    ? "没有找到相关帖子"
                    : "暂时还没有帖子，来分享第一个吧"
                }}
              </p>
              <p class="mt-1 text-sm text-slate-500">
                可调整分类/排序，或直接发布新讨论
              </p>
              <div class="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  class="rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-primary-content shadow-md shadow-primary/25"
                  @click="handleCreatePost"
                >
                  发布帖子
                </button>
                <button
                  v-if="forumStore.filters.search || forumStore.filters.category"
                  type="button"
                  class="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                  @click="forumStore.resetFilters(); searchQuery = ''; fetchPosts(true)"
                >
                  清除筛选
                </button>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div
            v-if="forumStore.filteredPosts.length > 0 && forumStore.postsPagination.totalPages > 1"
            class="flex flex-wrap items-center justify-center gap-1.5 pt-2"
          >
            <button
              type="button"
              class="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              :disabled="forumStore.postsPagination.currentPage === 1"
              @click="goToPage(forumStore.postsPagination.currentPage - 1)"
            >
              ‹
            </button>
            <button
              v-for="(page, index) in visiblePages"
              :key="typeof page === 'number' ? `page-${page}` : `ellipsis-${index}`"
              type="button"
              class="inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-medium transition"
              :class="
                page === forumStore.postsPagination.currentPage
                  ? 'bg-primary text-primary-content shadow-sm shadow-primary/25'
                  : typeof page === 'string'
                    ? 'cursor-default text-slate-400'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
              "
              :disabled="typeof page === 'string'"
              @click="typeof page === 'number' ? goToPage(page) : undefined"
            >
              {{ page }}
            </button>
            <button
              type="button"
              class="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              :disabled="
                forumStore.postsPagination.currentPage === forumStore.postsPagination.totalPages
              "
              @click="goToPage(forumStore.postsPagination.currentPage + 1)"
            >
              ›
            </button>
          </div>
        </section>

        <!-- 右：侧栏 -->
        <aside class="space-y-5">
          <div
            class="rounded-[2rem] bg-white/85 p-5 shadow-2xl ring-1 ring-black/5 dark:bg-slate-900/80 dark:ring-white/10"
          >
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">热门帖子</h3>
                <p class="text-xs text-slate-500">按热度排序</p>
              </div>
            </div>
            <ul v-if="forumStore.popularPosts.length" class="space-y-2.5">
              <li
                v-for="(post, index) in forumStore.popularPosts"
                :key="`popular-${post.id}`"
                class="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-primary/30 hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-primary/40"
                @click="$router.push(`/forums/post/${post.id}`)"
              >
                <div class="flex items-start gap-3">
                  <span
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    :class="
                      index < 3
                        ? 'bg-primary text-primary-content'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    "
                  >
                    {{ index + 1 }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p
                      class="line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200"
                    >
                      {{ post.title }}
                    </p>
                    <div class="mt-1.5 flex gap-3 text-xs text-slate-400">
                      <span>阅 {{ formatNumber(post.viewCount) }}</span>
                      <span>赞 {{ formatNumber(post.likeCount) }}</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
            <p v-else class="py-6 text-center text-sm text-slate-400">暂无热门帖子</p>
          </div>

          <div
            class="rounded-[2rem] bg-white/85 p-5 shadow-2xl ring-1 ring-black/5 dark:bg-slate-900/80 dark:ring-white/10"
          >
            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">快速发帖</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              有灵感就写下标题，可先存草稿再完善。
            </p>
            <div class="mt-4 space-y-2">
              <button
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-content shadow-md shadow-primary/25 transition hover:brightness-110"
                @click="handleCreatePost"
              >
                去创作
              </button>
              <button
                type="button"
                class="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                @click="forumStore.resetFilters(); searchQuery = ''; fetchPosts(true)"
              >
                重置筛选
              </button>
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
import type { Post, PostCategory } from "@/stores/forum"

defineOptions({ name: "ForumIndex" })

const router = useRouter()
const forumStore = useForumStore()
const userStore = useUserStore()

const searchQuery = ref("")
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
type CategoryFilter = PostCategory["value"] | ""

function formatNumber(num: number) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "w"
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k"
  }
  return num.toString()
}

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

const visiblePages = computed(() => {
  const current = forumStore.postsPagination.currentPage
  const total = forumStore.postsPagination.totalPages
  const delta = 2
  const range: number[] = []
  const rangeWithDots: (number | string)[] = []
  let l: number | undefined

  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    }
  }

  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push("...")
      }
    }
    rangeWithDots.push(i)
    l = i
  })

  return rangeWithDots
})

const fetchPosts = async (reset = false) => {
  if (reset) {
    forumStore.setPostsPagination({ currentPage: 1 })
  }

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

    forumStore.setPosts(data)
    forumStore.setPostsPagination({
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      totalCount: pagination.totalCount,
    })
  } catch (error) {
    console.error("获取帖子失败:", error)
    forumStore.setError("获取帖子失败，请稍后重试")
  } finally {
    forumStore.setLoading(false)
  }
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
  }, 500)
}

const handleCategoryChange = (category: CategoryFilter) => {
  const newCategory = forumStore.filters.category === category ? "" : category
  forumStore.updateFilters({ category: newCategory })
  fetchPosts(true)
}

const handleSortChange = () => {
  fetchPosts(true)
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
  }
}

const handleCreatePost = () => {
  if (!userStore.isLoggedIn) {
    router.push("/auth/login")
    return
  }
  router.push("/forums/new")
}

const handleLike = async (post: Post) => {
  if (!userStore.isLoggedIn) {
    router.push("/auth/login")
    return
  }
  try {
    const hasLiked = post.isLiked
    if (hasLiked) {
      await forumService.unlikePost(post.id)
      forumStore.togglePostLike(post.id, false)
    } else {
      await forumService.likePost(post.id)
      forumStore.togglePostLike(post.id, true)
    }
  } catch (error) {
    console.error("点赞操作失败:", error)
  }
}

const handleComment = (post: Post) => {
  router.push(`/forums/post/${post.id}#comments`)
}

const handleEdit = (post: Post) => {
  router.push(`/forums/edit/${post.id}`)
}

const handleDelete = async (post: Post) => {
  try {
    await forumService.deletePost(post.id)
    forumStore.setPosts(forumStore.posts.filter((p) => p.id !== post.id))
  } catch (error) {
    console.error("删除帖子失败:", error)
  }
}

const handleShare = (post: Post) => {
  const shareUrl = `${window.location.origin}/forums/post/${post.id}`
  if (navigator.share) {
    navigator.share({
      title: post.title,
      text: post.summary || post.title,
      url: shareUrl,
    })
  } else {
    navigator.clipboard.writeText(shareUrl)
    alert("链接已复制到剪贴板")
  }
}

onMounted(() => {
  const route = router.currentRoute.value
  if (route.query.category) {
    forumStore.updateFilters({ category: normalizeCategory(route.query.category) })
  }
  if (route.query.search) {
    searchQuery.value = route.query.search as string
    forumStore.updateFilters({ search: route.query.search as string })
  }
  fetchPosts()
})

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
    searchTimeout.value = null
  }
})

watch(
  () => router.currentRoute.value.query,
  (newQuery) => {
    if (newQuery.category !== forumStore.filters.category) {
      forumStore.updateFilters({
        category: normalizeCategory(newQuery.category),
      })
      fetchPosts(true)
    }
    if (newQuery.search !== forumStore.filters.search) {
      searchQuery.value = (newQuery.search as string) || ""
      forumStore.updateFilters({ search: (newQuery.search as string) || "" })
      fetchPosts(true)
    }
  },
)
</script>
