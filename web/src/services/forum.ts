import api from '@/config/api';
import type { Post, Comment, PaginationData } from '@/stores/forum';

/**
 * API 响应类型定义
 */
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * 帖子创建和更新DTO
 */
export interface CreatePostDto {
  title: string;
  content: string;
  category: 'tech_discussion' | 'experience_sharing' | 'q_a' | 'resource_sharing';
  summary?: string;
  tags?: string;
  thumbnailUrl?: string;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  category?: 'tech_discussion' | 'experience_sharing' | 'q_a' | 'resource_sharing';
  summary?: string;
  tags?: string;
  thumbnailUrl?: string;
}

/**
 * 评论创建和更新DTO
 */
export interface CreateCommentDto {
  content: string;
  postId: number;
  parentId?: number;
}

export interface UpdateCommentDto {
  content: string;
}

/**
 * 帖子查询参数
 */
export interface PostsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  category?: 'tech_discussion' | 'experience_sharing' | 'q_a' | 'resource_sharing';
  search?: string;
  authorId?: number;
  tags?: string[];
}

/**
 * 评论查询参数
 */
export interface CommentsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  parentId?: number;
}

/**
 * 论坛API服务
 *
 * 处理所有与论坛相关的HTTP请求，包括：
 * - 帖子的CRUD操作
 * - 评论的CRUD操作
 * - 点赞和统计功能
 * - 分页和搜索功能
 */
export const forumService = {
  /**
   * 帖子相关API
   */

  /**
   * 获取帖子列表
   *
   * @param params 查询参数
   * @returns 帖子列表和分页信息
   */
  async getPosts(params: PostsQueryParams = {}): Promise<{
    data: Post[];
    pagination: PaginationData;
  }> {
    const response: ApiResponse<Post[]> = await api.get('/posts', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'DESC',
        category: params.category,
        search: params.search,
        authorId: params.authorId,
        tags: params.tags?.join(','),
      },
    });

    if (response.success && response.data && response.pagination) {
      return {
        data: response.data,
        pagination: {
          currentPage: response.pagination.page,
          totalPages: response.pagination.pages,
          totalCount: response.pagination.total,
          pageSize: response.pagination.limit,
        },
      };
    }

    throw new Error(response.message || '获取帖子列表失败');
  },

  /**
   * 获取单个帖子详情
   *
   * @param id 帖子ID
   * @returns 帖子详情
   */
  async getPost(id: number): Promise<Post> {
    const response: ApiResponse<Post> = await api.get(`/posts/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '获取帖子详情失败');
  },

  /**
   * 创建新帖子
   *
   * @param postData 帖子数据
   * @returns 创建的帖子
   */
  async createPost(postData: CreatePostDto): Promise<Post> {
    const response: ApiResponse<Post> = await api.post('/posts', postData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '创建帖子失败');
  },

  /**
   * 更新帖子
   *
   * @param id 帖子ID
   * @param postData 更新数据
   * @returns 更新后的帖子
   */
  async updatePost(id: number, postData: UpdatePostDto): Promise<Post> {
    const response: ApiResponse<Post> = await api.put(`/posts/${id}`, postData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '更新帖子失败');
  },

  /**
   * 删除帖子
   *
   * @param id 帖子ID
   */
  async deletePost(id: number): Promise<void> {
    const response: ApiResponse = await api.delete(`/posts/${id}`);

    if (!response.success) {
      throw new Error(response.message || '删除帖子失败');
    }
  },

  /**
   * 点赞帖子
   *
   * @param id 帖子ID
   */
  async likePost(id: number): Promise<void> {
    const response: ApiResponse = await api.post(`/posts/${id}/like`);

    if (!response.success) {
      throw new Error(response.message || '点赞失败');
    }
  },

  /**
   * 取消点赞帖子
   *
   * @param id 帖子ID
   */
  async unlikePost(id: number): Promise<void> {
    const response: ApiResponse = await api.delete(`/posts/${id}/like`);

    if (!response.success) {
      throw new Error(response.message || '取消点赞失败');
    }
  },

  /**
   * 检查是否已点赞帖子
   *
   * @param id 帖子ID
   * @returns 点赞状态
   */
  async checkLikeStatus(id: number): Promise<{ hasLiked: boolean }> {
    const response: ApiResponse<{ hasLiked: boolean }> = await api.get(`/posts/${id}/like`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '获取点赞状态失败');
  },

  /**
   * 获取热门帖子
   *
   * @param limit 限制数量
   * @returns 热门帖子列表
   */
  async getPopularPosts(limit: number = 10): Promise<Post[]> {
    const response: ApiResponse<Post[]> = await api.get('/posts/popular/list', {
      params: { limit },
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '获取热门帖子失败');
  },

  /**
   * 获取最新帖子
   *
   * @param limit 限制数量
   * @returns 最新帖子列表
   */
  async getLatestPosts(limit: number = 10): Promise<Post[]> {
    const response: ApiResponse<Post[]> = await api.get('/posts/latest/list', {
      params: { limit },
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '获取最新帖子失败');
  },

  /**
   * 获取当前用户的帖子
   *
   * @param params 查询参数
   * @returns 用户帖子列表和分页信息
   */
  async getMyPosts(params: { page?: number; limit?: number } = {}): Promise<{
    data: Post[];
    pagination: PaginationData;
  }> {
    const response: ApiResponse<Post[]> = await api.get('/posts/user/my', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });

    if (response.success && response.data && response.pagination) {
      return {
        data: response.data,
        pagination: {
          currentPage: response.pagination.page,
          totalPages: response.pagination.pages,
          totalCount: response.pagination.total,
          pageSize: response.pagination.limit,
        },
      };
    }

    throw new Error(response.message || '获取用户帖子失败');
  },

  /**
   * 评论相关API
   */

  /**
   * 获取帖子的评论列表
   *
   * @param postId 帖子ID
   * @param params 查询参数
   * @returns 评论列表和分页信息
   */
  async getPostComments(postId: number, params: CommentsQueryParams = {}): Promise<{
    data: Comment[];
    pagination: PaginationData;
  }> {
    const response: ApiResponse<Comment[]> = await api.get(`/comments/post/${postId}`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'ASC',
        parentId: params.parentId,
      },
    });

    if (response.success && response.data && response.pagination) {
      return {
        data: response.data,
        pagination: {
          currentPage: response.pagination.page,
          totalPages: response.pagination.pages,
          totalCount: response.pagination.total,
          pageSize: response.pagination.limit,
        },
      };
    }

    throw new Error(response.message || '获取评论列表失败');
  },

  /**
   * 获取单个评论详情
   *
   * @param id 评论ID
   * @returns 评论详情
   */
  async getComment(id: number): Promise<Comment> {
    const response: ApiResponse<Comment> = await api.get(`/comments/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '获取评论详情失败');
  },

  /**
   * 创建新评论
   *
   * @param commentData 评论数据
   * @returns 创建的评论
   */
  async createComment(commentData: CreateCommentDto): Promise<Comment> {
    const response: ApiResponse<Comment> = await api.post('/comments', commentData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '创建评论失败');
  },

  /**
   * 更新评论
   *
   * @param id 评论ID
   * @param commentData 更新数据
   * @returns 更新后的评论
   */
  async updateComment(id: number, commentData: UpdateCommentDto): Promise<Comment> {
    const response: ApiResponse<Comment> = await api.put(`/comments/${id}`, commentData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '更新评论失败');
  },

  /**
   * 删除评论
   *
   * @param id 评论ID
   */
  async deleteComment(id: number): Promise<void> {
    const response: ApiResponse = await api.delete(`/comments/${id}`);

    if (!response.success) {
      throw new Error(response.message || '删除评论失败');
    }
  },

  /**
   * 获取评论的子评论
   *
   * @param parentCommentId 父评论ID
   * @returns 子评论列表
   */
  async getCommentReplies(parentCommentId: number): Promise<Comment[]> {
    const response: ApiResponse<Comment[]> = await api.get(`/comments/${parentCommentId}/replies`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '获取回复列表失败');
  },

  /**
   * 获取帖子的评论统计信息
   *
   * @param postId 帖子ID
   * @returns 评论统计信息
   */
  async getCommentStats(postId: number): Promise<{
    totalComments: number;
    topLevelComments: number;
  }> {
    const response: ApiResponse<{
      totalComments: number;
      topLevelComments: number;
    }> = await api.get(`/comments/stats/${postId}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '获取评论统计失败');
  },

  /**
   * 获取当前用户的评论
   *
   * @param params 查询参数
   * @returns 用户评论列表和分页信息
   */
  async getMyComments(params: { page?: number; limit?: number } = {}): Promise<{
    data: Comment[];
    pagination: PaginationData;
  }> {
    const response: ApiResponse<Comment[]> = await api.get('/comments/user/my', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });

    if (response.success && response.data && response.pagination) {
      return {
        data: response.data,
        pagination: {
          currentPage: response.pagination.page,
          totalPages: response.pagination.pages,
          totalCount: response.pagination.total,
          pageSize: response.pagination.limit,
        },
      };
    }

    throw new Error(response.message || '获取用户评论失败');
  },

  /**
   * 获取最新评论
   *
   * @param limit 限制数量
   * @returns 最新评论列表
   */
  async getLatestComments(limit: number = 10): Promise<Comment[]> {
    const response: ApiResponse<Comment[]> = await api.get('/comments/latest/list', {
      params: { limit },
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '获取最新评论失败');
  },

  /**
   * 点赞/取消点赞评论
   *
   * @param id 评论ID
   * @returns 点赞结果
   */
  async toggleCommentLike(id: number): Promise<{
    isLiked: boolean;
    likeCount: number;
  }> {
    const response: ApiResponse<{
      isLiked: boolean;
      likeCount: number;
    }> = await api.post(`/comments/${id}/like`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '评论点赞操作失败');
  },

  /**
   * 检查用户是否对评论点赞
   *
   * @param id 评论ID
   * @returns 点赞状态
   */
  async getCommentLikeStatus(id: number): Promise<{
    isLiked: boolean;
    likeCount: number;
  }> {
    const response: ApiResponse<{
      isLiked: boolean;
      likeCount: number;
    }> = await api.get(`/comments/${id}/like-status`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '获取评论点赞状态失败');
  },

  /**
   * 获取用户点赞的评论列表
   *
   * @param params 查询参数
   * @returns 用户点赞的评论列表和分页信息
   */
  async getMyLikedComments(params: { page?: number; limit?: number } = {}): Promise<{
    data: Comment[];
    pagination: PaginationData;
  }> {
    const response: ApiResponse<Comment[]> = await api.get('/comments/user/liked', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });

    if (response.success && response.data && response.pagination) {
      return {
        data: response.data,
        pagination: {
          currentPage: response.pagination.page,
          totalPages: response.pagination.pages,
          totalCount: response.pagination.total,
          pageSize: response.pagination.limit,
        },
      };
    }

    throw new Error(response.message || '获取用户点赞评论失败');
  },
};