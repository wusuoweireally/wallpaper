<template>
  <div class="py-8">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="showcaseWallpapers.length === 0" class="py-12 text-center">
      <i class="i-mdi-image-off mb-4 text-6xl text-gray-300"></i>
      <p class="text-lg text-gray-500">暂无精选壁纸</p>
    </div>

    <!-- 精选壁纸网格 -->
    <div
      v-else
      class="grid grid-cols-2 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4"
    >
      <div
        v-for="wallpaper in showcaseWallpapers"
        :key="wallpaper.id"
        class="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-b from-base-200 to-base-100 shadow-lg transition-all duration-500 hover:shadow-2xl"
        @click="$router.push(`/wallpaper/${wallpaper.id}`)"
      >
        <!-- 主图片容器 -->
        <div class="relative aspect-[4/5] overflow-hidden">
          <img
            :src="wallpaper.thumbnailUrl || wallpaper.fileUrl"
            class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            @load="handleImageLoad(wallpaper)"
          />

          <!-- 悬停覆盖层 -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <div class="absolute bottom-3 left-3 right-3">
              <div class="flex items-center justify-center gap-2 text-white">
                <!-- 查看数 -->
                <div
                  class="flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 backdrop-blur-sm"
                >
                  <svg class="h-3.5 w-3.5 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                    />
                  </svg>
                  <span class="text-[10px] font-medium">{{
                    formatNumber(wallpaper.viewCount || 0)
                  }}</span>
                </div>

                <!-- 分割线 -->
                <div class="h-3 w-px bg-white/30"></div>

                <!-- 点赞数 -->
                <div
                  class="flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 backdrop-blur-sm"
                >
                  <svg class="h-3.5 w-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    />
                  </svg>
                  <span class="text-[10px] font-medium">{{
                    formatNumber(wallpaper.likeCount || 0)
                  }}</span>
                </div>

                <!-- 分割线 -->
                <div class="h-3 w-px bg-white/30"></div>

                <!-- 收藏数 -->
                <div
                  class="flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 backdrop-blur-sm"
                >
                  <svg class="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                    />
                  </svg>
                  <span class="text-[10px] font-medium">{{
                    formatNumber(wallpaper.favoriteCount || 0)
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 加载状态 -->
          <div
            v-if="!wallpaper.loaded"
            class="absolute inset-0 flex items-center justify-center bg-base-200"
          >
            <span class="loading loading-spinner loading-lg text-primary"></span>
          </div>

          <!-- 分辨率标签 -->
          <div class="absolute left-3 top-3">
            <div class="badge badge-neutral badge-lg backdrop-blur-sm">
              {{ wallpaper.width }}×{{ wallpaper.height }}
            </div>
          </div>
        </div>

        <!-- 标签 -->
        <div class="p-4">
          <div class="flex flex-wrap gap-2">
            <div
              v-for="tag in wallpaper.tags?.slice(0, 3) || []"
              :key="tag.id"
              class="badge badge-outline badge-sm cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-primary-content"
              @click.stop="$router.push(`/tag/${tag.id}`)"
            >
              <svg class="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ tag.name }}
            </div>
            <span v-if="(wallpaper.tags?.length || 0) > 3" class="badge badge-ghost badge-sm">
              +{{ (wallpaper.tags?.length || 0) - 3 }}
            </span>
          </div>
        </div>

        <!-- 悬停效果边框 -->
        <div
          class="ring-primary/0 group-hover:ring-primary/20 absolute inset-0 rounded-2xl ring-2 transition-all duration-300"
        ></div>
      </div>
    </div>

    <!-- 查看更多按钮 -->
    <div class="mt-8 text-center">
      <router-link to="/wallpapers" class="btn btn-primary rounded-full px-8">
        查看更多壁纸
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"

import { wallpaperService, type Wallpaper } from "@/services/wallpaper"

// 扩展 Wallpaper 接口以包含前端需要的额外属性
interface ExtendedWallpaper extends Wallpaper {
  loaded?: boolean
}

const loading = ref(false)
const showcaseWallpapers = ref<ExtendedWallpaper[]>([])

// 默认头像
const defaultAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"

// 获取精选壁纸
const fetchShowcaseWallpapers = async () => {
  loading.value = true
  try {
    // 使用专门的热门壁纸API获取精选壁纸
    const response = await wallpaperService.getPopularWallpapers(8) // 获取8张热门壁纸

    if (response.data) {
      showcaseWallpapers.value = response.data.map((wallpaper: any) => ({
        ...wallpaper,
        loaded: false,
        uploader: wallpaper.uploader || {
          id: 0,
          username: "未知用户",
          email: "",
          avatarUrl: defaultAvatar,
          status: 0,
          createdAt: "",
          updatedAt: "",
        },
        viewCount: wallpaper.viewCount || 0,
        likeCount: wallpaper.likeCount || 0,
        favoriteCount: wallpaper.favoriteCount || 0,
        // 处理真实的标签数据
        tags: wallpaper.tags && wallpaper.tags.length > 0 ? wallpaper.tags : [], // 如果没有标签，使用空数组
      }))
    }
  } catch (error) {
    console.error("🏠 [首页精选] 获取精选壁纸失败:", error)
    showcaseWallpapers.value = []
  } finally {
    loading.value = false
  }
}

// 图片加载完成
const handleImageLoad = (wallpaper: ExtendedWallpaper) => {
  wallpaper.loaded = true
}

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

onMounted(() => {
  fetchShowcaseWallpapers()
})
</script>

<style scoped>
/* 卡片悬停动画增强 */
.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

/* 头像装饰效果 */
.avatar {
  position: relative;
}

.avatar::before {
  content: "";
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #f59e0b, #ef4444, #8b5cf6, #3b82f6);
  border-radius: 50%;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.group:hover .avatar::before {
  opacity: 0.6;
}

/* 统计数字动画 */
.stats-counter {
  animation: countUp 0.3s ease-out;
}

@keyframes countUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 标签悬停效果 */
.badge:hover {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
</style>
