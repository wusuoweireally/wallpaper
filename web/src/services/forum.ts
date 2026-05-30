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
const toPagination = (p?: { page?: number; limit?: number; total?: number; pages?: number }): PaginationData => ({
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
 */
export const forumService = {
  // ========== 帖子 ==========

  async getPosts(params: PostsQueryParams = {}) {
    const payload: any = await api.get("/posts", {
      params: {
        page: params.page || 1, limit: params.limit || 20,
        sortBy: params.sortBy || "createdAt", sortOrder: params.sortOrder || "DESC",
        category: params.category, search: params.search,
        authorId: params.authorId, tags: params.tags?.join(","),
      },
    })
    return { data: payload.data || [], pagination: toPagination(payload.pagination) }
  },

  async getPost(id: number): Promise<Post> {
    const payload: any = await api.get(`/posts/${id}`)
    return payload.data
  },

  async createPost(postData: CreatePostDto): Promise<Post> {
    const payload: any = await api.post("/posts", postData)
    return payload.data
  },

  async updatePost(id: number, postData: UpdatePostDto): Promise<Post> {
    const payload: any = await api.put(`/posts/${id}`, postData)
    return payload.data
  },

  async deletePost(id: number): Promise<void> {
    await api.delete(`/posts/${id}`)
  },

  async likePost(id: number): Promise<void> {
    await api.post(`/posts/${id}/like`)
  },

  async unlikePost(id: number): Promise<void> {
    await this.likePost(id) // toggle 模式
  },

  async checkLikeStatus(id: number): Promise<{ hasLiked: boolean }> {
    const payload: any = await api.get(`/posts/${id}/like`)
    return payload.data
  },

  async sharePost(id: number): Promise<void> {
    await api.post(`/posts/${id}/share`)
  },

  async bookmarkPost(id: number): Promise<void> {
    await api.post(`/posts/${id}/bookmark`)
  },

  async unbookmarkPost(id: number): Promise<void> {
    await this.bookmarkPost(id) // toggle 模式
  },

  async checkBookmarkStatus(id: number): Promise<{ hasBookmarked: boolean }> {
    const payload: any = await api.get(`/posts/${id}/bookmark`)
    return payload.data
  },

  async getMyBookmarks(params: { page?: number; limit?: number } = {}) {
    const payload: any = await api.get("/posts/user/bookmarks", {
      params: { page: params.page || 1, limit: params.limit || 20 },
    })
    return { data: payload.data || [], pagination: toPagination(payload.pagination) }
  },

  async getPopularPosts(limit = 10): Promise<Post[]> {
    const payload: any = await api.get("/posts/popular/list", { params: { limit } })
    return payload.data
  },

  async getLatestPosts(limit = 10): Promise<Post[]> {
    const payload: any = await api.get("/posts/latest/list", { params: { limit } })
    return payload.data
  },

  async getMyPosts(params: { page?: number; limit?: number } = {}) {
    const payload: any = await api.get("/posts/user/my", {
      params: { page: params.page || 1, limit: params.limit || 20 },
    })
    return { data: payload.data || [], pagination: toPagination(payload.pagination) }
  },

  // ========== 评论 ==========

  async getPostComments(postId: number, params: CommentsQueryParams = {}) {
    const payload: any = await api.get(`/comments/post/${postId}`, {
      params: {
        page: params.page || 1, limit: params.limit || 20,
        sortBy: params.sortBy || "createdAt", sortOrder: params.sortOrder || "ASC",
        parentId: params.parentId,
      },
    })
    return { data: payload.data || [], pagination: toPagination(payload.pagination) }
  },

  async getComment(id: number): Promise<Comment> {
    const payload: any = await api.get(`/comments/${id}`)
    return payload.data
  },

  async createComment(commentData: CreateCommentDto): Promise<Comment> {
    const payload: any = await api.post("/comments", commentData)
    return payload.data
  },

  async updateComment(id: number, commentData: UpdateCommentDto): Promise<Comment> {
    const payload: any = await api.put(`/comments/${id}`, commentData)
    return payload.data
  },

  async deleteComment(id: number): Promise<void> {
    await api.delete(`/comments/${id}`)
  },

  async getCommentReplies(parentCommentId: number): Promise<Comment[]> {
    const payload: any = await api.get(`/comments/${parentCommentId}/replies`)
    return payload.data
  },

  async getCommentStats(postId: number) {
    const payload: any = await api.get(`/comments/stats/${postId}`)
    return payload.data
  },

  async getMyComments(params: { page?: number; limit?: number } = {}) {
    const payload: any = await api.get("/comments/user/my", {
      params: { page: params.page || 1, limit: params.limit || 20 },
    })
    return { data: payload.data || [], pagination: toPagination(payload.pagination) }
  },

  async getLatestComments(limit = 10): Promise<Comment[]> {
    const payload: any = await api.get("/comments/latest/list", { params: { limit } })
    return payload.data
  },

  async toggleCommentLike(id: number) {
    const payload: any = await api.post(`/comments/${id}/like`)
    return payload.data
  },

  async getCommentLikeStatus(id: number) {
    const payload: any = await api.get(`/comments/${id}/like-status`)
    return payload.data
  },

  async getMyLikedComments(params: { page?: number; limit?: number } = {}) {
    const payload: any = await api.get("/comments/user/liked", {
      params: { page: params.page || 1, limit: params.limit || 20 },
    })
    return { data: payload.data || [], pagination: toPagination(payload.pagination) }
  },
}
