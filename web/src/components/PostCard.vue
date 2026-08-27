<template>
  <article
    class="group relative cursor-pointer overflow-hidden rounded-tile border border-line/80 bg-surface/60 transition hover:border-primary/40 hover:bg-subtle/50"
    @click="handlePostClick"
  >
    <div class="relative flex gap-4 p-4">
      <div class="flex-1 space-y-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="wb-chip">
            {{ forumStore.categoryLabel(post.category) }}
          </span>
          <span v-if="post.isPinned" class="wb-chip border-warning/40 bg-warning/10 text-warning">
            <i class="i-[mdi--pin] mr-1 text-xs"></i>
            置顶
          </span>
          <span v-if="post.isFeatured" class="wb-chip border-primary/50 bg-primary/10 text-primary">
            <i class="i-[mdi--star] mr-1 text-xs"></i>
            精华
          </span>
          <span class="ml-auto text-xs text-faint">
            {{ formatTime(post.createdAt) }}
          </span>
        </div>

        <!-- 标题可链接化：支持中键新开与键盘聚焦 -->
        <router-link
          :to="`/forums/post/${post.id}`"
          class="line-clamp-2 text-base font-semibold leading-snug text-fg transition-colors hover:text-primary"
          @click.stop
        >
          {{ post.title }}
        </router-link>

        <p class="line-clamp-3 text-sm leading-relaxed text-muted">
          {{ post.summary ? post.summary : truncateHtml(post.content, 200) }}
        </p>

        <div v-if="post.tags" class="flex flex-wrap gap-1.5">
          <span v-for="tag in post.tags.split(',').slice(0, 4)" :key="tag.trim()" class="wb-chip">
            {{ tag.trim() }}
          </span>
          <span v-if="post.tags.split(',').length > 4" class="wb-chip text-xs">
            +{{ post.tags.split(",").length - 4 }}
          </span>
        </div>

        <div class="flex items-center justify-between border-t border-line/70 pt-3">
          <div class="flex items-center gap-3">
            <img
              :src="authorAvatar"
              :alt="post.author?.username || '用户头像'"
              class="h-9 w-9 overflow-hidden rounded-full object-cover ring-1 ring-line"
              @error="handleAvatarError"
            />
            <div class="leading-tight">
              <p class="text-sm font-medium text-fg">
                {{ post.author?.username || "匿名用户" }}
              </p>
              <p v-if="post.lastCommentAt" class="flex items-center gap-1 text-[11px] text-faint">
                <i class="i-[mdi--clock-outline] text-xs"></i>
                最后回复 {{ formatTime(post.lastCommentAt) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition"
              :class="
                post.isLiked
                  ? 'border-primary-fill bg-primary-fill text-primary-content'
                  : 'border-line text-muted hover:bg-subtle hover:text-fg'
              "
              @click.stop="handleLike"
              :disabled="loading"
            >
              <i class="i-[mdi--heart] text-sm"></i>
              <span>{{ formatNumber(post.likeCount) }}</span>
            </button>
            <button
              class="flex items-center gap-1 text-xs text-muted transition hover:text-fg"
              @click.stop="handleComment"
            >
              <i class="i-[mdi--comment-outline] text-sm"></i>
              <span>{{ formatNumber(post.commentCount) }}</span>
            </button>
            <button
              class="wb-btn-ghost wb-btn-xs text-faint hover:text-fg"
              @click.stop="handleShare"
            >
              <i class="i-[mdi--share-variant] text-sm"></i>
            </button>
            <div v-if="isAuthor" class="wb-drop wb-drop-end" @click.stop>
              <label tabindex="0" class="wb-btn-ghost wb-btn-xs text-faint hover:text-fg">
                <i class="i-[mdi--dots-horizontal] text-sm"></i>
              </label>
              <ul
                tabindex="0"
                class="wb-drop-panel w-36 border border-line bg-surface p-1.5 shadow-lg"
              >
                <li>
                  <a class="text-sm" @click="handleEdit">
                    <i class="i-[mdi--pencil-outline]"></i>
                    编辑
                  </a>
                </li>
                <li>
                  <a class="text-sm text-error" @click="handleDelete">
                    <i class="i-[mdi--delete-outline]"></i>
                    删除
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { useForumStore } from "@/stores/forum"
import { useUserStore } from "@/stores/user"
import { forumService } from "@/services/forum"
import type { Post } from "@/stores/forum"
import { resolveAvatarUrl, handleAvatarError } from "@/utils/avatar"
import { truncateHtml } from "@/utils/htmlSanitizer"
import { useGlobalToast } from "@/composables/useToast"
import { confirmAction } from "@/composables/useConfirm"
import { formatNumber, formatTime } from "@/utils/format"

interface Props {
  post: Post
  showActions?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  compact: false,
})

const emit = defineEmits<{
  like: [post: Post]
  comment: [post: Post]
  edit: [post: Post]
  delete: [post: Post]
  share: [post: Post]
}>()

const router = useRouter()
const forumStore = useForumStore()
const userStore = useUserStore()
const toast = useGlobalToast()

const loading = ref(false)

const isAuthor = computed(() => {
  return props.post.authorId === userStore.user?.id
})

const authorAvatar = computed(() => resolveAvatarUrl(props.post.author?.avatarUrl))

const handlePostClick = () => {
  router.push(`/forums/post/${props.post.id}`)
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    router.push("/auth/login")
    return
  }

  try {
    loading.value = true
    const postId = props.post.id

    if (props.post.isLiked) {
      await forumService.unlikePost(postId)
      forumStore.togglePostLike(postId, false)
    } else {
      await forumService.likePost(postId)
      forumStore.togglePostLike(postId, true)
    }
    // 仅通知父级刷新本地展示；父级不得再次请求 like API
    emit("like", props.post)
  } catch (error) {
    console.error("点赞操作失败:", error)
    toast.error("点赞失败，请重试")
  } finally {
    loading.value = false
  }
}

const handleComment = () => {
  emit("comment", props.post)
  router.push(`/forums/post/${props.post.id}#comments`)
}

const handleEdit = () => {
  emit("edit", props.post)
  router.push(`/forums/edit/${props.post.id}`)
}

const handleDelete = async () => {
  const ok = await confirmAction({
    title: "删除帖子",
    message: "确定要删除这个帖子吗？",
    confirmText: "删除",
    danger: true,
  })
  if (!ok) return

  try {
    loading.value = true
    await forumService.deletePost(props.post.id)
    toast.success("帖子已删除")
    emit("delete", props.post)
  } catch (error) {
    console.error("删除帖子失败:", error)
    toast.error("删除失败，请重试")
  } finally {
    loading.value = false
  }
}

const handleShare = async () => {
  emit("share", props.post)

  const shareUrl = `${window.location.origin}/forums/post/${props.post.id}`

  // 记录分享计数
  try {
    await forumService.sharePost(props.post.id)
  } catch {
    // 静默失败
  }

  if (navigator.share) {
    navigator.share({
      title: props.post.title,
      text: props.post.summary || props.post.title,
      url: shareUrl,
    })
  } else {
    await navigator.clipboard.writeText(shareUrl)
    toast.success("链接已复制到剪贴板")
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
