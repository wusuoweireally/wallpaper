<template>
  <div class="wb-page">
    <div class="wb-container max-w-5xl py-5">
      <div v-if="loading" class="flex min-h-[50vh] items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-muted">
          <div class="wb-spinner wb-spinner-lg"></div>
          <p class="text-sm">正在加载帖子…</p>
        </div>
      </div>

      <div v-else-if="error" class="py-12 text-center">
        <div class="wb-alert-danger mx-auto mb-4 max-w-md">
          <i class="i-[mdi--alert-circle]"></i>
          <span>{{ error }}</span>
        </div>
        <button @click="router.back()" class="wb-btn-primary">返回</button>
      </div>

      <template v-else-if="post">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button class="wb-btn-ghost wb-btn-sm" @click="router.back()">
            <i class="i-[mdi--arrow-left] text-lg"></i>
            返回列表
          </button>
          <div class="flex flex-wrap gap-2">
            <button
              class="wb-btn-ghost wb-btn-sm"
              @click="openReportModal"
              :disabled="!userStore.isLoggedIn"
              title="举报帖子"
            >
              <i class="i-[mdi--flag] text-lg"></i>
              举报
            </button>
            <div class="wb-drop wb-drop-end">
              <label tabindex="0" class="wb-btn-ghost wb-btn-sm">
                <i class="i-[mdi--share] text-lg"></i>
                分享
              </label>
              <ul tabindex="0" class="wb-drop-panel w-36 border border-line bg-surface p-2 shadow">
                <li v-if="canSystemShare"><a @click="shareSystem">系统分享</a></li>
                <li><a @click="shareToWeibo">微博</a></li>
                <li><a @click="copyLink">复制链接</a></li>
              </ul>
            </div>
            <button
              class="wb-btn-ghost wb-btn-sm"
              :class="isBookmarked ? 'text-warning' : ''"
              :disabled="!userStore.isLoggedIn || bookmarkLoading"
              @click="toggleBookmark"
              :title="isBookmarked ? '取消收藏' : '收藏帖子'"
            >
              <i
                :class="isBookmarked ? 'i-[mdi--bookmark]' : 'i-[mdi--bookmark-outline]'"
                class="text-lg"
              ></i>
              {{ isBookmarked ? "已收藏" : "收藏" }}
            </button>
          </div>
        </div>

        <!-- 帖子主体 -->
        <article class="wb-card overflow-hidden">
          <div class="space-y-7 p-6 lg:p-9">
            <div class="flex flex-wrap items-start gap-5">
              <div
                v-if="authorAvatar"
                class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-subtle ring-1 ring-line"
              >
                <img
                  :src="authorAvatar"
                  :alt="post.author?.username || '用户头像'"
                  class="h-full w-full object-cover"
                  @error="handleAvatarError"
                />
              </div>
              <div
                v-else
                class="flex h-14 w-14 items-center justify-center rounded-full bg-inset text-fg"
              >
                <span class="text-xl font-bold">
                  {{ post.author?.username?.charAt(0)?.toUpperCase() || "U" }}
                </span>
              </div>
              <div class="min-w-[200px] flex-1 space-y-3">
                <div class="flex flex-wrap items-center gap-3">
                  <span class="text-base font-semibold text-fg">
                    {{ post.author?.username || "未知用户" }}
                  </span>
                  <span class="wb-chip border-primary/30 bg-primary/10 text-primary">
                    {{ getCategoryName(post.category) }}
                  </span>
                  <span class="text-xs text-faint">
                    {{ formatTime(post.createdAt) }}
                  </span>
                  <span
                    v-if="post.updatedAt && post.updatedAt !== post.createdAt"
                    class="wb-chip border-warning/40 bg-warning/10 text-warning"
                  >
                    <i class="i-[mdi--pencil] mr-1 text-xs" aria-hidden="true"></i>
                    已编辑
                  </span>
                </div>
                <h1 class="text-2xl font-semibold leading-tight tracking-tight text-fg lg:text-3xl">
                  {{ post.title }}
                </h1>
                <p v-if="post.summary" class="text-base leading-relaxed text-muted">
                  {{ post.summary }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in getTagList(post.tags || '').slice(0, 6)"
                    :key="tag"
                    class="wb-chip"
                  >
                    #{{ tag }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-3 text-sm">
                  <div class="flex items-center gap-2 rounded-full bg-subtle px-3 py-1 text-muted">
                    <i class="i-[mdi--eye] text-faint"></i>
                    <span class="font-medium">{{ post.viewCount || 0 }}</span>
                    <span class="text-faint">浏览</span>
                  </div>
                  <div class="flex items-center gap-2 rounded-full bg-subtle px-3 py-1 text-muted">
                    <i class="i-[mdi--comment] text-faint"></i>
                    <span class="font-medium">{{ post.commentCount || 0 }}</span>
                    <span class="text-faint">评论</span>
                  </div>
                  <div class="flex items-center gap-2 rounded-full bg-subtle px-3 py-1">
                    <i class="i-[mdi--heart] text-primary"></i>
                    <span class="font-medium text-primary">{{ post.likeCount || 0 }}</span>
                    <span class="text-faint">点赞</span>
                  </div>
                </div>
              </div>
              <div v-if="isAuthor" class="wb-drop wb-drop-end">
                <label tabindex="0" class="wb-btn-ghost wb-btn-sm">
                  <i class="i-[mdi--dots-horizontal] text-muted"></i>
                </label>
                <ul
                  tabindex="0"
                  class="wb-drop-panel w-40 border border-line bg-surface p-2 shadow"
                >
                  <li>
                    <a @click="editPost">
                      <i class="i-[mdi--pencil]"></i>
                      编辑
                    </a>
                  </li>
                  <li>
                    <a class="text-error" @click="deletePost">
                      <i class="i-[mdi--delete]"></i>
                      删除
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="prose max-w-none text-fg" v-html="sanitizedContent"></div>

            <!-- 底部：点赞（统计在顶部信息区，这里只留操作） -->
            <div class="flex justify-end border-t border-line pt-5">
              <button
                class="wb-btn"
                :class="isLiked ? 'wb-btn-primary' : ''"
                @click="toggleLike"
                :disabled="!userStore.isLoggedIn || likeLoading"
              >
                <span class="wb-spinner" v-if="likeLoading"></span>
                <i class="i-[mdi--heart] transition-all" :class="isLiked ? 'fill-current' : ''"></i>
                <span class="font-medium">{{ isLiked ? "已点赞" : "点赞" }}</span>
              </button>
            </div>
          </div>
        </article>

        <!-- 评论区 -->
        <section id="comments" class="wb-card mt-6 scroll-mt-20 p-6 lg:p-8">
          <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-fg">评论区</h2>
              <p class="text-sm text-faint">共 {{ comments.length }} 条评论</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="option in commentSortOptions"
                :key="option.value"
                class="wb-btn wb-btn-sm"
                :class="commentSort === option.value ? 'wb-btn-primary' : ''"
                @click="
                  () => {
                    commentSort = option.value
                    loadComments()
                  }
                "
              >
                <i :class="option.icon" aria-hidden="true"></i>
                {{ option.label }}
              </button>
            </div>
          </div>

          <div
            v-if="!userStore.isLoggedIn"
            class="mb-6 flex flex-wrap items-center gap-3 rounded-control border border-warning/30 bg-[color:var(--wb-warning-subtle)] p-4"
          >
            <div class="min-w-40 flex-1">
              <p class="text-sm font-semibold text-[color:var(--wb-warning)]">登录后即可参与讨论</p>
              <p class="text-xs opacity-90">与作者互动，分享你的想法和见解</p>
            </div>
            <button class="wb-btn-primary wb-btn-sm" @click="router.push('/auth/login')">
              <i class="i-[mdi--login]"></i>
              去登录
            </button>
          </div>

          <div class="mb-8">
            <div class="rounded-control border border-line bg-surface p-5">
              <div class="mb-3 flex items-center justify-between">
                <span class="text-sm font-semibold text-fg">
                  <i class="i-[mdi--comment-edit-outline] mr-1" aria-hidden="true"></i>
                  写下你的看法
                </span>
                <span class="text-xs text-faint">{{ newComment.length }}/1000</span>
              </div>
              <textarea
                v-model="newComment"
                placeholder="分享你的见解，与作者和其他读者互动… (Ctrl + Enter 快速发表)"
                class="wb-input h-32 w-full resize-none"
                maxlength="1000"
                @keydown.enter.ctrl.exact.prevent="submitComment"
                @keydown.enter.shift.prevent="newComment += '\n'"
              ></textarea>
              <div class="mt-3 flex items-center justify-between">
                <div class="flex items-center gap-3 text-xs text-faint">
                  <span>友善交流</span>
                  <span>理性讨论</span>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="commentSubmitting" class="wb-spinner"></span>
                  <button
                    class="wb-btn-primary wb-btn-sm"
                    @click="submitComment"
                    :disabled="!userStore.isLoggedIn || !newComment.trim() || commentSubmitting"
                  >
                    <i class="i-[mdi--send]"></i>
                    <span class="font-medium">{{
                      commentSubmitting ? "发布中…" : "发表评论"
                    }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="comments.length === 0 && !loading" class="wb-empty">
            <i class="i-[mdi--comment-outline] text-4xl text-faint"></i>
            <p class="mt-4 text-base font-semibold text-fg">暂无评论</p>
            <p class="mt-1 text-sm text-muted">快来发表第一条评论吧！</p>
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
            <button class="wb-btn w-full" @click="loadMoreComments" :disabled="loadingMore">
              <span class="wb-spinner mr-2" v-if="loadingMore"></span>
              <i class="i-[mdi--chevron-down]" v-else></i>
              {{ loadingMore ? "加载中…" : "加载更多评论" }}
            </button>
          </div>
        </section>
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
import { useUserStore } from "@/stores/user"
import type { Post, Comment } from "@/stores/forum"
import CommentItem from "@/components/CommentItem.vue"
import ReportModal from "@/components/ReportModal.vue"
import { resolveAvatarUrl } from "@/utils/avatar"
import { sanitizeHtml } from "@/utils/htmlSanitizer"
import { useGlobalToast } from "@/composables/useToast"
import { confirmAction } from "@/composables/useConfirm"
import { formatTime } from "@/utils/format"

// 路由和状态管理
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const toast = useGlobalToast()

// 响应式数据
const loading = ref(true)
const error = ref("")
const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const newComment = ref("")
const commentSubmitting = ref(false)
const likeLoading = ref(false)
const isLiked = ref(false)
const isBookmarked = ref(false)
const bookmarkLoading = ref(false)
const commentSort = ref("newest")
const commentSortOptions = [
  { value: "newest", label: "最新", icon: "i-[mdi--clock-outline]" },
  { value: "oldest", label: "最早", icon: "i-[mdi--history]" },
  { value: "popular", label: "最热", icon: "i-[mdi--fire]" },
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

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = "/defaultAvatar.png"
}

// 清理后的帖子内容（防XSS；正文来自纯文本 textarea，换行需转 <br> 保留段落）
const sanitizedContent = computed(() => {
  if (!post.value) return ""
  return sanitizeHtml(post.value.content.replace(/\n/g, "<br>"))
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

// 统计评论及其所有子评论的总数（后端会级联删除）
const countCommentTree = (comment: Comment): number => {
  let count = 1
  if (comment.replies) {
    for (const reply of comment.replies) {
      count += countCommentTree(reply)
    }
  }
  return count
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

const loadPost = async () => {
  try {
    loading.value = true
    error.value = ""

    const postData = await forumService.getPost(postId.value)
    post.value = postData

    isLiked.value = !!postData.isLiked
    isBookmarked.value = !!postData.isBookmarked

    // 更新页面标题
    document.title = `${post.value.title} - Wallbay`
  } catch (err: unknown) {
    const errObj = err as Error & { message?: string }
    console.error("加载帖子失败:", errObj)
    error.value = errObj.message || "帖子加载失败"
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

    const sortOptions: Record<string, { sortBy: string; sortOrder: "ASC" | "DESC" }> = {
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
  } catch (err: unknown) {
    console.error("加载评论失败:", err)
    if (reset) {
      comments.value = []
    }
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
  } catch (err: unknown) {
    const errObj = err as Error & { message?: string }
    console.error("点赞操作失败:", errObj)
    toast.error(errObj.message || "操作失败")
  } finally {
    likeLoading.value = false
  }
}

const toggleBookmark = async () => {
  if (!userStore.isLoggedIn || !post.value) return

  try {
    bookmarkLoading.value = true

    if (isBookmarked.value) {
      await forumService.unbookmarkPost(postId.value)
      isBookmarked.value = false
    } else {
      await forumService.bookmarkPost(postId.value)
      isBookmarked.value = true
    }
  } catch (err: unknown) {
    const errObj = err as Error & { message?: string }
    console.error("收藏操作失败:", errObj)
    toast.error(errObj.message || "操作失败")
  } finally {
    bookmarkLoading.value = false
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
    toast.success("评论发表成功")

    // 更新帖子评论数
    if (post.value) {
      post.value.commentCount = (post.value.commentCount || 0) + 1
    }
  } catch (err: unknown) {
    const errObj = err as Error & { message?: string }
    console.error("发表评论失败:", errObj)
    toast.error(errObj.message || "发表评论失败")
  } finally {
    commentSubmitting.value = false
  }
}

/** CommentItem 内已 toggle API，此处只合并结果到树 */
const handleCommentLike = (comment: Comment) => {
  updateCommentTree(comments.value, comment.id, (target) => {
    if (typeof comment.likeCount === "number") target.likeCount = comment.likeCount
    if (typeof comment.isLiked === "boolean") target.isLiked = comment.isLiked
  })
}

const handleCommentEdit = (updatedComment: Comment) => {
  updateCommentTree(comments.value, updatedComment.id, (target) => {
    Object.assign(target, updatedComment)
  })
}

const handleCommentDelete = (comment: Comment) => {
  const deletedCount = countCommentTree(comment)
  if (removeCommentFromTree(comments.value, comment.id) && post.value) {
    post.value.commentCount = Math.max(0, (post.value.commentCount || 0) - deletedCount)
  }
}

const handleCommentReply = (_comment?: Comment) => {
  // 仅在回复提交成功后由子组件 emit；此处刷新列表
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
  if (!post.value) return
  const ok = await confirmAction({
    title: "删除帖子",
    message: "确定要删除这篇帖子吗？删除后无法恢复。",
    confirmText: "删除",
    danger: true,
  })
  if (!ok) return

  try {
    await forumService.deletePost(post.value.id)
    toast.success("帖子已删除")
    router.push("/forums")
  } catch (err: unknown) {
    const errObj = err as Error & { message?: string }
    console.error("删除帖子失败:", errObj)
    toast.error(errObj.message || "删除失败")
  }
}

const recordShare = async () => {
  if (!post.value) return
  try {
    await forumService.sharePost(post.value.id)
    post.value.shareCount = (post.value.shareCount || 0) + 1
  } catch {
    // 静默失败
  }
}

/** 系统分享（移动端可唤起微信等）；取消分享不算错误 */
const canSystemShare = typeof navigator !== "undefined" && !!navigator.share
const shareSystem = () => {
  if (!post.value) return
  recordShare()
  navigator
    .share({
      title: post.value.title,
      text: post.value.summary || post.value.title,
      url: window.location.href,
    })
    .catch(() => {})
}

const shareToWeibo = () => {
  if (post.value) {
    const url = window.location.href
    const title = post.value.title
    recordShare()
    window.open(
      `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    )
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    recordShare()
    toast.success("链接已复制到剪贴板")
  } catch {
    toast.error("复制失败，请手动复制链接")
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
/* 正文排版走全局 .prose；这里只补帖文场景的细节 */
.prose :deep(img) {
  border-radius: 0.5rem;
}
</style>
