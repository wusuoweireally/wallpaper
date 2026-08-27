import { defineStore } from "pinia"
import { ref, computed } from "vue"

// 论坛数据类型定义
export interface Post {
  id: number
  title: string
  content: string
  category: "tech_discussion" | "experience_sharing" | "q_a" | "resource_sharing"
  status: "draft" | "published" | "moderated" | "hidden"
  authorId: number
  author?: {
    id: number
    username: string
    avatarUrl?: string | null
  }
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  isPinned: boolean
  isFeatured: boolean
  lastCommentAt?: string
  tags?: string
  summary?: string
  thumbnailUrl?: string
  createdAt: string
  updatedAt: string
  metadata?: string
  // 前端扩展字段（详情/列表由后端 OptionalJwt 填充）
  isLiked?: boolean
  isBookmarked?: boolean
}

export interface Comment {
  id: number
  content: string
  postId: number
  authorId: number
  parentId?: number
  author?: {
    id: number
    username: string
    avatarUrl?: string | null
  }
  likeCount: number
  createdAt: string
  updatedAt: string
  // 前端扩展字段
  replies?: Comment[] // 子评论列表
  isLiked?: boolean // 当前用户是否点赞
}

export interface PostCategory {
  value: "tech_discussion" | "experience_sharing" | "q_a" | "resource_sharing"
  label: string
  color: string
}

/** 帖子分类中文映射（value → 展示名），供视图层直接复用 */
export const POST_CATEGORY_LABELS: Record<string, string> = {
  tech_discussion: "技术讨论",
  experience_sharing: "经验分享",
  q_a: "问答求助",
  resource_sharing: "资源分享",
}

/** 取分类展示名，未知或空分类回退「未分类」 */
export const postCategoryLabel = (category: string): string =>
  POST_CATEGORY_LABELS[category] || "未分类"

export interface PaginationData {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
}

/**
 * 论坛状态管理
 *
 * 管理论坛相关的状态，包括：
 * - 帖子列表和筛选
 * - 分页和搜索状态
 * - 用户交互状态（点赞等）
 *
 * 评论数据由详情页本地管理，不进 store。
 */
export const useForumStore = defineStore("forum", () => {
  // 状态定义
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 帖子相关状态
  const posts = ref<Post[]>([])
  const postsPagination = ref<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    pageSize: 20,
  })

  // 筛选和搜索状态
  const filters = ref({
    category: "" as PostCategory["value"] | "",
    sortBy: "createdAt", // createdAt, viewCount, likeCount, popular
    sortOrder: "DESC" as "ASC" | "DESC",
    search: "",
    authorId: null as number | null,
    tags: [] as string[],
  })

  // 帖子分类配置
  const postCategories = ref<PostCategory[]>([
    { value: "tech_discussion", label: POST_CATEGORY_LABELS.tech_discussion, color: "blue" },
    { value: "experience_sharing", label: POST_CATEGORY_LABELS.experience_sharing, color: "green" },
    { value: "q_a", label: POST_CATEGORY_LABELS.q_a, color: "yellow" },
    { value: "resource_sharing", label: POST_CATEGORY_LABELS.resource_sharing, color: "purple" },
  ])

  // 计算属性
  const filteredPosts = computed(() => {
    return posts.value.filter((post) => {
      let matches = true

      // 分类筛选
      if (filters.value.category && post.category !== filters.value.category) {
        matches = false
      }

      // 搜索筛选
      if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase()
        matches =
          matches &&
          (post.title.toLowerCase().includes(searchLower) ||
            post.content.toLowerCase().includes(searchLower) ||
            (post.summary && post.summary.toLowerCase().includes(searchLower)))
      }

      // 标签筛选
      if (filters.value.tags.length > 0 && post.tags) {
        const postTags = post.tags.split(",").map((tag) => tag.trim())
        matches =
          matches &&
          filters.value.tags.some((tag) =>
            postTags.some((postTag) => postTag.toLowerCase().includes(tag.toLowerCase())),
          )
      }

      return matches
    })
  })

  const popularPosts = computed(() => {
    return [...posts.value].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10)
  })

  const categoryLabel = computed(() => (categoryValue: string) => {
    const category = postCategories.value.find((cat) => cat.value === categoryValue)
    return category?.label || categoryValue
  })

  // Actions
  const setLoading = (state: boolean) => {
    loading.value = state
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const setPosts = (newPosts: Post[]) => {
    posts.value = newPosts
  }

  const setPostsPagination = (pagination: Partial<PaginationData>) => {
    postsPagination.value = { ...postsPagination.value, ...pagination }
  }

  const updateFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      category: "",
      sortBy: "createdAt",
      sortOrder: "DESC",
      search: "",
      authorId: null,
      tags: [],
    }
    postsPagination.value.currentPage = 1
  }

  /**
   * 从列表移除帖子并同步分页推导：扣减 totalCount、收缩 totalPages。
   * 若当前页因此被删空且不在首页，则把页码回退到剩余内容的最后一页，
   * 返回该目标页码供视图重新拉取；未触发翻页时返回 null
   */
  const removePost = (postId: number): number | null => {
    posts.value = posts.value.filter((p) => p.id !== postId)
    postsPagination.value.totalCount = Math.max(0, postsPagination.value.totalCount - 1)
    const remainingTotalPages = Math.max(
      1,
      Math.ceil(postsPagination.value.totalCount / postsPagination.value.pageSize),
    )
    postsPagination.value.totalPages = remainingTotalPages

    if (filteredPosts.value.length === 0 && postsPagination.value.currentPage > 1) {
      const targetPage = Math.min(postsPagination.value.currentPage - 1, remainingTotalPages)
      postsPagination.value.currentPage = targetPage
      return targetPage
    }
    return null
  }

  const togglePostLike = (postId: number, isLiked: boolean) => {
    const post = posts.value.find((p) => p.id === postId)
    if (post) {
      post.isLiked = isLiked
      post.likeCount += isLiked ? 1 : -1
    }
  }

  return {
    // 状态
    loading,
    error,
    posts,
    postsPagination,
    filters,
    postCategories,

    // 计算属性
    filteredPosts,
    popularPosts,
    categoryLabel,

    // 方法
    setLoading,
    setError,
    setPosts,
    setPostsPagination,
    updateFilters,
    resetFilters,
    removePost,
    togglePostLike,
  }
})
