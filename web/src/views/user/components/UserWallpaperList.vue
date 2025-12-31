<template>
  <div class="space-y-6">
    <!-- 页面标题和统计 -->
    <div
      class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 class="text-2xl font-bold">{{ title }}</h2>
        <p class="mt-1 text-gray-500">共 {{ pagination.total }} 个壁纸</p>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="flex flex-col items-center gap-4">
        <span class="loading loading-lg loading-spinner text-primary"></span>
        <p class="text-gray-500">加载中...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="alert alert-error">
      <i class="i-mdi-alert-circle text-lg"></i>
      <span>{{ error }}</span>
      <button class="btn btn-ghost btn-sm" @click="() => fetchData()">
        重试
      </button>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="!loading && wallpapers.length === 0"
      class="py-16 text-center"
    >
      <div class="flex flex-col items-center gap-4">
        <i class="i-mdi-image-off text-6xl text-gray-300"></i>
        <div>
          <h3 class="text-xl font-semibold text-gray-600">{{ emptyTitle }}</h3>
          <p class="mt-2 text-gray-500">{{ emptyDescription }}</p>
        </div>
        <button
          v-if="emptyAction"
          class="btn mt-4 btn-primary"
          @click="emptyAction.handler"
        >
          {{ emptyAction.text }}
        </button>
      </div>
    </div>

    <!-- 壁纸网格 -->
    <div
      v-else
      class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <WallpaperCard
        v-for="wallpaper in wallpapers"
        :key="wallpaper.id"
        :wallpaper="wallpaper"
        :show-uploader="showUploader"
        :show-actions="showActions"
      />
    </div>

    <!-- 分页 -->
    <div v-if="!loading && wallpapers.length > 0" class="flex justify-center">
      <div class="join">
        <button
          class="btn join-item btn-sm"
          :disabled="pagination.page <= 1"
          @click="handlePageChange(pagination.page - 1)"
        >
          <i class="i-mdi-chevron-left"></i>
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          class="btn join-item btn-sm"
          :class="{ 'btn-active': page === pagination.page }"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </button>

        <button
          class="btn join-item btn-sm"
          :disabled="pagination.page >= pagination.pages"
          @click="handlePageChange(pagination.page + 1)"
        >
          <i class="i-mdi-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue";
import WallpaperCard from "@/components/WallpaperCard.vue";

interface WallpaperItem {
  id: number;
  title?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  uploader?: {
    username: string;
  };
  likeCount: number;
  favoriteCount: number;
  createdAt?: string;
  isLiked?: boolean;
  isFavorited?: boolean;
  width?: number;
  height?: number;
  aspectRatio?: string;
  category?: string;
  viewCount?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface EmptyAction {
  text: string;
  handler: () => void;
}

interface Props {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: EmptyAction;
  showUploader?: boolean;
  showActions?: boolean;
  fetchFunction: (
    page: number,
    limit: number,
    search?: string,
  ) => Promise<{
    data: WallpaperItem[];
    pagination: Pagination;
  }>;
}

const props = withDefaults(defineProps<Props>(), {
  showUploader: true,
  showActions: true,
});

// 响应式数据
const wallpapers = ref<WallpaperItem[]>([]);
const loading = ref(false);
const error = ref<string>("");

// 分页数据
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
});

// 计算可见的页码
const visiblePages = computed(() => {
  const current = pagination.value.page;
  const total = pagination.value.pages;
  const pages: number[] = [];

  // 显示当前页前后各2页
  for (
    let i = Math.max(1, current - 2);
    i <= Math.min(total, current + 2);
    i++
  ) {
    pages.push(i);
  }

  return pages;
});

// 转换后端数据为前端组件期望的格式
const transformWallpaperData = (data: any): WallpaperItem => {
  return {
    id: data.id,
    title: data.title || `壁纸-${data.id}`,
    fileUrl: data.fileUrl,
    thumbnailUrl: data.thumbnailUrl,
    uploader: data.uploader ? { username: data.uploader.username } : undefined,
    likeCount: data.likeCount || 0,
    favoriteCount: data.favoriteCount || 0,
    createdAt: data.createdAt,
    isLiked: data.isLiked || false,
    isFavorited: data.isFavorited || false,
    width: data.width,
    height: data.height,
    aspectRatio: data.aspectRatio,
    category: data.category,
    viewCount: data.viewCount
  };
};

// 获取数据
const fetchData = async (page: number = 1) => {
  try {
    loading.value = true;
    error.value = "";

    const result = await props.fetchFunction(page, pagination.value.limit);
    // 转换数据格式
    wallpapers.value = result.data.map(transformWallpaperData);

    pagination.value = result.pagination;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取数据失败";
    console.error("获取壁纸列表失败:", err);
  } finally {
    loading.value = false;
  }
};

// 搜索处理（防抖）
// 分页处理
const handlePageChange = (page: number) => {
  if (page < 1 || page > pagination.value.pages) return;
  pagination.value.page = page;
  fetchData(page);
};

// 页面加载时获取数据
onMounted(() => {
  fetchData();
});

// 监听分页变化
watch(
  () => pagination.value.page,
  (newPage) => {
    fetchData(newPage);
  },
);

// 暴露方法供父组件调用
defineExpose({
  refresh: () => fetchData(pagination.value.page),
});
</script>
