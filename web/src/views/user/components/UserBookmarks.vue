<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div>
      <h2 class="wb-page-title">收藏的帖子</h2>
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
      <i
        class="i-[mdi--bookmark-multiple-outline] mb-3 block text-3xl text-faint"
        aria-hidden="true"
      ></i>
      <p class="text-base font-semibold text-fg">还没有收藏帖子</p>
      <p class="mt-1.5 max-w-sm text-sm text-muted">逛论坛时点收藏，好帖随时回来看</p>
      <div class="mt-5">
        <button type="button" class="wb-btn-primary" @click="router.push('/forums')">
          去逛论坛
        </button>
      </div>
    </div>

    <!-- 列表：复用论坛 PostCard -->
    <div v-else class="space-y-4">
      <div v-for="post in items" :key="post.id" class="space-y-1">
        <PostCard :post="post" @like="() => {}" @delete="handleDelete" />
        <div class="flex justify-end pr-1">
          <button
            type="button"
            class="wb-btn-ghost wb-btn-xs text-faint transition-colors hover:text-error"
            :disabled="removingId === post.id"
            @click="removeBookmark(post)"
          >
            <span v-if="removingId === post.id" class="wb-spinner mr-1"></span>
            <i v-else class="i-[mdi--bookmark-remove-outline] mr-1 text-sm"></i>
            取消收藏
          </button>
        </div>
      </div>
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
import { ref } from "vue"
import { useRouter } from "vue-router"
import { forumService } from "@/services/forum"
import type { Post } from "@/stores/forum"
import PostCard from "@/components/PostCard.vue"
import Pagination from "@/components/Pagination.vue"
import { useGlobalToast } from "@/composables/useToast"
import { usePaginatedList } from "@/composables/usePaginatedList"

const router = useRouter()
const toast = useGlobalToast()

const removingId = ref<number | null>(null)

const { items, loading, error, pagination, fetchData, handlePageChange } =
  usePaginatedList<Post>(
    (page, pageSize) => forumService.listMyBookmarks({ page, limit: pageSize }),
    { errorMessage: "获取收藏帖子失败，请稍后重试" },
  )

/**
 * 本地移除帖子并收缩分页：当前页被删空且不在首页时，
 * 返回回退页码供重拉；否则返回 null 不需要重新请求
 */
const removeLocal = (postId: number): number | null => {
  items.value = items.value.filter((p) => p.id !== postId)
  pagination.value.totalCount = Math.max(0, pagination.value.totalCount - 1)
  const remainingPages = Math.max(
    1,
    Math.ceil(pagination.value.totalCount / pagination.value.pageSize),
  )
  pagination.value.totalPages = remainingPages

  if (items.value.length === 0 && pagination.value.currentPage > 1) {
    pagination.value.currentPage = Math.min(pagination.value.currentPage - 1, remainingPages)
    return pagination.value.currentPage
  }
  return null
}

/** 取消收藏：原地移除；删空当前页时回退末页重拉 */
const removeBookmark = async (post: Post) => {
  removingId.value = post.id
  try {
    await forumService.unbookmarkPost(post.id)
    const targetPage = removeLocal(post.id)
    toast.success("已取消收藏")
    if (targetPage !== null) await fetchData(targetPage)
  } catch (err) {
    console.error("取消收藏失败:", err)
    toast.error("操作失败，请重试")
  } finally {
    removingId.value = null
  }
}

/** PostCard 自带删除（仅作者可见），确认与 API 已在其内部完成，这里同步列表 */
const handleDelete = (post: Post) => {
  const targetPage = removeLocal(post.id)
  if (targetPage !== null) void fetchData(targetPage)
}
</script>
