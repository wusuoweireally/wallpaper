<template>
  <article
    class="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-800 dark:shadow-slate-900/30"
    @click="handlePostClick"
  >
    <div
      class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-900 via-indigo-500 to-amber-400 opacity-0 transition group-hover:opacity-100"
    ></div>
    <div class="relative flex gap-4 p-5">
      <div class="flex-1 space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <span :class="`badge badge-sm ${forumStore.categoryColor(post.category)} badge-outline`">
            {{ forumStore.categoryLabel(post.category) }}
          </span>
          <span
            v-if="post.isPinned"
            class="border-warning/40 bg-warning/10 badge badge-sm text-warning"
          >
            <i class="i-mdi-pin mr-1 text-xs"></i>
            置顶
          </span>
          <span
            v-if="post.isFeatured"
            class="border-primary/50 bg-primary/10 badge badge-sm text-primary"
          >
            <i class="i-mdi-star mr-1 text-xs"></i>
            精华
          </span>
          <span class="ml-auto text-xs text-slate-500 dark:text-slate-400">
            {{ formatTime(post.createdAt) }}
          </span>
        </div>

        <h3
          class="line-clamp-2 text-[20px] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-slate-900 dark:text-slate-100 dark:group-hover:text-white"
        >
          {{ post.title }}
        </h3>

        <p class="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {{ post.summary ? post.summary : stripHtml(post.content) }}
        </p>

        <div v-if="post.tags" class="flex flex-wrap gap-1.5">
          <span
            v-for="tag in post.tags.split(',').slice(0, 4)"
            :key="tag.trim()"
            class="badge badge-xs border border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            {{ tag.trim() }}
          </span>
          <span
            v-if="post.tags.split(',').length > 4"
            class="badge badge-ghost badge-xs text-xs dark:text-slate-300"
          >
            +{{ post.tags.split(",").length - 4 }}
          </span>
        </div>

        <div
          class="flex items-center justify-between border-t border-slate-200/70 pt-3 dark:border-slate-700/70"
        >
          <div class="flex items-center gap-3">
            <div class="avatar">
              <div
                class="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              >
                <img
                  :src="authorAvatar"
                  :alt="post.author?.username || '用户头像'"
                  class="h-full w-full object-cover"
                />
              </div>
            </div>
            <div class="leading-tight">
              <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
                {{ post.author?.username || "匿名用户" }}
              </p>
              <p
                v-if="post.lastCommentAt"
                class="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"
              >
                <i class="i-mdi-clock-outline text-xs"></i>
                最后回复 {{ formatTime(post.lastCommentAt) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition"
              :class="
                post.isLiked
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'
              "
              @click.stop="handleLike"
              :disabled="loading"
            >
              <i class="i-mdi-heart text-sm"></i>
              <span>{{ formatNumber(post.likeCount) }}</span>
            </button>
            <button
              class="flex items-center gap-1 text-xs text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              @click.stop="handleComment"
            >
              <i class="i-mdi-comment-outline text-sm"></i>
              <span>{{ formatNumber(post.commentCount) }}</span>
            </button>
            <button
              class="btn btn-ghost btn-xs btn-circle text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              @click.stop="handleShare"
            >
              <i class="i-mdi-share-variant text-sm"></i>
            </button>
            <div v-if="isAuthor" class="dropdown dropdown-end" @click.stop>
              <label
                tabindex="0"
                class="btn btn-ghost btn-xs btn-circle text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <i class="i-mdi-dots-horizontal text-sm"></i>
              </label>
              <ul
                tabindex="0"
                class="dropdown-content menu w-36 rounded-box border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
              >
                <li>
                  <a class="text-sm" @click="handleEdit">
                    <i class="i-mdi-pencil-outline"></i>
                    编辑
                  </a>
                </li>
                <li>
                  <a class="text-sm text-error" @click="handleDelete">
                    <i class="i-mdi-delete-outline"></i>
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
import { useUserStore } from "@/stores"
import { forumService } from "@/services/forum"
import type { Post } from "@/stores/forum"
import { resolveAvatarUrl } from "@/utils/avatar"
import { stripHtml as stripHtmlUtil } from "@/utils/htmlSanitizer"

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

const loading = ref(false)

const isAuthor = computed(() => {
  return props.post.authorId === userStore.user?.id
})

const authorAvatar = computed(() => {
  const raw = props.post.author?.avatarUrl || props.post.author?.profilePicture || undefined
  return resolveAvatarUrl(raw)
})

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

    emit("like", props.post)
  } catch (error) {
    console.error("点赞操作失败:", error)
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
  if (!confirm("确定要删除这个帖子吗？")) {
    return
  }

  try {
    loading.value = true
    await forumService.deletePost(props.post.id)
    emit("delete", props.post)
  } catch (error) {
    console.error("删除帖子失败:", error)
  } finally {
    loading.value = false
  }
}

const handleShare = () => {
  emit("share", props.post)

  const shareUrl = `${window.location.origin}/forums/post/${props.post.id}`

  if (navigator.share) {
    navigator.share({
      title: props.post.title,
      text: props.post.summary || props.post.title,
      url: shareUrl,
    })
  } else {
    navigator.clipboard.writeText(shareUrl)
  }
}

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

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "w"
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k"
  }
  return num.toString()
}

const stripHtml = (html: string) => {
  return stripHtmlUtil(html).substring(0, 200)
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
