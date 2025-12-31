import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 论坛数据类型定义
export interface Post {
  id: number;
  title: string;
  content: string;
  category: 'tech_discussion' | 'experience_sharing' | 'q_a' | 'resource_sharing';
  status: 'draft' | 'published' | 'moderated' | 'hidden';
  authorId: number;
  author?: {
    id: number;
    username: string;
    email: string;
    profilePicture?: string | null;
    avatarUrl?: string | null;
  };
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isPinned: boolean;
  isFeatured: boolean;
  lastCommentAt?: string;
  tags?: string;
  summary?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: string;
  // 前端扩展字段
  isLiked?: boolean; // 当前用户是否点赞
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  parentId?: number;
  author?: {
    id: number;
    username: string;
    email: string;
    profilePicture?: string | null;
    avatarUrl?: string | null;
  };
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  // 前端扩展字段
  replies?: Comment[]; // 子评论列表
  isLiked?: boolean; // 当前用户是否点赞
}

export interface PostCategory {
  value: 'tech_discussion' | 'experience_sharing' | 'q_a' | 'resource_sharing';
  label: string;
  color: string;
  emoji?: string;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

/**
 * 论坛状态管理
 *
 * 管理论坛相关的状态，包括：
 * - 帖子列表和详情
 * - 评论列表和管理
 * - 用户交互状态（点赞、收藏等）
 * - 分页和搜索状态
 */
export const useForumStore = defineStore('forum', () => {
  // 状态定义
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 帖子相关状态
  const posts = ref<Post[]>([]);
  const currentPost = ref<Post | null>(null);
  const postsPagination = ref<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    pageSize: 20,
  });

  // 评论相关状态
  const comments = ref<Comment[]>([]);
  const commentsPagination = ref<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    pageSize: 20,
  });

  // 筛选和搜索状态
  const filters = ref({
    category: '' as PostCategory['value'] | '',
    sortBy: 'createdAt', // createdAt, viewCount, likeCount, popular
    sortOrder: 'DESC' as 'ASC' | 'DESC',
    search: '',
    authorId: null as number | null,
    tags: [] as string[],
  });

  // 帖子分类配置
  const postCategories = ref<PostCategory[]>([
    { value: 'tech_discussion', label: '技术讨论', color: 'blue', emoji: '💡' },
    { value: 'experience_sharing', label: '经验分享', color: 'green', emoji: '✨' },
    { value: 'q_a', label: '问答求助', color: 'yellow', emoji: '❓' },
    { value: 'resource_sharing', label: '资源分享', color: 'purple', emoji: '🎁' },
  ]);

  // 计算属性
  const filteredPosts = computed(() => {
    return posts.value.filter(post => {
      let matches = true;

      // 分类筛选
      if (filters.value.category && post.category !== filters.value.category) {
        matches = false;
      }

      // 搜索筛选
      if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase();
        matches = matches && (
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          (post.summary && post.summary.toLowerCase().includes(searchLower))
        );
      }

      // 标签筛选
      if (filters.value.tags.length > 0 && post.tags) {
        const postTags = post.tags.split(',').map(tag => tag.trim());
        matches = matches && filters.value.tags.some(tag =>
          postTags.some(postTag => postTag.toLowerCase().includes(tag.toLowerCase()))
        );
      }

      return matches;
    });
  });

  const popularPosts = computed(() => {
    return [...posts.value]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);
  });

  const categoryLabel = computed(() => (categoryValue: string) => {
    const category = postCategories.value.find(cat => cat.value === categoryValue);
    return category?.label || categoryValue;
  });

  const categoryColor = computed(() => (categoryValue: string) => {
    const category = postCategories.value.find(cat => cat.value === categoryValue);
    return category?.color || 'gray';
  });

  // Actions
  const setLoading = (state: boolean) => {
    loading.value = state;
  };

  const setError = (message: string | null) => {
    error.value = message;
  };

  const setPosts = (newPosts: Post[]) => {
    posts.value = newPosts;
  };

  const appendPosts = (newPosts: Post[]) => {
    posts.value.push(...newPosts);
  };

  const updatePost = (postId: number, updates: Partial<Post>) => {
    const index = posts.value.findIndex(post => post.id === postId);
    if (index !== -1) {
      posts.value[index] = { ...posts.value[index], ...updates };
    }

    if (currentPost.value && currentPost.value.id === postId) {
      currentPost.value = { ...currentPost.value, ...updates };
    }
  };

  const setCurrentPost = (post: Post | null) => {
    currentPost.value = post;
  };

  const setPostsPagination = (pagination: Partial<PaginationData>) => {
    postsPagination.value = { ...postsPagination.value, ...pagination };
  };

  const setComments = (newComments: Comment[]) => {
    comments.value = newComments;
  };

  const appendComment = (comment: Comment, parentId?: number) => {
    if (parentId) {
      // 添加子评论到指定父评论
      const parentComment = findCommentById(parentId);
      if (parentComment) {
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(comment);
      }
    } else {
      // 添加顶级评论
      comments.value.push(comment);
    }
  };

  const removeComment = (commentId: number) => {
    // 从顶级评论中删除
    const topLevelIndex = comments.value.findIndex(comment => comment.id === commentId);
    if (topLevelIndex !== -1) {
      comments.value.splice(topLevelIndex, 1);
      return;
    }

    // 从子评论中删除
    const parentComment = comments.value.find(comment =>
      comment.replies?.some(reply => reply.id === commentId)
    );
    if (parentComment && parentComment.replies) {
      const replyIndex = parentComment.replies.findIndex(reply => reply.id === commentId);
      if (replyIndex !== -1) {
        parentComment.replies.splice(replyIndex, 1);
      }
    }
  };

  const findCommentById = (commentId: number): Comment | null => {
    // 在顶级评论中查找
    const topLevelComment = comments.value.find(comment => comment.id === commentId);
    if (topLevelComment) {
      return topLevelComment;
    }

    // 在子评论中查找
    for (const parentComment of comments.value) {
      if (parentComment.replies) {
        const reply = parentComment.replies.find(reply => reply.id === commentId);
        if (reply) {
          return reply;
        }
      }
    }

    return null;
  };

  const updateComment = (commentId: number, updates: Partial<Comment>) => {
    const comment = findCommentById(commentId);
    if (comment) {
      Object.assign(comment, updates);
    }
  };

  const setCommentsPagination = (pagination: Partial<PaginationData>) => {
    commentsPagination.value = { ...commentsPagination.value, ...pagination };
  };

  const updateFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const resetFilters = () => {
    filters.value = {
      category: '',
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      search: '',
      authorId: null,
      tags: [],
    };
    postsPagination.value.currentPage = 1;
  };

  const togglePostLike = (postId: number, isLiked: boolean) => {
    const post = posts.value.find(p => p.id === postId);
    if (post) {
      post.isLiked = isLiked;
      post.likeCount += isLiked ? 1 : -1;
    }

    if (currentPost.value && currentPost.value.id === postId) {
      currentPost.value.isLiked = isLiked;
      currentPost.value.likeCount += isLiked ? 1 : -1;
    }
  };

  const incrementPostView = (postId: number) => {
    const post = posts.value.find(p => p.id === postId);
    if (post) {
      post.viewCount += 1;
    }

    if (currentPost.value && currentPost.value.id === postId) {
      currentPost.value.viewCount += 1;
    }
  };

  const incrementPostComment = (postId: number) => {
    const post = posts.value.find(p => p.id === postId);
    if (post) {
      post.commentCount += 1;
    }

    if (currentPost.value && currentPost.value.id === postId) {
      currentPost.value.commentCount += 1;
    }
  };

  const clearState = () => {
    posts.value = [];
    currentPost.value = null;
    comments.value = [];
    error.value = null;
    loading.value = false;
    resetFilters();
  };

  return {
    // 状态
    loading,
    error,
    posts,
    currentPost,
    postsPagination,
    comments,
    commentsPagination,
    filters,
    postCategories,

    // 计算属性
    filteredPosts,
    popularPosts,
    categoryLabel,
    categoryColor,

    // 方法
    setLoading,
    setError,
    setPosts,
    appendPosts,
    updatePost,
    setCurrentPost,
    setPostsPagination,
    setComments,
    appendComment,
    removeComment,
    updateComment,
    setCommentsPagination,
    updateFilters,
    resetFilters,
    togglePostLike,
    incrementPostView,
    incrementPostComment,
    clearState,
  };
});
