<template>
  <div class="comment-item" :class="{ 'comment-reply': isReply }">
    <!-- 评论内容 -->
    <div class="flex gap-3">
      <!-- 用户头像 -->
      <div class="flex-shrink-0">
        <div class="avatar">
          <div class="h-8 w-8 overflow-hidden rounded-full border border-base-200 bg-base-100">
            <img
              :src="avatarSrc"
              :alt="comment.author?.username || '用户头像'"
              class="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      <!-- 评论主体 -->
      <div class="min-w-0 flex-grow">
        <!-- 评论头部 -->
        <div class="mb-1 flex items-center gap-2">
          <span class="text-sm font-semibold">
            {{ comment.author?.username || "未知用户" }}
          </span>
          <span class="text-xs text-gray-500">
            {{ formatTime(comment.createdAt) }}
          </span>
          <!-- 编辑标识 -->
          <span
            v-if="comment.updatedAt && comment.updatedAt !== comment.createdAt"
            class="text-xs text-gray-400"
          >
            (已编辑)
          </span>
        </div>

        <!-- 评论内容 -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="mb-2 whitespace-pre-wrap break-words text-sm text-gray-800"
          v-html="formatContent(comment.content)"
        ></div>

        <!-- 评论操作 -->
        <div class="flex items-center gap-3 text-xs">
          <!-- 回复按钮 -->
          <button class="btn btn-ghost btn-xs hover:text-primary" @click="handleReply">
            💬 回复
          </button>

          <!-- 点赞按钮 -->
          <button
            class="btn btn-ghost btn-xs hover:text-green-500"
            :class="{ 'text-green-500': comment.isLiked }"
            @click="handleLike"
            :disabled="loading"
          >
            <span :class="comment.isLiked ? 'text-green-500' : 'text-gray-400'"> 👍 </span>
            {{ comment.likeCount > 0 ? comment.likeCount : "" }}
          </button>

          <!-- 作者操作 -->
          <div v-if="isAuthor" class="dropdown dropdown-left">
            <label tabindex="0" class="btn btn-ghost btn-xs btn-circle"> ⋮ </label>
            <ul tabindex="0" class="dropdown-content menu w-24 rounded-box bg-base-100 p-2 shadow">
              <li>
                <a @click="handleEdit">编辑</a>
              </li>
              <li>
                <a class="text-error" @click="handleDelete"> 删除 </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- 回复框 -->
        <div v-if="showReplyForm" class="border-primary/20 mt-3 border-l-2 pl-4">
          <CommentReplyForm
            :parent-id="comment.id"
            @submit="handleReplySubmit"
            @cancel="showReplyForm = false"
          />
        </div>
      </div>
    </div>

    <!-- 子评论 -->
    <div v-if="comment.replies && comment.replies.length > 0" class="ml-11 mt-3 space-y-3">
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :is-reply="true"
        @like="handleReplyLike"
        @edit="handleReplyEdit"
        @delete="handleReplyDelete"
        @reply="handleNestedReply"
        @refresh="emit('refresh')"
      />
    </div>

    <!-- 编辑模态框 -->
    <dialog ref="editModal" class="modal">
      <div class="modal-box w-11/12 max-w-lg">
        <h3 class="mb-4 text-lg font-bold">编辑评论</h3>
        <div class="form-control">
          <textarea
            v-model="editContent"
            class="textarea-bordered textarea h-32"
            placeholder="请输入评论内容..."
            maxlength="1000"
          ></textarea>
          <div class="mt-1 text-right text-xs text-gray-500">{{ editContent.length }}/1000</div>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="closeEditModal">取消</button>
          <button
            class="btn btn-primary"
            @click="handleEditSubmit"
            :disabled="!editContent.trim() || editLoading"
          >
            {{ editLoading ? "保存中..." : "保存" }}
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue"
import { useUserStore } from "@/stores/user"
import { forumService } from "@/services/forum"
import type { Comment } from "@/stores/forum"
import CommentReplyForm from "./CommentReplyForm.vue"
import { resolveAvatarUrl } from "@/utils/avatar"
import { sanitizeHtml } from "@/utils/htmlSanitizer"

// 组件属性
interface Props {
  comment: Comment
  isReply?: boolean // 是否为回复评论
}

const props = withDefaults(defineProps<Props>(), {
  isReply: false,
})

// 组件事件
const emit = defineEmits<{
  like: [comment: Comment]
  edit: [comment: Comment]
  delete: [comment: Comment]
  reply: [comment: Comment]
  refresh: []
}>()

// 组件引用
const editModal = ref<HTMLDialogElement>()

// 响应式数据
const loading = ref(false)
const editLoading = ref(false)
const showReplyForm = ref(false)
const editContent = ref("")

// 组合式API
const userStore = useUserStore()

// 计算属性
const isAuthor = computed(() => {
  return props.comment.authorId === userStore.user?.id
})

const avatarSrc = computed(() => {
  const raw = props.comment.author?.avatarUrl || props.comment.author?.profilePicture || undefined
  return resolveAvatarUrl(raw)
})

// 方法
const handleReply = () => {
  if (!userStore.isLoggedIn) {
    // 这里可以跳转到登录页面
    return
  }
  showReplyForm.value = !showReplyForm.value
  emit("reply", props.comment)
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    return
  }

  try {
    loading.value = true
    const result = await forumService.toggleCommentLike(props.comment.id)

    // 更新评论点赞状态
    emit("like", { ...props.comment, ...result })
  } catch (error) {
    console.error("点赞评论失败:", error)
  } finally {
    loading.value = false
  }
}

const handleEdit = () => {
  editContent.value = props.comment.content
  editModal.value?.showModal()
  emit("edit", props.comment)
}

const handleDelete = async () => {
  if (!confirm("确定要删除这条评论吗？")) {
    return
  }

  try {
    loading.value = true
    await forumService.deleteComment(props.comment.id)
    emit("delete", props.comment)
  } catch (error) {
    console.error("删除评论失败:", error)
  } finally {
    loading.value = false
  }
}

const handleReplySubmit = async (content: string) => {
  try {
    await forumService.createComment({
      content,
      postId: props.comment.postId,
      parentId: props.comment.id,
    })

    showReplyForm.value = false
    emit("refresh")
  } catch (error) {
    console.error("回复评论失败:", error)
  }
}

const handleEditSubmit = async () => {
  if (!editContent.value.trim()) {
    return
  }

  try {
    editLoading.value = true
    await forumService.updateComment(props.comment.id, {
      content: editContent.value.trim(),
    })

    closeEditModal()
    emit("edit", { ...props.comment, content: editContent.value.trim() })
  } catch (error) {
    console.error("更新评论失败:", error)
  } finally {
    editLoading.value = false
  }
}

const closeEditModal = () => {
  editModal.value?.close()
  editContent.value = ""
}

// 子评论处理
const handleReplyLike = (reply: Comment) => {
  emit("like", reply)
}

const handleReplyEdit = (reply: Comment) => {
  emit("edit", reply)
}

const handleReplyDelete = (reply: Comment) => {
  emit("delete", reply)
}

const handleNestedReply = (reply: Comment) => {
  emit("reply", reply)
}

// 辅助函数
const formatTime = (timeStr: string) => {
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

const formatContent = (content: string) => {
  // 简单的换行和链接处理，然后清理HTML以确保安全
  const formatted = content
    .replace(/\n/g, "<br>")
    .replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" class="text-blue-500 hover:underline">$1</a>',
    )
    .replace(/@(\w+)/g, '<span class="text-primary font-semibold">@$1</span>')

  // 清理HTML以防止XSS攻击
  return sanitizeHtml(formatted)
}
</script>

<style scoped>
.comment-item {
  position: relative;
}

.comment-reply {
  border-left: 2px solid rgba(148, 163, 184, 0.4);
  padding-left: 1rem;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
