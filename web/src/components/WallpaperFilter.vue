<template>
  <!-- 与壁纸网格同宽：外层由页面 max-w-7xl 控制，此处做卡片条 -->
  <div
    class="rounded-2xl border border-base-content/10 bg-base-100 px-3 py-2.5 shadow-sm sm:px-4"
  >
    <div class="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
      <!-- 筛选控件 -->
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <!-- 排序 -->
        <div class="dropdown">
          <div
            tabindex="0"
            role="button"
            class="filter-pill"
            :class="{ 'filter-pill--active': props.modelValue.sortBy !== 'latest' }"
          >
            <i class="i-[mdi--sort-variant] filter-ico"></i>
            <span>{{ getSortLabel }}</span>
            <i class="i-[mdi--chevron-down] filter-chevron"></i>
          </div>
          <ul tabindex="0" class="menu dropdown-content filter-menu !bg-white dark:!bg-neutral">
            <li v-for="option in sortOptions" :key="option.value">
              <a
                class="rounded-lg"
                :class="{ active: props.modelValue.sortBy === option.value }"
                @click="updateSort(option.value)"
              >
                {{ option.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 分类 -->
        <div class="dropdown">
          <div
            tabindex="0"
            role="button"
            class="filter-pill"
            :class="{ 'filter-pill--active': !!props.modelValue.category }"
          >
            <i class="i-[mdi--shape-outline] filter-ico"></i>
            <span class="opacity-45">分类</span>
            <span>{{ getCategoryLabel }}</span>
            <i class="i-[mdi--chevron-down] filter-chevron"></i>
          </div>
          <ul tabindex="0" class="menu dropdown-content filter-menu !bg-white dark:!bg-neutral">
            <li>
              <a
                class="rounded-lg"
                :class="{ active: !props.modelValue.category }"
                @click="updateCategory('')"
                >全部</a
              >
            </li>
            <li v-for="category in categories" :key="category.value">
              <a
                class="rounded-lg"
                :class="{ active: props.modelValue.category === category.value }"
                @click="updateCategory(category.value)"
              >
                {{ category.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 子类 -->
        <div v-if="availableSubCategories.length > 0" class="dropdown">
          <div
            tabindex="0"
            role="button"
            class="filter-pill"
            :class="{ 'filter-pill--active': !!props.modelValue.subCategory }"
          >
            <i class="i-[mdi--folder-outline] filter-ico"></i>
            <span class="opacity-45">子类</span>
            <span class="max-w-[5.5rem] truncate">{{ getSubCategoryLabel }}</span>
            <i class="i-[mdi--chevron-down] filter-chevron"></i>
          </div>
          <ul tabindex="0" class="menu dropdown-content filter-menu !bg-white dark:!bg-neutral">
            <li>
              <a
                class="rounded-lg"
                :class="{ active: !props.modelValue.subCategory }"
                @click="updateSubCategory('')"
                >全部</a
              >
            </li>
            <li v-for="sub in availableSubCategories" :key="sub.value">
              <a
                class="rounded-lg"
                :class="{ active: props.modelValue.subCategory === sub.value }"
                @click="updateSubCategory(sub.value)"
              >
                {{ sub.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 尺寸 -->
        <div class="dropdown">
          <div
            tabindex="0"
            role="button"
            class="filter-pill"
            :class="{ 'filter-pill--active': !!props.modelValue.resolution }"
          >
            <i class="i-[mdi--image-size-select-large] filter-ico"></i>
            <span class="opacity-45">尺寸</span>
            <span>{{ getResolutionLabel }}</span>
            <i class="i-[mdi--chevron-down] filter-chevron"></i>
          </div>
          <ul tabindex="0" class="menu dropdown-content filter-menu !bg-white dark:!bg-neutral">
            <li>
              <a
                class="rounded-lg"
                :class="{ active: !props.modelValue.resolution }"
                @click="updateResolution('')"
                >全部</a
              >
            </li>
            <li v-for="resolution in resolutions" :key="resolution.value">
              <a
                class="rounded-lg"
                :class="{ active: props.modelValue.resolution === resolution.value }"
                @click="updateResolution(resolution.value)"
              >
                {{ resolution.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 比例 -->
        <div class="dropdown">
          <div
            tabindex="0"
            role="button"
            class="filter-pill"
            :class="{ 'filter-pill--active': !!props.modelValue.ratio }"
          >
            <i class="i-[mdi--aspect-ratio] filter-ico"></i>
            <span class="opacity-45">比例</span>
            <span>{{ getRatioLabel }}</span>
            <i class="i-[mdi--chevron-down] filter-chevron"></i>
          </div>
          <ul tabindex="0" class="menu dropdown-content filter-menu !bg-white dark:!bg-neutral">
            <li>
              <a
                class="rounded-lg"
                :class="{ active: !props.modelValue.ratio }"
                @click="updateRatio('')"
                >全部</a
              >
            </li>
            <li v-for="ratio in ratios" :key="ratio">
              <a
                class="rounded-lg"
                :class="{ active: props.modelValue.ratio === ratio }"
                @click="updateRatio(ratio)"
              >
                {{ ratio }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 方向 -->
        <div class="orient-group">
          <button
            v-for="orient in orientationOptions"
            :key="orient.value"
            type="button"
            class="orient-btn"
            :class="{ 'orient-btn--on': props.modelValue.orientation === orient.value }"
            :title="orient.label"
            @click="
              updateOrientation(props.modelValue.orientation === orient.value ? '' : orient.value)
            "
          >
            <i :class="orient.icon" class="text-sm"></i>
            <span>{{ orient.label }}</span>
          </button>
        </div>

        <!-- 格式 -->
        <div class="dropdown">
          <div
            tabindex="0"
            role="button"
            class="filter-pill"
            :class="{ 'filter-pill--active': !!props.modelValue.format }"
          >
            <i class="i-[mdi--file-image-outline] filter-ico"></i>
            <span class="opacity-45">格式</span>
            <span>{{ getFormatLabel }}</span>
            <i class="i-[mdi--chevron-down] filter-chevron"></i>
          </div>
          <ul tabindex="0" class="menu dropdown-content filter-menu !bg-white dark:!bg-neutral">
            <li>
              <a
                class="rounded-lg"
                :class="{ active: !props.modelValue.format }"
                @click="updateFormat('')"
                >全部</a
              >
            </li>
            <li v-for="fmt in formats" :key="fmt.value">
              <a
                class="rounded-lg"
                :class="{ active: props.modelValue.format === fmt.value }"
                @click="updateFormat(fmt.value)"
              >
                {{ fmt.label }}
              </a>
            </li>
          </ul>
        </div>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="filter-pill filter-pill--ghost"
          @click="resetFilters"
        >
          <i class="i-[mdi--refresh] filter-ico"></i>
          重置
        </button>
      </div>

      <!-- 搜索：与筛选同一卡片内，宽度收敛 -->
      <div class="relative w-full shrink-0 sm:max-w-xs lg:w-56">
        <input
          :value="props.modelValue.search"
          type="search"
          placeholder="搜索壁纸…"
          class="filter-search"
          @input="handleSearchInputEvent"
          @keyup.enter.prevent="handleSearch"
        />
        <svg
          class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-base-content/35"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
          />
        </svg>
        <button
          v-if="props.modelValue.search"
          type="button"
          class="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-base-content/40 hover:bg-base-200 hover:text-base-content"
          title="清除"
          @click="clearSearch"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>

        <transition name="fade">
          <div v-if="showSuggestionPanel" class="filter-suggest bg-base-100">
            <div
              v-if="searchLoading"
              class="flex items-center gap-2 px-2 py-3 text-sm text-base-content/55"
            >
              <span class="loading loading-spinner loading-xs text-primary"></span>
              搜索中…
            </div>
            <template v-else>
              <button
                v-for="tag in tagSuggestions"
                :key="tag.id"
                type="button"
                class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-base-200"
                @click="applyTagSuggestion(tag.name)"
              >
                <span class="font-medium">{{ tag.name }}</span>
                <span class="text-xs text-base-content/45">{{ tag.usageCount }}</span>
              </button>
              <p
                v-if="!tagSuggestions.length"
                class="px-2 py-3 text-center text-xs text-base-content/45"
              >
                未找到匹配标签
              </p>
            </template>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import tagService, { type Tag } from "@/services/tag"

interface Filters {
  sortBy: "latest" | "popular" | "random" | "likes" | "downloads"
  category: string
  subCategory: string
  resolution: string
  ratio: string
  orientation: string
  format: string
  search: string
}

interface Props {
  modelValue: Filters
}

interface Emits {
  (e: "update:modelValue", filters: Filters): void
  (e: "filter-change"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const route = useRoute()
const router = useRouter()

const sortOptions: Array<{
  value: "latest" | "popular" | "random" | "likes" | "downloads"
  label: string
}> = [
  { value: "latest", label: "最新上传" },
  { value: "popular", label: "综合热门" },
  { value: "likes", label: "最多点赞" },
  { value: "downloads", label: "最多下载" },
  { value: "random", label: "随机推荐" },
]

const categories = [
  { value: "general", label: "综合" },
  { value: "anime", label: "动漫" },
  { value: "people", label: "人物" },
]

const subCategoryMap: Record<string, { value: string; label: string }[]> = {
  general: [
    { value: "nature", label: "自然风光" },
    { value: "city", label: "城市建筑" },
    { value: "abstract", label: "抽象艺术" },
    { value: "minimal", label: "极简主义" },
    { value: "dark", label: "暗黑风格" },
    { value: "other", label: "其他" },
  ],
  anime: [
    { value: "landscape", label: "场景" },
    { value: "character", label: "角色" },
    { value: "cute", label: "可爱" },
    { value: "cyberpunk", label: "赛博朋克" },
    { value: "game", label: "游戏" },
    { value: "other", label: "其他" },
  ],
  people: [
    { value: "portrait", label: "人像" },
    { value: "fashion", label: "时尚" },
    { value: "movie", label: "影视" },
    { value: "other", label: "其他" },
  ],
}

const availableSubCategories = computed(() => {
  return props.modelValue.category ? subCategoryMap[props.modelValue.category] || [] : []
})

const formats = [
  { value: "jpeg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
]

const resolutions = [
  { value: "5k", label: "5K+" },
  { value: "4k", label: "4K" },
  { value: "2k", label: "2K" },
  { value: "1080p", label: "1080p" },
  { value: "720p", label: "720p" },
  { value: "4k-portrait", label: "4K 竖屏" },
  { value: "2k-portrait", label: "2K 竖屏" },
  { value: "1080p-portrait", label: "1080p 竖屏" },
]

const ratios = ["16:9", "16:10", "4:3", "21:9", "1:1", "9:16"]

const orientationOptions = [
  { value: "landscape", label: "横屏", icon: "i-[mdi--phone-rotate-landscape]" },
  { value: "portrait", label: "竖屏", icon: "i-[mdi--phone-rotate-portrait]" },
  { value: "square", label: "方形", icon: "i-[mdi--crop-square]" },
]

const getSortLabel = computed(() => {
  return sortOptions.find((opt) => opt.value === props.modelValue.sortBy)?.label || "最新上传"
})

const getCategoryLabel = computed(() => {
  return categories.find((c) => c.value === props.modelValue.category)?.label || "全部"
})

const getSubCategoryLabel = computed(() => {
  if (!props.modelValue.category || !props.modelValue.subCategory) return "全部"
  const subs = subCategoryMap[props.modelValue.category] || []
  const found = subs.find((s) => s.value === props.modelValue.subCategory)
  return found?.label || "全部"
})

const getResolutionLabel = computed(() => {
  if (!props.modelValue.resolution) return "全部"
  return resolutions.find((r) => r.value === props.modelValue.resolution)?.label || props.modelValue.resolution
})

const getRatioLabel = computed(() => {
  return props.modelValue.ratio || "全部"
})

const getFormatLabel = computed(() => {
  return formats.find((f) => f.value === props.modelValue.format)?.label || "全部"
})

const hasActiveFilters = computed(() => {
  return !!(
    props.modelValue.category ||
    props.modelValue.subCategory ||
    props.modelValue.resolution ||
    props.modelValue.ratio ||
    props.modelValue.orientation ||
    props.modelValue.format ||
    props.modelValue.search
  )
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null
let suggestionTimeout: ReturnType<typeof setTimeout> | null = null
const tagSuggestions = ref<Tag[]>([])
const searchLoading = ref(false)

const showSuggestionPanel = computed(() => {
  return (
    !!props.modelValue.search.trim() && (searchLoading.value || tagSuggestions.value.length > 0)
  )
})

const updateFilters = (updates: Partial<Filters>) => {
  const newFilters = { ...props.modelValue, ...updates }
  emit("update:modelValue", newFilters)
  emit("filter-change")
}

const updateSort = (sortBy: "latest" | "popular" | "random" | "likes" | "downloads") => {
  updateFilters({ sortBy })
  router.push({
    path: route.path,
    query: {
      ...route.query,
      sort: sortBy,
    },
  })
}

const updateCategory = (category: string) => {
  updateFilters({ category, subCategory: "" })
}

const updateSubCategory = (subCategory: string) => {
  updateFilters({ subCategory })
}

const updateResolution = (resolution: string) => {
  updateFilters({ resolution })
}

const updateRatio = (ratio: string) => {
  updateFilters({ ratio })
}

const updateOrientation = (orientation: string) => {
  updateFilters({ orientation })
}

const updateFormat = (format: string) => {
  updateFilters({ format })
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  emit("filter-change")
}

const handleSearchInput = (value: string) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  if (suggestionTimeout) {
    clearTimeout(suggestionTimeout)
  }

  const keyword = value.trim()
  if (keyword) {
    suggestionTimeout = setTimeout(() => fetchTagSuggestions(keyword), 300)
  } else {
    tagSuggestions.value = []
  }

  searchTimeout = setTimeout(() => {
    emit("filter-change")
  }, 500)
}

const fetchTagSuggestions = async (keyword: string) => {
  searchLoading.value = true
  try {
    const response = await tagService.getTags({
      keyword,
      limit: 6,
      sortBy: "usageCount",
      sortOrder: "DESC",
    })
    tagSuggestions.value = response.data || []
  } catch (error) {
    console.error("加载标签建议失败:", error)
    tagSuggestions.value = []
  } finally {
    searchLoading.value = false
  }
}

const resetFilters = () => {
  updateFilters({
    category: "",
    subCategory: "",
    resolution: "",
    ratio: "",
    orientation: "",
    format: "",
    search: "",
  })
  tagSuggestions.value = []
}

const applyTagSuggestion = (tagName: string) => {
  updateFilters({ search: tagName })
  tagSuggestions.value = []
  emit("filter-change")
}

const clearSearch = () => {
  if (!props.modelValue.search) return
  updateFilters({ search: "" })
  tagSuggestions.value = []
}

const handleSearchInputEvent = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  updateFilters({ search: value })
  handleSearchInput(value)
}

watch(
  () => route.query.sort,
  (newSort) => {
    if (newSort && ["latest", "popular", "random", "likes", "downloads"].includes(newSort as string)) {
      const newSortValue = newSort as Filters["sortBy"]
      if (props.modelValue.sortBy !== newSortValue) {
        updateFilters({ sortBy: newSortValue })
      }
    }
  },
)

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (suggestionTimeout) clearTimeout(suggestionTimeout)
})
</script>

<style scoped>
/* DaisyUI 5 使用 --color-base-100 等完整颜色值，勿用旧 --b1 / oklch(var(--bc)) */

.filter-ico {
  flex-shrink: 0;
  font-size: 0.95rem;
  opacity: 0.55;
  line-height: 1;
}

.filter-pill--active .filter-ico {
  opacity: 0.9;
}

.filter-chevron {
  flex-shrink: 0;
  font-size: 0.9rem;
  opacity: 0.35;
  line-height: 1;
}

.filter-pill {
  display: inline-flex;
  height: 2rem;
  cursor: pointer;
  align-items: center;
  gap: 0.35rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent);
  background: color-mix(in oklab, var(--color-base-200) 70%, var(--color-base-100));
  padding: 0 0.7rem;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1;
  color: var(--color-base-content);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
  user-select: none;
}

.filter-pill:hover {
  border-color: color-mix(in oklab, var(--color-primary) 35%, transparent);
  background: color-mix(in oklab, var(--color-primary) 8%, var(--color-base-100));
}

.filter-pill--active {
  border-color: color-mix(in oklab, var(--color-primary) 40%, transparent);
  background: color-mix(in oklab, var(--color-primary) 12%, var(--color-base-100));
  color: var(--color-primary);
}

.filter-pill--ghost:hover {
  border-color: color-mix(in oklab, var(--color-error) 30%, transparent);
  color: var(--color-error);
}

.orient-group {
  display: inline-flex;
  height: 2rem;
  align-items: center;
  gap: 1px;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent);
  background: color-mix(in oklab, var(--color-base-200) 70%, var(--color-base-100));
  padding: 2px;
}

.orient-btn {
  display: inline-flex;
  height: calc(2rem - 6px);
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  padding: 0 0.55rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.orient-btn:hover {
  color: var(--color-base-content);
  background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
}

.orient-btn--on {
  background: var(--color-primary);
  color: var(--color-primary-content);
}

.orient-btn--on:hover {
  background: var(--color-primary);
  color: var(--color-primary-content);
  filter: brightness(1.05);
}

.filter-search {
  height: 2rem;
  width: 100%;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent);
  background: color-mix(in oklab, var(--color-base-200) 70%, var(--color-base-100));
  padding: 0 2rem;
  font-size: 0.8125rem;
  color: var(--color-base-content);
  outline: none;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.filter-search::placeholder {
  color: color-mix(in oklab, var(--color-base-content) 40%, transparent);
}

.filter-search:focus {
  border-color: color-mix(in oklab, var(--color-primary) 40%, transparent);
  background: var(--color-base-100);
}

/* 下拉必须用不透明实底（带 #fff 兜底，避免变量异常时再透明） */
.filter-menu.dropdown-content,
ul.filter-menu {
  z-index: 50;
  margin-top: 0.35rem;
  width: 11rem;
  max-height: 16rem;
  overflow-y: auto;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent);
  background: #ffffff !important;
  background: var(--color-base-100) !important;
  background-image: none !important;
  padding: 0.35rem;
  color: var(--color-base-content);
  opacity: 1 !important;
  box-shadow:
    0 12px 36px rgba(15, 23, 42, 0.14),
    0 0 0 1px rgba(15, 23, 42, 0.06);
  backdrop-filter: none !important;
  isolation: isolate;
}

:global(html.dark) .filter-menu.dropdown-content,
:global(html.dark) ul.filter-menu,
:global([data-theme="dark"]) .filter-menu.dropdown-content,
:global([data-theme="dark"]) ul.filter-menu {
  background: #1d232a !important;
  background: var(--color-base-100) !important;
  box-shadow:
    0 12px 36px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.filter-menu :deep(li > a),
.filter-menu :deep(li > *) {
  border-radius: 0.5rem;
  font-size: 0.8125rem;
}

.filter-menu :deep(li > a:hover),
.filter-menu :deep(li > a:focus) {
  background: color-mix(in oklab, var(--color-base-content) 8%, var(--color-base-100)) !important;
  color: var(--color-base-content);
}

.filter-menu :deep(li > a.active),
.filter-menu :deep(.active) {
  background: color-mix(in oklab, var(--color-primary) 14%, var(--color-base-100)) !important;
  color: var(--color-primary);
}

.filter-suggest {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 0.35rem);
  z-index: 50;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent);
  background: #ffffff !important;
  background: var(--color-base-100) !important;
  padding: 0.35rem;
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.14);
  backdrop-filter: none !important;
  isolation: isolate;
}

:global(html.dark) .filter-suggest,
:global([data-theme="dark"]) .filter-suggest {
  background: #1d232a !important;
  background: var(--color-base-100) !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
