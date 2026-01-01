<template>
  <div class="relative min-h-screen bg-[#f5f6fa]">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute -left-24 top-6 h-72 w-72 rounded-full bg-[#dceafe] opacity-60 blur-3xl"
      ></div>
      <div
        class="absolute right-[-80px] top-16 h-80 w-80 rounded-full bg-[#fde2c5] opacity-70 blur-3xl"
      ></div>
      <div
        class="absolute left-1/3 top-52 h-56 w-56 rounded-full bg-[#e8e7ff] opacity-60 blur-3xl"
      ></div>
    </div>

    <div class="relative mx-auto max-w-5xl px-4 py-10">
      <div v-if="loading" class="flex min-h-[50vh] items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-slate-500">
          <div class="loading loading-spinner loading-lg text-primary"></div>
          <p class="text-sm">正在加载帖子...</p>
        </div>
      </div>

      <div v-else-if="error" class="py-12 text-center">
        <div
          class="border-error/30 bg-error/5 mx-auto mb-4 max-w-md rounded-2xl border px-4 py-3 text-error shadow"
        >
          <i class="i-mdi-alert-circle mr-2"></i>
          <span>{{ error }}</span>
        </div>
        <button @click="router.back()" class="btn btn-primary">返回</button>
      </div>

      <template v-else-if="post">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button class="btn btn-ghost btn-sm" @click="router.back()">
            <i class="i-mdi-arrow-left text-lg"></i>
            返回列表
          </button>
          <div class="flex flex-wrap gap-2">
            <button
              class="btn btn-ghost btn-sm"
              @click="openReportModal"
              :disabled="!userStore.isLoggedIn"
              title="举报帖子"
            >
              <i class="i-mdi-flag text-lg"></i>
              举报
            </button>
            <div class="dropdown dropdown-end">
              <label tabindex="0" class="btn btn-ghost btn-sm">
                <i class="i-mdi-share text-lg"></i>
                分享
              </label>
              <ul
                tabindex="0"
                class="dropdown-content menu w-36 rounded-box border border-base-200 bg-base-100 p-2 shadow"
              >
                <li><a @click="shareToWeChat">微信</a></li>
                <li><a @click="shareToWeibo">微博</a></li>
                <li><a @click="copyLink">复制链接</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div
          class="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/50 backdrop-blur-sm"
        >
          <div
            class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent"
          ></div>
          <div class="relative">
            <div
              class="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-900 via-indigo-600 to-amber-500 shadow-lg"
            ></div>
            <div class="relative space-y-7 p-7 lg:p-10">
              <div class="flex flex-wrap items-start gap-5">
                <div class="relative">
                  <div class="avatar">
                    <div
                      v-if="authorAvatar"
                      class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-gradient-to-br from-slate-100 to-slate-200 shadow-lg"
                    >
                      <img
                        :src="authorAvatar"
                        :alt="post.author?.username || '用户头像'"
                        class="h-full w-full object-cover"
                      />
                    </div>
                    <div
                      v-else
                      class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg"
                    >
                      <span class="text-xl font-bold text-white">
                        {{ post.author?.username?.charAt(0)?.toUpperCase() || "U" }}
                      </span>
                    </div>
                  </div>
                  <div
                    class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-lg"
                  ></div>
                </div>
                <div class="min-w-[200px] flex-1 space-y-3">
                  <div class="flex flex-wrap items-center gap-3">
                    <span class="text-base font-bold text-slate-900">
                      {{ post.author?.username || "未知用户" }}
                    </span>
                    <span
                      class="badge badge-sm border-none bg-gradient-to-r from-blue-500 to-indigo-600 font-medium text-white shadow-md"
                    >
                      {{ getCategoryName(post.category) }}
                    </span>
                    <span class="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      {{ formatTime(post.createdAt) }}
                    </span>
                    <span
                      v-if="post.updatedAt && post.updatedAt !== post.createdAt"
                      class="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-600"
                    >
                      ✏️ 已编辑
                    </span>
                  </div>
                  <h1
                    class="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-4xl font-bold leading-tight text-transparent lg:text-5xl"
                  >
                    {{ post.title }}
                  </h1>
                  <p v-if="post.summary" class="text-base leading-relaxed text-slate-600">
                    {{ post.summary }}
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in getTagList(post.tags || '').slice(0, 6)"
                      :key="tag"
                      class="badge badge-sm border-slate-300 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      #{{ tag }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-4 text-sm">
                    <div class="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                      <i class="i-mdi-eye text-slate-600"></i>
                      <span class="font-medium text-slate-700">{{ post.viewCount || 0 }}</span>
                      <span class="text-slate-500">浏览</span>
                    </div>
                    <div class="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1">
                      <i class="i-mdi-comment text-blue-600"></i>
                      <span class="font-medium text-blue-700">{{ post.commentCount || 0 }}</span>
                      <span class="text-blue-500">评论</span>
                    </div>
                    <div class="flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1">
                      <i class="i-mdi-heart text-rose-600"></i>
                      <span class="font-medium text-rose-700">{{ post.likeCount || 0 }}</span>
                      <span class="text-rose-500">点赞</span>
                    </div>
                  </div>
                </div>
                <div v-if="isAuthor" class="dropdown dropdown-end">
                  <label
                    tabindex="0"
                    class="btn btn-ghost btn-sm btn-circle shadow-md transition-shadow hover:shadow-lg"
                  >
                    <i class="i-mdi-dots-horizontal text-slate-600"></i>
                  </label>
                  <ul
                    tabindex="0"
                    class="dropdown-content menu w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                  >
                    <li class="rounded-xl hover:bg-slate-50">
                      <a @click="editPost" class="text-slate-700">
                        <i class="i-mdi-pencil"></i>
                        编辑
                      </a>
                    </li>
                    <li class="rounded-xl hover:bg-rose-50">
                      <a class="text-rose-600" @click="deletePost">
                        <i class="i-mdi-delete"></i>
                        删除
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- eslint-disable-next-line vue/no-v-html -->
              <div
                class="prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose max-w-none text-slate-800"
                v-html="sanitizedContent"
              ></div>

              <div
                class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 shadow-inner"
              >
                <div class="flex items-center gap-5 text-sm">
                  <div class="flex items-center gap-2 text-slate-600">
                    <i class="i-mdi-eye text-lg"></i>
                    <span class="font-medium">{{ post.viewCount || 0 }}</span>
                    <span>次浏览</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-600">
                    <i class="i-mdi-comment text-lg"></i>
                    <span class="font-medium">{{ post.commentCount || 0 }}</span>
                    <span>条评论</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-600">
                    <i class="i-mdi-heart text-lg"></i>
                    <span class="font-medium">{{ post.likeCount || 0 }}</span>
                    <span>人点赞</span>
                  </div>
                </div>
                <button
                  class="group btn btn-sm relative overflow-hidden"
                  :class="
                    isLiked
                      ? 'btn-error shadow-lg shadow-rose-500/30'
                      : 'btn-outline hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600'
                  "
                  @click="toggleLike"
                  :disabled="!userStore.isLoggedIn || likeLoading"
                >
                  <span class="loading loading-spinner loading-xs" v-if="likeLoading"></span>
                  <i
                    class="i-mdi-heart transition-all"
                    :class="isLiked ? 'fill-current text-white' : 'group-hover:scale-110'"
                  ></i>
                  <span class="font-medium">{{ isLiked ? "已点赞" : "点赞" }}</span>
                  <span
                    v-if="post.likeCount > 0"
                    class="badge badge-outline badge-sm ml-1"
                    :class="isLiked ? 'border-white text-white' : 'border-rose-300 text-rose-600'"
                  >
                    {{ post.likeCount }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          class="relative mt-8 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-200/30 backdrop-blur-sm"
        >
          <div
            class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-100/30 to-purple-100/30 blur-3xl"
          ></div>
          <div class="relative">
            <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div
                  class="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 shadow-lg shadow-indigo-500/30"
                >
                  <i class="i-mdi-comment text-2xl text-white"></i>
                </div>
                <div>
                  <h2
                    class="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-bold text-transparent"
                  >
                    评论区
                  </h2>
                  <p class="text-sm text-slate-500">共 {{ comments.length }} 条评论</p>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-for="option in commentSortOptions"
                  :key="option.value"
                  class="btn btn-sm transition-all"
                  :class="
                    commentSort === option.value
                      ? 'btn-primary shadow-md shadow-blue-500/25 hover:shadow-blue-500/40'
                      : 'btn-ghost hover:bg-slate-100'
                  "
                  @click="
                    () => {
                      commentSort = option.value
                      loadComments()
                    }
                  "
                >
                  {{ option.emoji }} {{ option.label }}
                </button>
              </div>
            </div>

            <div
              v-if="!userStore.isLoggedIn"
              class="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 text-sm shadow-inner"
            >
              <div class="flex items-center gap-3">
                <div class="rounded-full bg-amber-100 p-2">
                  <i class="i-mdi-information text-lg text-amber-600"></i>
                </div>
                <div class="flex-1">
                  <p class="mb-1 font-medium text-slate-700">登录后即可参与讨论</p>
                  <p class="text-xs text-slate-600">与作者互动，分享你的想法和见解</p>
                </div>
                <button
                  class="btn btn-primary btn-sm shadow-md transition-shadow hover:shadow-lg"
                  @click="router.push('/auth/login')"
                >
                  <i class="i-mdi-login"></i>
                  去登录
                </button>
              </div>
            </div>

            <div class="mb-8">
              <div
                class="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-inner"
              >
                <label class="label mb-3">
                  <span class="label-text font-semibold text-slate-800"> 💭 写下你的看法 </span>
                  <span class="label-text-alt text-slate-500">{{ newComment.length }}/1000</span>
                </label>
                <textarea
                  v-model="newComment"
                  placeholder="分享你的见解，与作者和其他读者互动... (Ctrl + Enter 快速发表)"
                  class="textarea-bordered textarea h-32 w-full resize-none bg-white transition-colors focus:border-slate-900"
                  maxlength="1000"
                  @keydown.enter.ctrl.exact.prevent="submitComment"
                  @keydown.enter.shift.prevent="newComment += '\n'"
                ></textarea>
                <div class="mt-3 flex items-center justify-between">
                  <div class="flex items-center gap-3 text-xs text-slate-500">
                    <span class="flex items-center gap-1">
                      <i class="i-mdi-emoticon-happy-outline"></i>
                      友善交流
                    </span>
                    <span class="flex items-center gap-1">
                      <i class="i-mdi-shield-check"></i>
                      理性讨论
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      v-if="commentSubmitting"
                      class="loading loading-spinner loading-xs text-primary"
                    ></span>
                    <button
                      class="group btn btn-primary btn-sm shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:hover:scale-100"
                      @click="submitComment"
                      :disabled="!userStore.isLoggedIn || !newComment.trim() || commentSubmitting"
                    >
                      <i class="i-mdi-send transition-transform group-hover:translate-x-0.5"></i>
                      <span class="font-medium">{{
                        commentSubmitting ? "发布中..." : "发表评论"
                      }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="comments.length === 0 && !loading"
              class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center"
            >
              <div class="flex flex-col items-center gap-3">
                <div class="rounded-full bg-slate-200 p-4">
                  <i class="i-mdi-comment-outline text-4xl text-slate-400"></i>
                </div>
                <p class="text-lg font-semibold text-slate-700">暂无评论</p>
                <p class="text-sm text-slate-500">快来发表第一条评论吧！</p>
              </div>
            </div>

            <div v-else-if="comments.length > 0" class="space-y-4">
              <CommentItem
                v-for="comment in comments"
                :key="comment.id"
                :comment="comment"
                @like="handleCommentLike"
                @edit="handleCommentEdit"
                @delete="handleCommentDelete"
                @reply="handleCommentReply"
                @refresh="loadComments"
              />
            </div>

            <div v-if="hasMoreComments" class="mt-8 text-center">
              <button
                class="group btn btn-outline btn-wide shadow-md transition-all hover:scale-105 hover:shadow-lg"
                @click="loadMoreComments"
                :disabled="loadingMore"
              >
                <span class="loading loading-spinner loading-sm mr-2" v-if="loadingMore"></span>
                <i
                  class="i-mdi-chevron-down transition-transform group-hover:translate-y-0.5"
                  v-else
                ></i>
                {{ loadingMore ? "加载中..." : "加载更多评论" }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <ReportModal
        ref="reportModalRef"
        :target-type="'post'"
        :target-id="postId"
        @success="handleReportSuccess"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { forumService } from "@/services/forum"
import { useUserStore } from "@/stores"
import type { Post, Comment } from "@/stores/forum"
import CommentItem from "@/components/CommentItem.vue"
import ReportModal from "@/components/ReportModal.vue"
import { resolveAvatarUrl } from "@/utils/avatar"
import { sanitizeHtml } from "@/utils/htmlSanitizer"

// 路由和状态管理
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(true)
const error = ref("")
const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const newComment = ref("")
const commentSubmitting = ref(false)
const likeLoading = ref(false)
const isLiked = ref(false)
const commentSort = ref("newest")
const commentSortOptions = [
  { value: "newest", label: "最新", emoji: "🕒" },
  { value: "oldest", label: "最早", emoji: "⏰" },
  { value: "popular", label: "最热", emoji: "🔥" },
]
const currentPage = ref(1)
const hasMoreComments = ref(false)
const loadingMore = ref(false)
const reportModalRef = ref<InstanceType<typeof ReportModal>>()

// 计算属性
const postId = computed(() => parseInt(route.params.id as string))

const isAuthor = computed(() => {
  return post.value?.authorId === userStore.user?.id
})

const authorAvatar = computed(() => {
  const raw = post.value?.author?.avatarUrl || post.value?.author?.profilePicture || undefined
  return resolveAvatarUrl(raw)
})

// 清理后的帖子内容（防止XSS攻击）
const sanitizedContent = computed(() => {
  return post.value ? sanitizeHtml(post.value.content) : ""
})

const updateCommentTree = (
  list: Comment[],
  targetId: number,
  updater: (comment: Comment) => void,
): boolean => {
  for (const comment of list) {
    if (comment.id === targetId) {
      updater(comment)
      return true
    }
    if (comment.replies && updateCommentTree(comment.replies, targetId, updater)) {
      return true
    }
  }
  return false
}

const removeCommentFromTree = (list: Comment[], targetId: number): boolean => {
  const index = list.findIndex((comment) => comment.id === targetId)
  if (index !== -1) {
    list.splice(index, 1)
    return true
  }
  for (const comment of list) {
    if (comment.replies && removeCommentFromTree(comment.replies, targetId)) {
      return true
    }
  }
  return false
}

// 方法
const getCategoryName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    tech_discussion: "技术讨论",
    experience_sharing: "经验分享",
    q_a: "问答求助",
    resource_sharing: "资源分享",
  }
  return categoryMap[category] || "未分类"
}

const getTagList = (tags: string): string[] => {
  return tags
    ? tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
    : []
}

const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

const loadPost = async () => {
  try {
    loading.value = true
    error.value = ""

    post.value = await forumService.getPost(postId.value)

    // 更新页面标题
    document.title = `${post.value.title} - 壁纸论坛`

    // 检查点赞状态
    if (userStore.isLoggedIn) {
      await checkLikeStatus()
    }
  } catch (err: any) {
    console.error("加载帖子失败:", err)
    error.value = err.message || "帖子加载失败"
  } finally {
    loading.value = false
  }
}

const loadComments = async (reset: boolean = true) => {
  if (!post.value) return

  try {
    if (reset) {
      currentPage.value = 1
      loadingMore.value = false
      comments.value = [] // 重置评论列表
    }

    const sortOptions: Record<string, any> = {
      newest: { sortBy: "createdAt", sortOrder: "DESC" as const },
      oldest: { sortBy: "createdAt", sortOrder: "ASC" as const },
      popular: { sortBy: "likeCount", sortOrder: "DESC" as const },
    }

    const result = await forumService.getPostComments(post.value.id, {
      page: currentPage.value,
      limit: 20,
      ...sortOptions[commentSort.value],
    })

    if (result && result.data) {
      if (reset) {
        comments.value = result.data
      } else {
        comments.value = [...comments.value, ...result.data]
      }

      hasMoreComments.value = result.pagination.currentPage < result.pagination.totalPages
    } else {
      console.warn("评论数据格式不正确:", result)
      if (reset) {
        comments.value = []
      }
    }
  } catch (err: any) {
    console.error("加载评论失败:", err)
    // 显示错误提示
    if (reset) {
      comments.value = []
    }
    // 可以在这里添加用户友好的错误提示
    // alert(err.message || "加载评论失败，请稍后重试");
  }
}

const loadMoreComments = async () => {
  if (loadingMore.value || !hasMoreComments.value) return

  try {
    loadingMore.value = true
    currentPage.value++
    await loadComments(false)
  } finally {
    loadingMore.value = false
  }
}

const checkLikeStatus = async () => {
  try {
    const status = await forumService.checkLikeStatus(postId.value)
    isLiked.value = status.hasLiked
  } catch (err) {
    console.error("检查点赞状态失败:", err)
  }
}

const toggleLike = async () => {
  if (!userStore.isLoggedIn || !post.value) return

  try {
    likeLoading.value = true

    if (isLiked.value) {
      await forumService.unlikePost(postId.value)
      isLiked.value = false
      post.value.likeCount = Math.max(0, (post.value.likeCount || 0) - 1)
    } else {
      await forumService.likePost(postId.value)
      isLiked.value = true
      post.value.likeCount = (post.value.likeCount || 0) + 1
    }
  } catch (err: any) {
    console.error("点赞操作失败:", err)
    alert(err.message || "操作失败")
  } finally {
    likeLoading.value = false
  }
}

const submitComment = async () => {
  if (!userStore.isLoggedIn || !post.value || !newComment.value.trim()) return

  try {
    commentSubmitting.value = true

    const comment = await forumService.createComment({
      content: newComment.value.trim(),
      postId: post.value.id,
    })

    comments.value.unshift(comment)
    newComment.value = ""

    // 更新帖子评论数
    if (post.value) {
      post.value.commentCount = (post.value.commentCount || 0) + 1
    }
  } catch (err: any) {
    console.error("发表评论失败:", err)
    alert(err.message || "发表评论失败")
  } finally {
    commentSubmitting.value = false
  }
}

const handleCommentLike = async (comment: Comment) => {
  try {
    const result = await forumService.toggleCommentLike(comment.id)
    updateCommentTree(comments.value, comment.id, (target) => {
      target.likeCount = result.likeCount
      target.isLiked = result.isLiked
    })
  } catch (err: any) {
    console.error("评论点赞失败:", err)
    alert(err.message || "操作失败")
  }
}

const handleCommentEdit = (updatedComment: Comment) => {
  updateCommentTree(comments.value, updatedComment.id, (target) => {
    Object.assign(target, updatedComment)
  })
}

const handleCommentDelete = (comment: Comment) => {
  if (removeCommentFromTree(comments.value, comment.id) && post.value) {
    post.value.commentCount = Math.max(0, (post.value.commentCount || 0) - 1)
  }
}

const handleCommentReply = (_comment?: Comment) => {
  // 回复后刷新评论列表
  loadComments()
}

const openReportModal = () => {
  reportModalRef.value?.openModal()
}

const handleReportSuccess = () => {
  // 举报成功后的处理，可以刷新评论列表或显示通知
}

const editPost = () => {
  if (post.value) {
    router.push(`/forums/edit/${post.value.id}`)
  }
}

const deletePost = async () => {
  if (!post.value || !confirm("确定要删除这篇帖子吗？删除后无法恢复。")) return

  try {
    await forumService.deletePost(post.value.id)
    alert("帖子已删除")
    router.push("/forums")
  } catch (err: any) {
    console.error("删除帖子失败:", err)
    alert(err.message || "删除失败")
  }
}

const shareToWeChat = () => {
  alert("请使用微信扫一扫功能分享")
}

const shareToWeibo = () => {
  if (post.value) {
    const url = window.location.href
    const title = post.value.title
    window.open(
      `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    )
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    alert("链接已复制到剪贴板")
  } catch {
    alert("复制失败，请手动复制链接")
  }
}

// 生命周期
onMounted(async () => {
  await loadPost()
  // 确保帖子加载完成后再加载评论
  if (post.value) {
    await loadComments()
  }
})

// 监听路由参数变化
watch(
  () => route.params.id,
  async () => {
    await loadPost()
    // 确保帖子加载完成后再加载评论
    if (post.value) {
      await loadComments()
    }
  },
)
</script>

<style scoped>
.prose {
  color: inherit;
}

.prose :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}

.prose :deep(blockquote) {
  border-left: 4px solid rgb(209 213 219);
  padding-left: 1rem;
  font-style: italic;
}

.prose :deep(code) {
  background-color: rgb(243 244 246);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.prose :deep(pre) {
  background-color: rgb(243 244 246);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.prose :deep(pre code) {
  background: transparent;
  padding: 0;
}

.prose :deep(a) {
  color: rgb(59 130 246);
  text-decoration: none;
}

.prose :deep(a:hover) {
  text-decoration: underline;
}

.prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid rgb(209 213 219);
}

.prose :deep(th),
.prose :deep(td) {
  border: 1px solid rgb(209 213 219);
  padding: 0.5rem 1rem;
}

.prose :deep(th) {
  background-color: rgb(249 250 251);
  font-weight: 600;
}
</style>
