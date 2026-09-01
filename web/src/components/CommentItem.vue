<template>
  <div class="comment-item" :class="{ 'comment-reply': isReply }">
    <!-- 评论内容 -->
    <div class="flex gap-3">
      <!-- 用户头像 -->
      <div class="flex-shrink-0">
        <img
          :src="avatarSrc"
          :alt="comment.author?.username || '用户头像'"
          class="h-8 w-8 overflow-hidden rounded-full object-cover ring-1 ring-line"
          @error="handleAvatarError"
        />
      </div>

      <!-- 评论主体 -->
      <div class="min-w-0 flex-grow">
        <!-- 评论头部 -->
        <div class="mb-1 flex items-center gap-2">
          <span class="text-sm font-semibold">
            {{ comment.author?.username || "未知用户" }}
          </span>
          <span class="text-xs text-faint">
            {{ formatTime(comment.createdAt) }}
          </span>
          <!-- 编辑标识 -->
          <span
            v-if="comment.updatedAt && comment.updatedAt !== comment.createdAt"
            class="text-xs text-faint"
          >
            (已编辑)
          </span>
        </div>

        <!-- 评论内容 -->
        <!-- eslint-disable vue/no-v-html -->
        <div
          class="mb-2 whitespace-pre-wrap break-words text-sm text-fg"
          v-html="formatContent(comment.content)"
        ></div>
        <!-- eslint-enable vue/no-v-html -->

        <!-- 评论操作 -->
        <div class="flex items-center gap-3 text-xs">
          <!-- 回复按钮 -->
          <button class="wb-btn-ghost wb-btn-xs hover:text-primary" @click="handleReply">
            <i class="i-[mdi--comment-outline] text-sm" aria-hidden="true"></i>
            回复
          </button>

          <!-- 点赞按钮：统一主题色 -->
          <button
            class="wb-btn-ghost wb-btn-xs hover:text-primary"
            :class="{ 'text-primary': comment.isLiked }"
            @click="handleLike"
            :disabled="loading"
          >
            <i
              class="text-sm"
              :class="
                comment.isLiked
                  ? 'i-[mdi--thumb-up] text-primary'
                  : 'i-[mdi--thumb-up-outline] text-faint'
              "
              aria-hidden="true"
            ></i>
            {{ comment.likeCount > 0 ? comment.likeCount : "" }}
          </button>

          <!-- 作者操作 -->
          <div v-if="isAuthor" class="wb-drop wb-drop-left">
            <label tabindex="0" class="wb-btn-ghost wb-btn-xs">
              <i class="i-[mdi--dots-horizontal] text-sm" aria-hidden="true"></i>
            </label>
            <ul tabindex="0" class="wb-drop-panel w-24 bg-surface p-2 shadow">
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
        <div v-if="showReplyForm" class="mt-3 border-l-2 border-primary/20 pl-4">
          <CommentReplyForm
            ref="replyFormRef"
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
    <dialog ref="editModal" class="wb-dialog">
      <div class="wb-dialog-box w-11/12 max-w-lg">
        <h3 class="mb-4 text-lg font-bold">编辑评论</h3>
        <div class="">
          <textarea
            v-model="editContent"
            class="wb-input h-32"
            placeholder="请输入评论内容…"
            maxlength="1000"
          ></textarea>
          <div class="mt-1 text-right text-xs text-faint">{{ editContent.length }}/1000</div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="wb-btn-ghost" @click="closeEditModal">取消</button>
          <button
            class="wb-btn-primary"
            @click="handleEditSubmit"
            :disabled="!editContent.trim() || editLoading"
          >
            {{ editLoading ? "保存中…" : "保存" }}
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import { forumService } from "@/services/forum"
import type { Comment } from "@/stores/forum"
import CommentReplyForm from "./CommentReplyForm.vue"
import { resolveAvatarUrl, handleAvatarError } from "@/utils/avatar"
import { sanitizeHtml } from "@/utils/htmlSanitizer"
import { useGlobalToast } from "@/composables/useToast"
import { confirmAction } from "@/composables/useConfirm"
import { formatTime } from "@/utils/format"

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
const replyFormRef = ref<InstanceType<typeof CommentReplyForm>>()

// 响应式数据
const loading = ref(false)
const editLoading = ref(false)
const showReplyForm = ref(false)
const editContent = ref("")

// 组合式API
const router = useRouter()
const userStore = useUserStore()
const toast = useGlobalToast()

// 计算属性
const isAuthor = computed(() => {
  return props.comment.authorId === userStore.user?.id
})

const avatarSrc = computed(() => resolveAvatarUrl(props.comment.author?.avatarUrl))

// 方法
const handleReply = () => {
  if (!userStore.isLoggedIn) {
    router.push("/auth/login")
    return
  }
  // 仅展开/收起回复框，不 emit（避免父级误以为已回复而整表刷新）
  showReplyForm.value = !showReplyForm.value
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
    toast.error("点赞失败，请重试")
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
  const ok = await confirmAction({
    title: "删除评论",
    message: "确定要删除这条评论吗？",
    confirmText: "删除",
    danger: true,
  })
  if (!ok) return

  try {
    loading.value = true
    await forumService.deleteComment(props.comment.id)
    emit("delete", props.comment)
  } catch (error) {
    console.error("删除评论失败:", error)
    toast.error("删除失败，请重试")
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

    replyFormRef.value?.clear()
    showReplyForm.value = false
    emit("refresh")
  } catch (error) {
    // 失败保留输入内容，便于直接重试
    console.error("回复评论失败:", error)
    toast.error("回复失败，请重试")
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
    toast.success("评论已更新")
    emit("edit", { ...props.comment, content: editContent.value.trim() })
  } catch (error) {
    console.error("更新评论失败:", error)
    toast.error("更新失败，请重试")
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
const formatContent = (content: string) => {
  // 简单的换行和链接处理，然后清理HTML以确保安全
  const formatted = content
    .replace(/\n/g, "<br>")
    .replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" class="text-primary hover:underline">$1</a>',
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
  border-left: 2px solid var(--wb-border);
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
