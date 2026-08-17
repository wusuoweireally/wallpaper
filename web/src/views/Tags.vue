<template>
  <div class="wb-page">
    <div class="wb-container-gallery py-5">
      <header class="wb-page-head flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="wb-page-title">标签</h1>
          <p class="mt-0.5 text-xs text-muted">按主题浏览壁纸</p>
        </div>
        <form class="wb-nav-search w-full max-w-sm" role="search" @submit.prevent="applyFilters">
          <i class="i-[mdi--magnify] shrink-0 text-base text-faint" aria-hidden="true"></i>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="搜索标签…"
            class="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
          />
        </form>
      </header>

      <div class="mb-4 flex flex-wrap items-center gap-1.5">
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          type="button"
          class="chip"
          :class="{ 'chip--on': sortBy === opt.value }"
          @click="setSort(opt.value)"
        >
          {{ opt.label }}
        </button>
        <button
          type="button"
          class="chip"
          :class="{ 'chip--on': sortOrder === 'DESC' }"
          @click="toggleOrder"
        >
          {{ sortOrder === "DESC" ? "降序" : "升序" }}
        </button>
        <button type="button" class="chip chip--ghost" @click="clearFilters">清除</button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <span class="wb-spinner wb-spinner-lg text-muted"></span>
      </div>

      <div v-else-if="tags.length === 0" class="wb-empty">
        <p class="text-muted">暂无标签</p>
      </div>

      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="tag in tags"
          :key="tag.id"
          type="button"
          class="tag-tile"
          @click="goToTagDetail(tag)"
        >
          <span class="text-sm font-medium text-fg">{{ tag.name }}</span>
          <span class="text-xs tabular-nums text-faint">{{ getUsageCount(tag) }}</span>
        </button>
      </div>

      <div v-if="tags.length && totalPages > 1" class="mt-8 flex justify-center">
        <Pagination :current-page="currentPage" :total-pages="totalPages" @change="changePage" />
      </div>

      <section v-if="popularTags.length" class="mt-10">
        <h2 class="mb-3 text-sm font-semibold text-fg">热门标签</h2>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="tag in popularTags"
            :key="tag.id"
            :to="`/tag/${tag.id}`"
            class="wb-chip hover:border-primary/40 hover:text-primary"
          >
            {{ tag.name }} ({{ getUsageCount(tag) }})
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import tagService, { type Tag } from "@/services/tag"
import Pagination from "@/components/Pagination.vue"

const router = useRouter()
const loading = ref(true)
const tags = ref<Tag[]>([])
const popularTags = ref<Tag[]>([])
const searchQuery = ref("")
const sortBy = ref("name")
const sortOrder = ref<"ASC" | "DESC">("ASC")
const currentPage = ref(1)
const totalPages = ref(1)

const sortOptions = [
  { value: "name", label: "名称" },
  { value: "usageCount", label: "使用次数" },
  { value: "createdAt", label: "创建时间" },
]

const pageSize = 20

/** 筛选/页码同步到 URL（省略默认值），后退/分享可还原 */
const syncQuery = () => {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  if (sortBy.value !== "name") query.sort = sortBy.value
  if (sortOrder.value !== "ASC") query.order = sortOrder.value
  if (currentPage.value > 1) query.page = String(currentPage.value)
  router.replace({ query })
}

const loadTags = async () => {
  try {
    loading.value = true
    const response = await tagService.getTags({
      keyword: searchQuery.value || undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      page: currentPage.value,
      limit: pageSize,
    })
    tags.value = response.data
    totalPages.value = response.pagination?.pages ?? 1
  } catch (error) {
    console.error("加载标签列表失败:", error)
  } finally {
    loading.value = false
  }
}

const loadPopularTags = async () => {
  try {
    const response = await tagService.getTags({
      sortBy: "usageCount",
      sortOrder: "DESC",
    })
    popularTags.value = response.data.slice(0, 10)
  } catch (error) {
    console.error("加载热门标签失败:", error)
  }
}

const applyFilters = () => {
  currentPage.value = 1
  loadTags()
  syncQuery()
}

const setSort = (value: string) => {
  sortBy.value = value
  applyFilters()
}

const toggleOrder = () => {
  sortOrder.value = sortOrder.value === "ASC" ? "DESC" : "ASC"
  applyFilters()
}

const clearFilters = () => {
  searchQuery.value = ""
  sortBy.value = "name"
  sortOrder.value = "ASC"
  currentPage.value = 1
  loadTags()
  syncQuery()
}

const changePage = (page: number) => {
  if (page < 1 || page === currentPage.value) return
  currentPage.value = page
  loadTags()
  syncQuery()
}

const goToTagDetail = (tag: Tag) => {
  router.push(`/tag/${tag.id}`)
}

const getUsageCount = (tag: Tag) => {
  return tag.usageCount ?? (tag as Tag & { useCount?: number }).useCount ?? 0
}

onMounted(() => {
  // 从 URL 还原筛选（仅接受合法排序字段）
  const query = router.currentRoute.value.query
  if (typeof query.q === "string") searchQuery.value = query.q
  if (typeof query.sort === "string" && sortOptions.some((o) => o.value === query.sort)) {
    sortBy.value = query.sort
  }
  if (query.order === "ASC" || query.order === "DESC") {
    sortOrder.value = query.order
  }
  const page = Number(query.page) || 1
  if (page > 1) currentPage.value = page
  loadTags()
  loadPopularTags()
})
</script>

<style scoped>
.chip {
  display: inline-flex;
  height: 1.75rem;
  align-items: center;
  border-radius: 999px;
  border: 1px solid var(--wb-border);
  background: var(--wb-surface);
  padding: 0 0.7rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--wb-muted);
}
.chip--on {
  border-color: transparent;
  background: var(--wb-accent-fill);
  color: var(--wb-accent-fg);
}
.chip--ghost:hover {
  color: var(--wb-danger);
}
.tag-tile {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--wb-border);
  background: var(--wb-surface);
  padding: 0.4rem 0.8rem;
  transition:
    border-color 0.15s,
    background-color 0.15s;
}
.tag-tile:hover {
  border-color: color-mix(in oklab, var(--wb-accent) 40%, transparent);
  background: var(--wb-subtle);
}
</style>
