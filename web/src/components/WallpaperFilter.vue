<template>
  <div class="from-primary/5 to-secondary/5 bg-gradient-to-r shadow-sm">
    <div class="container mx-auto px-4 py-5">
      <div class="flex flex-wrap items-center gap-3 sm:gap-4">
        <!-- 排序方式 -->
        <div class="dropdown dropdown-hover">
          <div
            tabindex="0"
            role="button"
            class="bg-base-100/80 border-base-content/20 hover:border-primary/50 btn btn-outline btn-sm h-10 border-2 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3 18h6v-2H3v2zm0-5h12v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
            <span class="ml-1 text-sm font-medium">排序:</span>
            <span class="text-base-content/80 text-sm">{{ getSortLabel }}</span>
          </div>
          <ul
            tabindex="0"
            class="ring-base-content/10 dropdown-content menu z-10 w-56 rounded-xl bg-base-100 p-2 shadow-xl ring-1"
          >
            <li v-for="option in sortOptions" :key="option.value">
              <a
                @click="updateSort(option.value)"
                :class="{ active: props.modelValue.sortBy === option.value }"
                class="hover:bg-primary/10 rounded-lg transition-all"
              >
                {{ option.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 分类筛选 -->
        <div class="dropdown dropdown-hover">
          <div
            tabindex="0"
            role="button"
            class="bg-base-100/80 border-base-content/20 hover:border-primary/50 btn btn-outline btn-sm h-10 border-2 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-secondary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M20.59,13.41L12,22L8,18L18.24,7.76C18.46,7.37 18.61,6.92 18.67,6.46L15.11,9.99L13.11,7.99L16.54,4.56C16.92,4.19 17.37,4.02 17.83,3.96L17.95,3.5L13.37,4.08L9.83,0.54C9.47,0.18 8.99,0 8.5,0C8,0 7.52,0.18 7.16,0.54L3.5,4.2C3.37,4.36 3.26,4.53 3.17,4.71L0.81,8.24L4.29,11.71L1.2,14.8C0.84,15.16 0.66,15.64 0.66,16.13C0.66,16.62 0.84,17.1 1.2,17.46L4.83,21.09C5.19,21.45 5.67,21.63 6.16,21.63C6.65,21.63 7.13,21.45 7.49,21.09L11.17,17.41C11.36,17.32 11.53,17.21 11.69,17.08L15.17,20.56L18.59,17.13L14.95,13.5C15.03,13.35 15.09,13.18 15.13,13L19.54,8.59L20.59,9.64C20.95,10 21.13,10.48 21.13,10.97C21.13,11.46 20.95,11.94 20.59,12.3L20.59,13.41Z"
              />
            </svg>
            <span class="ml-1 text-sm font-medium">分类:</span>
            <span class="text-base-content/80 text-sm">{{ getCategoryLabel }}</span>
          </div>
          <ul
            tabindex="0"
            class="ring-base-content/10 dropdown-content menu z-10 w-56 rounded-xl bg-base-100 p-2 shadow-xl ring-1"
          >
            <li>
              <a
                @click="updateCategory('')"
                :class="{ active: !props.modelValue.category }"
                class="hover:bg-primary/10 rounded-lg transition-all"
                >全部</a
              >
            </li>
            <li v-for="category in categories" :key="category.value">
              <a
                @click="updateCategory(category.value)"
                :class="{ active: props.modelValue.category === category.value }"
                class="hover:bg-primary/10 rounded-lg transition-all"
              >
                {{ category.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 尺寸筛选 -->
        <div class="dropdown dropdown-hover">
          <div
            tabindex="0"
            role="button"
            class="bg-base-100/80 border-base-content/20 hover:border-primary/50 btn btn-outline btn-sm h-10 border-2 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-accent"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M19 7H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 12H5V9h14v10zM7 11h2v2H7v-2zm4 0h6v2h-6v-2zm0-4h10v2H11V7z"
              />
            </svg>
            <span class="ml-1 text-sm font-medium">尺寸:</span>
            <span class="text-base-content/80 text-sm">{{ getResolutionLabel }}</span>
          </div>
          <ul
            tabindex="0"
            class="ring-base-content/10 dropdown-content menu z-10 w-56 rounded-xl bg-base-100 p-2 shadow-xl ring-1"
          >
            <li>
              <a
                @click="updateResolution('')"
                :class="{ active: !props.modelValue.resolution }"
                class="hover:bg-primary/10 rounded-lg transition-all"
                >全部</a
              >
            </li>
            <li v-for="resolution in resolutions" :key="resolution">
              <a
                @click="updateResolution(resolution)"
                :class="{ active: props.modelValue.resolution === resolution }"
                class="hover:bg-primary/10 rounded-lg transition-all"
              >
                {{ resolution }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 比例筛选 -->
        <div class="dropdown dropdown-hover">
          <div
            tabindex="0"
            role="button"
            class="bg-base-100/80 border-base-content/20 hover:border-primary/50 btn btn-outline btn-sm h-10 border-2 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-warning"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M19 7h-5V5h10v10h-2V7zM5 19h10v2H5v-2zm0-8h2v6H5v-6zm12 6h2v2h-2v-2zm2-8h2v4h-2V9z"
              />
            </svg>
            <span class="ml-1 text-sm font-medium">比例:</span>
            <span class="text-base-content/80 text-sm">{{ getRatioLabel }}</span>
          </div>
          <ul
            tabindex="0"
            class="ring-base-content/10 dropdown-content menu z-10 w-56 rounded-xl bg-base-100 p-2 shadow-xl ring-1"
          >
            <li>
              <a
                @click="updateRatio('')"
                :class="{ active: !props.modelValue.ratio }"
                class="hover:bg-primary/10 rounded-lg transition-all"
                >全部</a
              >
            </li>
            <li v-for="ratio in ratios" :key="ratio">
              <a
                @click="updateRatio(ratio)"
                :class="{ active: props.modelValue.ratio === ratio }"
                class="hover:bg-primary/10 rounded-lg transition-all"
              >
                {{ ratio }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 搜索框 -->
        <div class="w-full flex-1 sm:max-w-md">
          <div class="relative">
            <input
              :value="props.modelValue.search"
              @input="handleSearchInputEvent"
              type="text"
              placeholder="输入标签关键字搜索壁纸..."
              class="border-base-content/20 bg-base-100/80 focus:border-primary/50 focus:ring-primary/10 hover:border-base-content/30 input input-sm h-10 w-full rounded-xl border-2 pl-10 pr-10 shadow-sm transition-all focus:ring-2"
              @keyup.enter.prevent="handleSearch"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              />
            </svg>
            <button
              v-if="props.modelValue.search"
              class="hover:bg-error/10 btn btn-ghost btn-xs absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
              type="button"
              @click="clearSearch"
              title="清除搜索"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="text-base-content/60 h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              </svg>
            </button>

            <transition name="fade">
              <div
                v-if="showSuggestionPanel"
                class="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-base-200 bg-base-100 p-2 shadow-xl"
              >
                <div
                  v-if="searchLoading"
                  class="text-base-content/60 flex items-center gap-2 px-2 py-3 text-sm"
                >
                  <span class="loading loading-spinner loading-xs text-primary"></span>
                  搜索标签中...
                </div>
                <template v-else>
                  <button
                    v-for="tag in tagSuggestions"
                    :key="tag.id"
                    class="hover:bg-primary/10 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all"
                    type="button"
                    @click="applyTagSuggestion(tag.name)"
                  >
                    <div class="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 text-primary"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M20.59,13.41L12,22L8,18L18.24,7.76C18.46,7.37 18.61,6.92 18.67,6.46L15.11,9.99L13.11,7.99L16.54,4.56C16.92,4.19 17.37,4.02 17.83,3.96L17.95,3.5L13.37,4.08L9.83,0.54C9.47,0.18 8.99,0 8.5,0C8,0 7.52,0.18 7.16,0.54L3.5,4.2C3.37,4.36 3.26,4.53 3.17,4.71L0.81,8.24L4.29,11.71L1.2,14.8C0.84,15.16 0.66,15.64 0.66,16.13C0.66,16.62 0.84,17.1 1.2,17.46L4.83,21.09C5.19,21.45 5.67,21.63 6.16,21.63C6.65,21.63 7.13,21.45 7.49,21.09L11.17,17.41C11.36,17.32 11.53,17.21 11.69,17.08L15.17,20.56L18.59,17.13L14.95,13.5C15.03,13.35 15.09,13.18 15.13,13L19.54,8.59L20.59,9.64C20.95,10 21.13,10.48 21.13,10.97C21.13,11.46 20.95,11.94 20.59,12.3L20.59,13.41Z"
                        />
                      </svg>
                      <span class="font-medium text-base-content">{{ tag.name }}</span>
                    </div>
                    <span class="text-base-content/60 text-xs">使用 {{ tag.usageCount }}</span>
                  </button>
                  <p
                    v-if="!tagSuggestions.length"
                    class="text-base-content/50 px-2 py-3 text-center text-xs"
                  >
                    未找到匹配的标签
                  </p>
                </template>
              </div>
            </transition>
          </div>
        </div>

        <!-- 重置按钮 -->
        <button
          v-if="hasActiveFilters"
          class="btn btn-neutral btn-sm h-10 rounded-xl shadow-md transition-all hover:scale-105"
          @click="resetFilters"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            />
          </svg>
          <span class="ml-1 text-sm font-medium">重置</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import tagService, { type Tag } from '@/services/tag'

interface Filters {
  sortBy: 'latest' | 'popular' | 'random'
  category: string
  resolution: string
  ratio: string
  search: string
}

interface Props {
  modelValue: Filters
}

interface Emits {
  (e: 'update:modelValue', filters: Filters): void
  (e: 'filter-change'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const route = useRoute()
const router = useRouter()

// 筛选选项
const sortOptions: Array<{
  value: 'latest' | 'popular' | 'random'
  label: string
}> = [
  { value: 'latest', label: '最新上传' },
  { value: 'popular', label: '最受欢迎' },
  { value: 'random', label: '随机推荐' },
]

const categories = [
  { value: 'general', label: '综合' },
  { value: 'anime', label: '动漫' },
  { value: 'people', label: '人物' },
]

const resolutions = [
  '1920x1080',
  '2560x1440',
  '3840x2160',
  '5120x2880',
  '1080x1920',
  '1440x2560',
  '2160x3840',
]

const ratios = ['16:9', '16:10', '4:3', '21:9', '1:1', '9:16']

// 计算属性
const getSortLabel = computed(() => {
  return sortOptions.find((opt) => opt.value === props.modelValue.sortBy)?.label || '最新上传'
})

const getCategoryLabel = computed(() => {
  return categories.find((c) => c.value === props.modelValue.category)?.label || '全部'
})

const getResolutionLabel = computed(() => {
  return props.modelValue.resolution || '全部'
})

const getRatioLabel = computed(() => {
  return props.modelValue.ratio || '全部'
})

const hasActiveFilters = computed(() => {
  return (
    props.modelValue.category ||
    props.modelValue.resolution ||
    props.modelValue.ratio ||
    props.modelValue.search
  )
})

// 搜索防抖
let searchTimeout: NodeJS.Timeout | null = null
let suggestionTimeout: NodeJS.Timeout | null = null
const tagSuggestions = ref<Tag[]>([])
const searchLoading = ref(false)

const showSuggestionPanel = computed(() => {
  return (
    !!props.modelValue.search.trim() && (searchLoading.value || tagSuggestions.value.length > 0)
  )
})

// 方法
const updateFilters = (updates: Partial<Filters>) => {
  const newFilters = { ...props.modelValue, ...updates }
  emit('update:modelValue', newFilters)
  emit('filter-change')
}

const updateSort = (sortBy: 'latest' | 'popular' | 'random') => {
  updateFilters({ sortBy })

  // 更新路由查询参数
  router.push({
    path: route.path,
    query: {
      ...route.query,
      sort: sortBy,
    },
  })
}

const updateCategory = (category: string) => {
  updateFilters({ category })
}

const updateResolution = (resolution: string) => {
  updateFilters({ resolution })
}

const updateRatio = (ratio: string) => {
  updateFilters({ ratio })
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  emit('filter-change')
}

// 搜索防抖处理
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
    emit('filter-change')
  }, 500)
}

const fetchTagSuggestions = async (keyword: string) => {
  searchLoading.value = true
  try {
    const response = await tagService.getTags({
      keyword,
      limit: 6,
      sortBy: 'usageCount',
      sortOrder: 'DESC',
    })
    tagSuggestions.value = response.data || []
  } catch (error) {
    console.error('加载标签建议失败:', error)
    tagSuggestions.value = []
  } finally {
    searchLoading.value = false
  }
}

const resetFilters = () => {
  updateFilters({
    category: '',
    resolution: '',
    ratio: '',
    search: '',
  })
  tagSuggestions.value = []
}

const applyTagSuggestion = (tagName: string) => {
  updateFilters({ search: tagName })
  tagSuggestions.value = []
  emit('filter-change')
}

const clearSearch = () => {
  if (!props.modelValue.search) return
  updateFilters({ search: '' })
  tagSuggestions.value = []
}

const handleSearchInputEvent = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  updateFilters({ search: value })
  handleSearchInput(value)
}

// 监听路由查询参数变化
watch(
  () => route.query.sort,
  (newSort) => {
    if (newSort && ['latest', 'popular', 'random'].includes(newSort as string)) {
      const newSortValue = newSort as 'latest' | 'popular' | 'random'
      if (props.modelValue.sortBy !== newSortValue) {
        updateFilters({ sortBy: newSortValue })
      }
    }
  },
)

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  if (suggestionTimeout) {
    clearTimeout(suggestionTimeout)
  }
})
</script>

<style scoped>
.dropdown-content {
  max-height: 300px;
  overflow-y: auto;
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
