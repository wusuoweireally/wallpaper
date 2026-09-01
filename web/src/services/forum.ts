import api from "@/config/api"
import type { Post, Comment, PaginationData } from "@/stores/forum"

/**
 * 帖子创建和更新DTO
 */
export interface CreatePostDto {
  title: string
  content: string
  category: "tech_discussion" | "experience_sharing" | "q_a" | "resource_sharing"
  summary?: string
  tags?: string
  thumbnailUrl?: string
}

export interface UpdatePostDto {
  title?: string
  content?: string
  category?: "tech_discussion" | "experience_sharing" | "q_a" | "resource_sharing"
  summary?: string
  tags?: string
  thumbnailUrl?: string
}

/**
 * 评论创建和更新DTO
 */
export interface CreateCommentDto {
  content: string
  postId: number
  parentId?: number
}

export interface UpdateCommentDto {
  content: string
}

/**
 * 帖子查询参数
 */
export interface PostsQueryParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  category?: "tech_discussion" | "experience_sharing" | "q_a" | "resource_sharing"
  search?: string
  authorId?: number
  tags?: string[]
}

/**
 * 评论查询参数
 */
export interface CommentsQueryParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  parentId?: number
}

/** 将后端分页格式转为前端 PaginationData */
const toPagination = (p?: {
  page?: number
  limit?: number
  total?: number
  pages?: number
}): PaginationData => ({
  currentPage: p?.page || 1,
  totalPages: p?.pages || 0,
  totalCount: p?.total || 0,
  pageSize: p?.limit || 20,
})

/**
 * 论坛API服务
 *
 * 注意：axios 响应拦截器已做 success:false→reject + response.data 解包，
 * 故本层无需再检查 response.success，直接返回 response.data 即可。
 * 帖子详情的 isLiked / isBookmarked 由 GET /posts/:id 一次返回，无需再打状态接口。
 */
export const forumService = {
  // ========== 帖子 ==========

  async getPosts(params: PostsQueryParams = {}) {
    const payload = await api.get<Post[]>("/posts", {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || "createdAt",
        sortOrder: params.sortOrder || "DESC",
        category: params.category,
        search: params.search,
        authorId: params.authorId,
        tags: params.tags?.join(","),
      },
    })
    return { data: payload.data || [], pagination: toPagination(payload.pagination) }
  },

  async getPost(id: number): Promise<Post> {
    const payload = await api.get<Post>(`/posts/${id}`)
    return payload.data as Post
  },

  async createPost(postData: CreatePostDto): Promise<Post> {
    const payload = await api.post<Post>("/posts", postData)
    return payload.data as Post
  },

  async updatePost(id: number, postData: UpdatePostDto): Promise<Post> {
    const payload = await api.put<Post>(`/posts/${id}`, postData)
    return payload.data as Post
  },

  async deletePost(id: number): Promise<void> {
    await api.delete(`/posts/${id}`, { skipGlobalErrorToast: true })
  },

  async likePost(id: number): Promise<{ isLiked: boolean; likeCount: number }> {
    const payload = await api.post<{ isLiked: boolean; likeCount: number }>(
      `/posts/${id}/like`,
      undefined,
      { skipGlobalErrorToast: true },
    )
    return payload.data as { isLiked: boolean; likeCount: number }
  },

  async unlikePost(id: number): Promise<{ isLiked: boolean; likeCount: number }> {
    const payload = await api.delete<{ isLiked: boolean; likeCount: number }>(
      `/posts/${id}/like`,
      { skipGlobalErrorToast: true },
    )
    return payload.data as { isLiked: boolean; likeCount: number }
  },

  async sharePost(id: number): Promise<void> {
    await api.post(`/posts/${id}/share`)
  },

  async bookmarkPost(id: number): Promise<void> {
    await api.post(`/posts/${id}/bookmark`, undefined, {
      skipGlobalErrorToast: true,
    })
  },

  async unbookmarkPost(id: number): Promise<void> {
    await api.delete(`/posts/${id}/bookmark`, {
      skipGlobalErrorToast: true,
    })
  },

  /**
   * 当前用户收藏的帖子分页列表（输出塑形与 getPosts 一致，PostCard 可直接复用）
   */
  async listMyBookmarks(params: { page?: number; limit?: number } = {}) {
    const payload = await api.get<Post[]>("/users/bookmarks", {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
      },
    })
    return { data: payload.data || [], pagination: toPagination(payload.pagination) }
  },

  // ========== 评论 ==========

  async getPostComments(postId: number, params: CommentsQueryParams = {}) {
    const payload = await api.get<Comment[]>(`/comments/post/${postId}`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || "createdAt",
        sortOrder: params.sortOrder || "ASC",
        parentId: params.parentId,
      },
    })
    return { data: payload.data || [], pagination: toPagination(payload.pagination) }
  },

  async createComment(commentData: CreateCommentDto): Promise<Comment> {
    const payload = await api.post<Comment>("/comments", commentData)
    return payload.data as Comment
  },

  async updateComment(id: number, commentData: UpdateCommentDto): Promise<Comment> {
    const payload = await api.put<Comment>(`/comments/${id}`, commentData)
    return payload.data as Comment
  },

  async deleteComment(id: number): Promise<void> {
    await api.delete(`/comments/${id}`)
  },

  async toggleCommentLike(id: number): Promise<{ isLiked: boolean; likeCount: number }> {
    const payload = await api.post<{ isLiked: boolean; likeCount: number }>(
      `/comments/${id}/like`,
      undefined,
      { skipGlobalErrorToast: true },
    )
    return payload.data as { isLiked: boolean; likeCount: number }
  },
}
