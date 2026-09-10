<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div>
      <h2 class="wb-page-title">我的帖子</h2>
      <p class="mt-1 text-sm text-muted">
        共 <span class="font-semibold text-fg">{{ pagination.totalCount }}</span> 篇
      </p>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="flex flex-col items-center gap-3">
        <span class="wb-spinner wb-spinner-lg text-faint"></span>
        <p class="text-sm text-faint">加载中…</p>
      </div>
    </div>

    <!-- 错误 -->
    <div
      v-else-if="error"
      class="wb-alert flex items-center justify-between gap-4 px-5 py-4"
    >
      <span class="text-sm font-medium text-error">{{ error }}</span>
      <button
        type="button"
        class="wb-btn-ghost wb-btn-sm shrink-0 text-error"
        @click="() => fetchData()"
      >
        重试
      </button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="items.length === 0" class="wb-empty">
      <i class="i-[mdi--post-outline] mb-3 block text-3xl text-faint" aria-hidden="true"></i>
      <p class="text-base font-semibold text-fg">还没有发过帖子</p>
      <p class="mt-1.5 max-w-sm text-sm text-muted">把想聊的写下来，让更多人看到</p>
      <div class="mt-5">
        <button type="button" class="wb-btn-primary" @click="router.push('/forums/new')">
          去发帖
        </button>
      </div>
    </div>

    <!-- 列表：复用论坛 PostCard -->
    <div v-else class="space-y-4">
      <PostCard
        v-for="post in items"
        :key="post.id"
        :post="post"
        @like="() => {}"
        @delete="handleDelete"
      />
    </div>

    <!-- 分页 -->
    <div
      v-if="!loading && items.length > 0 && pagination.totalPages > 1"
      class="flex justify-center pt-2"
    >
      <Pagination
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages || 1"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router"
import { forumService } from "@/services/forum"
import type { Post } from "@/stores/forum"
import PostCard from "@/components/PostCard.vue"
import Pagination from "@/components/Pagination.vue"
import { useUserStore } from "@/stores/user"
import { usePaginatedList } from "@/composables/usePaginatedList"

const router = useRouter()
const userStore = useUserStore()

/**
 * 按 authorId 拉自己的帖子。取不到当前用户时宁可报错也不要漏传 authorId——
 * 那样会退化成"全站帖子"，在这个页面语境下是错的。
 */
const fetchMyPosts = (page: number, pageSize: number) => {
  const authorId = userStore.user?.id
  if (!authorId) {
    return Promise.reject(new Error("登录状态已失效，请重新登录"))
  }
  return forumService.getPosts({ authorId, page, limit: pageSize })
}

const {
  items,
  loading,
  error,
  pagination,
  fetchData,
  handlePageChange,
  removeItem,
} = usePaginatedList<Post>(fetchMyPosts, {
  errorMessage: "获取我的帖子失败，请稍后重试",
})

/** PostCard 自带删除（仅作者可见），确认与 API 已在其内部完成，这里同步列表 */
const handleDelete = (post: Post) => {
  const targetPage = removeItem((p) => p.id === post.id)
  if (targetPage !== null) void fetchData(targetPage)
}
</script>
