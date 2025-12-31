<template>
  <div class="min-h-screen bg-base-200">
    <!-- 顶部横幅 -->
    <div class="hero bg-base-100 shadow-md">
      <div class="hero-content text-center">
        <div class="max-w-2xl">
          <h1 class="text-5xl font-bold mb-4">🏷️ 标签库</h1>
          <p class="text-xl mb-6">
            发现和探索不同主题的壁纸标签，找到你喜欢的风格
          </p>
          <div class="form-control">
            <div class="input-group justify-center">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索标签..."
                class="input input-bordered w-80"
                @keyup.enter="handleSearch"
              />
              <button class="btn btn-primary" @click="handleSearch">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- 筛选器 -->
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="form-control">
              <label class="label">
                <span class="label-text">排序方式</span>
              </label>
              <select v-model="sortBy" class="select select-bordered" @change="loadTags">
                <option value="name">按名称</option>
                <option value="usageCount">按使用次数</option>
                <option value="createdAt">按创建时间</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">排序方向</span>
              </label>
              <select v-model="sortOrder" class="select select-bordered" @change="loadTags">
                <option value="ASC">升序</option>
                <option value="DESC">降序</option>
              </select>
            </div>

            <div class="form-control ml-auto">
              <label class="label">
                <span class="label-text">显示全部标签</span>
              </label>
              <button class="btn btn-outline btn-sm" @click="clearFilters">
                清除筛选
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签云 -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div v-if="loading" class="flex justify-center items-center py-20">
            <span class="loading loading-spinner loading-lg"></span>
          </div>

          <div v-else-if="tags.length === 0" class="text-center py-20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 mx-auto text-gray-400" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            <p class="mt-4 text-gray-500">暂无标签数据</p>
          </div>

          <div v-else>
            <!-- 标签云网格 -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div
                v-for="tag in tags"
                :key="tag.id"
                class="card bg-base-200 hover:bg-primary hover:text-primary-content transition-all cursor-pointer transform hover:scale-105"
                @click="goToTagDetail(tag)"
              >
                <div class="card-body p-4">
                  <h3 class="card-title text-sm justify-center">
                    {{ tag.name }}
                  </h3>
                  <p class="text-xs text-center opacity-80">
                    {{ getUsageCount(tag) }} 张壁纸
                  </p>
                </div>
              </div>
            </div>

            <!-- 分页 -->
            <div class="flex justify-center mt-8">
              <div class="join">
                <button
                  class="join-item btn"
                  :disabled="currentPage === 1"
                  @click="changePage(currentPage - 1)"
                >
                  上一页
                </button>
                <button class="join-item btn" disabled>
                  第 {{ currentPage }} 页
                </button>
                <button
                  class="join-item btn"
                  :disabled="!hasMore"
                  @click="changePage(currentPage + 1)"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 热门标签 -->
      <div class="mt-8">
        <h2 class="text-2xl font-bold mb-4">🔥 热门标签</h2>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="tag in popularTags"
            :key="tag.id"
            :to="`/tag/${tag.id}`"
            class="badge badge-lg badge-primary hover:badge-secondary transition-colors"
          >
            {{ tag.name }} ({{ getUsageCount(tag) }})
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import tagService, { type Tag } from '@/services/tag'

const router = useRouter()
const loading = ref(true)
const tags = ref<Tag[]>([])
const popularTags = ref<Tag[]>([])
const searchQuery = ref('')
const sortBy = ref('name')
const sortOrder = ref<'ASC' | 'DESC'>('ASC')
const currentPage = ref(1)
const hasMore = ref(true)

const pageSize = 20
const loadTags = async (reset = false) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
      tags.value = []
    }

    const response = await tagService.getTags({
      keyword: searchQuery.value || undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      page: currentPage.value,
      limit: pageSize
    })

    if (reset) {
      tags.value = response.data
    } else {
      tags.value.push(...response.data)
    }

    if (response.pagination) {
      hasMore.value = response.pagination.page < response.pagination.pages
    } else {
      hasMore.value = response.data.length === pageSize
    }
  } catch (error) {
    console.error('加载标签列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadPopularTags = async () => {
  try {
    const response = await tagService.getTags({
      sortBy: 'usageCount',
      sortOrder: 'DESC'
    })
    popularTags.value = response.data.slice(0, 10)
  } catch (error) {
    console.error('加载热门标签失败:', error)
  }
}

const handleSearch = () => {
  loadTags(true)
}

const clearFilters = () => {
  searchQuery.value = ''
  sortBy.value = 'name'
  sortOrder.value = 'ASC'
  loadTags(true)
}

const changePage = (page: number) => {
  currentPage.value = page
  loadTags()
}

const goToTagDetail = (tag: Tag) => {
  router.push(`/tag/${tag.id}`)
}

const getUsageCount = (tag: Tag) => {
  return tag.usageCount ?? (tag as any).useCount ?? 0
}

onMounted(() => {
  loadTags(true)
  loadPopularTags()
})
</script>
