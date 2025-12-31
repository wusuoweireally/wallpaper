<template>
  <div class="detail-shell">
    <nav class="detail-nav">
      <button class="nav-btn" @click="$router.back()">
        <i class="i-mdi-arrow-left text-lg"></i>
        返回
      </button>
      <button class="nav-icon-btn" @click="handleShare">
        <i class="i-mdi-share-variant text-lg"></i>
      </button>
    </nav>

    <div v-if="loading" class="detail-loader">
      <span class="loading loading-lg loading-spinner text-primary"></span>
    </div>

    <div v-else-if="error" class="detail-error">
      <div class="detail-error__card">
        <i class="i-mdi-alert-circle text-xl"></i>
        <span>{{ error }}</span>
      </div>
    </div>

    <div v-else class="detail-container">
      <header class="detail-header">
        <p class="detail-kicker">WALLPAPER STORY</p>
        <div class="detail-title-row">
          <h1 class="detail-title">
            {{ wallpaper.title || `壁纸 #${wallpaper.id}` }}
          </h1>
          <span class="detail-id">ID · {{ wallpaper.id }}</span>
        </div>
        <p v-if="wallpaper.description" class="detail-desc">
          {{ wallpaper.description }}
        </p>
        <div class="detail-meta">
          <span class="meta-pill">分类：{{ categoryLabel }}</span>
          <span class="meta-pill">上传：{{ wallpaper.uploadDate }}</span>
          <span class="meta-pill">
            {{ wallpaper.width }} × {{ wallpaper.height }} px
          </span>
        </div>
      </header>

      <div class="detail-grid">
        <section class="media-card">
          <div class="media-frame">
            <img
              :src="wallpaper.imageUrl"
              class="media-img"
              @load="imageLoaded = true"
            />
            <div v-if="!imageLoaded" class="media-loader">
              <span class="loading loading-lg loading-spinner"></span>
            </div>
          </div>
          <div class="media-actions">
            <button
              v-for="resolution in wallpaper.resolutions"
              :key="resolution"
              class="resolution-btn"
              @click="selectResolution(resolution)"
            >
              {{ resolution }}
            </button>
          </div>
        </section>

        <aside class="info-panel">
          <div class="info-section">
            <h3 class="info-title">标签</h3>
            <div class="tag-list">
              <span v-for="tag in wallpaper.tags" :key="tag" class="tag-chip">
                {{ tag }}
              </span>
            </div>
          </div>

          <div class="info-section">
            <h3 class="info-title">尺寸与格式</h3>
            <p class="info-text">
              {{ wallpaper.width }} × {{ wallpaper.height }} px
            </p>
            <p class="info-subtext">
              {{ wallpaper.fileSize }} · {{ wallpaper.format || '未知格式' }}
            </p>
          </div>

          <div class="info-section">
            <h3 class="info-title">上传者</h3>
            <div class="uploader">
              <div class="uploader-avatar">
                <img
                  :src="wallpaper.uploader.avatar"
                  :alt="wallpaper.uploader.name"
                  @error="handleAvatarError"
                />
              </div>
              <div>
                <p class="uploader-name">
                  {{ wallpaper.uploader.name }}
                </p>
                <p class="uploader-time">{{ wallpaper.uploadDate }}</p>
              </div>
            </div>
          </div>

          <div class="stat-grid">
            <div class="stat-pill">
              <i class="i-mdi-thumb-up text-base text-emerald-600"></i>
              <div>
                <p class="stat-label">点赞</p>
                <p class="stat-value">{{ wallpaper.likes }}</p>
              </div>
            </div>
            <div class="stat-pill">
              <i class="i-mdi-star text-base text-amber-500"></i>
              <div>
                <p class="stat-label">收藏</p>
                <p class="stat-value">{{ wallpaper.favorites }}</p>
              </div>
            </div>
          </div>

          <div class="action-row">
            <button
              class="action-btn action-btn--like"
              :class="{ 'is-active': isLiked }"
              @click="handleLike"
            >
              <i class="i-mdi-heart text-sm"></i>
              {{ isLiked ? "已点赞" : "点赞" }}
            </button>
            <button
              class="action-btn action-btn--favorite"
              :class="{ 'is-active': isFavorited }"
              @click="handleFavorite"
            >
              <i class="i-mdi-star text-sm"></i>
              {{ isFavorited ? "已收藏" : "收藏" }}
            </button>
          </div>

          <div class="action-stack">
            <button class="action-cta" @click="downloadWallpaper">
              <i class="i-mdi-download text-base"></i>
              下载壁纸
            </button>
            <p v-if="shareNotice" class="share-notice">
              {{ shareNotice }}
            </p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { wallpaperService } from "@/services/wallpaper";
import { useUserStore } from "@/stores";

// 壁纸详情接口
interface WallpaperDetail {
  id: number;
  title: string;
  description: string;
  category: "general" | "anime" | "people";
  format?: string;
  imageUrl: string;
  width: number;
  height: number;
  fileSize: string;
  tags: string[];
  uploader: {
    id: number;
    name: string;
    avatar: string;
  };
  uploadDate: string;
  likes: number;
  favorites: number;
  resolutions: string[];
}

const route = useRoute();
const wallpaperId = route.params.id;
const userStore = useUserStore();
const imageLoaded = ref(false);
const isLiked = ref(false);
const isFavorited = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
const detailTimeoutId = ref<NodeJS.Timeout | null>(null);
const shareNotice = ref("");

// 壁纸详情数据
const wallpaper = ref<WallpaperDetail>({
  id: 0,
  title: "",
  description: "",
  category: "general",
  format: "",
  imageUrl: "",
  width: 0,
  height: 0,
  fileSize: "",
  tags: [],
  uploader: {
    id: 0,
    name: "",
    avatar: "",
  },
  uploadDate: "",
  likes: 0,
  favorites: 0,
  resolutions: [],
});

const categoryLabelMap = {
  general: "通用",
  anime: "动漫",
  people: "人物",
} as const;

const categoryLabel = computed(
  () => categoryLabelMap[wallpaper.value.category] || "其他",
);

// 页面加载时获取壁纸详情
onMounted(() => {
  fetchWallpaperDetail();
});

// 获取壁纸详情
const fetchWallpaperDetail = async () => {
  loading.value = true;
  error.value = null;

  try {
    const id = Number(wallpaperId);
    if (isNaN(id)) {
      throw new Error("无效的壁纸ID");
    }

    // 同时获取壁纸详情和关联标签
    const [wallpaperResponse, tagsResponse] = await Promise.all([
      wallpaperService.getWallpaperDetail(id),
      wallpaperService.getWallpaperTags(id),
    ]);

    // 检查响应是否成功
    if (!wallpaperResponse.success) {
      throw new Error(wallpaperResponse.message || "获取壁纸详情失败");
    }

    // 转换API数据格式以匹配组件接口
    wallpaper.value = {
      id: wallpaperResponse.data.id,
      title: wallpaperResponse.data.title || "",
      description: wallpaperResponse.data.description || "",
      category: wallpaperResponse.data.category || "general",
      format:
        wallpaperResponse.data.format ||
        wallpaperResponse.data.fileUrl?.split(".").pop()?.toUpperCase() ||
        "",
      imageUrl: wallpaperResponse.data.fileUrl,
      width: wallpaperResponse.data.width,
      height: wallpaperResponse.data.height,
      fileSize: `${(wallpaperResponse.data.fileSize / 1024 / 1024).toFixed(2)} MB`,
      tags: tagsResponse.success ? tagsResponse.data.map((tag: any) => tag.name) : [], // 从标签接口获取标签名称
      uploader: {
        id: wallpaperResponse.data.uploaderId,
        name: wallpaperResponse.data.uploader?.username || "未知用户",
        avatar: wallpaperResponse.data.uploader?.avatarUrl || "", // 使用后端处理后的完整头像URL
      },
      uploadDate: new Date(
        wallpaperResponse.data.createdAt,
      ).toLocaleDateString(),
      likes: wallpaperResponse.data.likeCount,
      favorites: wallpaperResponse.data.favoriteCount,
      resolutions: [
        `${wallpaperResponse.data.width}x${wallpaperResponse.data.height}`,
      ], // 简化处理
    };

    // 初始化点赞和收藏状态（如果API返回则使用，否则设为false）
    isLiked.value = wallpaperResponse.data.isLiked || false;
    isFavorited.value = wallpaperResponse.data.isFavorited || false;
  } catch (err: any) {
    console.error("获取壁纸详情失败:", err);

    // 静默处理请求被取消的情况，不显示错误信息
    if (err.message === '请求已取消' || err.name === 'REQUEST_CANCELLED' || err.isCancelled) {
      return;
    }

    // 其他错误才显示错误信息
    error.value = err instanceof Error ? err.message : "获取壁纸详情失败";
  } finally {
    loading.value = false;
  }
};

// 处理点赞
const handleLike = async () => {
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    alert("请先登录后再点赞");
    return;
  }

  const id = Number(wallpaperId);
  if (isNaN(id)) {
    console.error("无效的壁纸ID");
    return;
  }

  // 保存当前状态用于错误回滚
  const previousLiked = isLiked.value;
  const previousLikes = wallpaper.value.likes;

  // 确定要执行的操作（根据当前状态）
  const shouldLike = !previousLiked;

  // 乐观更新UI
  isLiked.value = shouldLike;
  if (shouldLike) {
    wallpaper.value.likes++;
  } else {
    wallpaper.value.likes--;
  }

  try {
    // 调用API
    if (shouldLike) {
      await wallpaperService.likeWallpaper(id);
    } else {
      await wallpaperService.unlikeWallpaper(id);
    }
  } catch (err: any) {
    // API调用失败，回滚状态
    isLiked.value = previousLiked;
    wallpaper.value.likes = previousLikes;

    // 处理错误
    if (err.response?.status === 401) {
      alert("登录已过期，请重新登录");
    } else {
      const errorMessage =
        err.response?.data?.message || err.message || "操作失败，请稍后重试";
      console.error("点赞操作失败:", errorMessage);
      alert(errorMessage);
    }
  }
};

// 处理收藏
const handleFavorite = async () => {
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    alert("请先登录后再收藏");
    return;
  }

  const id = Number(wallpaperId);
  if (isNaN(id)) {
    console.error("无效的壁纸ID");
    return;
  }

  // 保存当前状态用于错误回滚
  const previousFavorited = isFavorited.value;
  const previousFavorites = wallpaper.value.favorites;

  // 确定要执行的操作（根据当前状态）
  const shouldFavorite = !previousFavorited;

  // 乐观更新UI
  isFavorited.value = shouldFavorite;
  if (shouldFavorite) {
    wallpaper.value.favorites++;
  } else {
    wallpaper.value.favorites--;
  }

  try {
    // 调用API
    if (shouldFavorite) {
      await wallpaperService.favoriteWallpaper(id);
    } else {
      await wallpaperService.unfavoriteWallpaper(id);
    }
  } catch (err: any) {
    // API调用失败，回滚状态
    isFavorited.value = previousFavorited;
    wallpaper.value.favorites = previousFavorites;

    // 处理错误
    if (err.response?.status === 401) {
      alert("登录已过期，请重新登录");
    } else {
      const errorMessage =
        err.response?.data?.message || err.message || "操作失败，请稍后重试";
      console.error("收藏操作失败:", errorMessage);
      alert(errorMessage);
    }
  }
};

// 处理头像加载失败
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  // 设置默认头像
  img.src = '/uploads/profile-pictures/defaultAvatar.png';
  img.onerror = null; // 防止无限循环
};

// 选择分辨率
const selectResolution = (_resolution: string) => {
  // TODO: 这里可以处理分辨率选择逻辑，比如显示不同分辨率的图片
};

const pushShareNotice = (message: string) => {
  shareNotice.value = message;
  window.setTimeout(() => {
    shareNotice.value = "";
  }, 2500);
};

const handleShare = async () => {
  const shareUrl = `${window.location.origin}/wallpaper/${wallpaper.value.id}`;
  const shareTitle = wallpaper.value.title || "随心壁纸";
  try {
    if (navigator.share) {
      await navigator.share({
        title: shareTitle,
        text: wallpaper.value.description || shareTitle,
        url: shareUrl,
      });
      pushShareNotice("已发起分享");
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    pushShareNotice("链接已复制");
  } catch (err) {
    console.error("分享失败:", err);
    pushShareNotice("分享失败，请稍后重试");
  }
};

const downloadWallpaper = () => {
  if (!wallpaper.value.imageUrl) {
    pushShareNotice("图片链接无效，无法下载");
    return;
  }

  const fileName = `${wallpaper.value.title || "wallpaper"}-${wallpaper.value.id}`;
  const link = document.createElement("a");
  link.href = wallpaper.value.imageUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  pushShareNotice("开始下载壁纸");
};

// 组件卸载时清理所有pending请求和计时器
onUnmounted(() => {
  // 清理可能存在的重试计时器
  if (detailTimeoutId.value) {
    clearTimeout(detailTimeoutId.value);
    detailTimeoutId.value = null;
  }

  // 重置加载状态
  loading.value = false;
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Sora:wght@400;500;600;700&display=swap');

.detail-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 18%, rgba(251, 191, 36, 0.18), transparent 50%),
    radial-gradient(circle at 88% 80%, rgba(15, 118, 110, 0.18), transparent 55%),
    linear-gradient(135deg, #f8f3ea, #f1efe9 50%, #eef2f1);
  color: #0f172a;
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
}

.detail-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: rgba(249, 246, 238, 0.88);
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  backdrop-filter: blur(10px);
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  background: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  color: #0f172a;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.nav-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.nav-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  background: rgba(255, 255, 255, 0.7);
  color: #0f172a;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.nav-icon-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.detail-loader {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.detail-error {
  display: flex;
  justify-content: center;
  padding: 3rem 1.5rem;
}

.detail-error__card {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  background: rgba(254, 226, 226, 0.8);
  border: 1px solid rgba(248, 113, 113, 0.4);
  color: #b91c1c;
  font-weight: 600;
}

.detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.detail-kicker {
  font-size: 0.72rem;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  font-weight: 700;
  color: rgba(15, 118, 110, 0.7);
}

.detail-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.detail-title {
  font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
  font-size: 2.8rem;
  font-weight: 700;
  color: #0f172a;
}

.detail-id {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  background: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.7);
}

.detail-desc {
  font-size: 1rem;
  color: #475569;
  max-width: 640px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.meta-pill {
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
  font-weight: 600;
  font-size: 0.85rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 2rem;
}

.media-card {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 26px;
  padding: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 32px 60px rgba(15, 23, 42, 0.12);
}

.media-frame {
  position: relative;
  border-radius: 20px;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.18), rgba(251, 191, 36, 0.2));
  overflow: hidden;
}

.media-img {
  width: 100%;
  height: 100%;
  max-height: 520px;
  object-fit: contain;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.15);
  transition: transform 0.35s ease;
}

.media-img:hover {
  transform: scale(1.01);
}

.media-loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
}

.media-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.2rem;
}

.resolution-btn {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  background: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f172a;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.resolution-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.info-panel {
  background: rgba(255, 255, 255, 0.88);
  border-radius: 26px;
  padding: 1.75rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 28px 55px rgba(15, 23, 42, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-title {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(15, 23, 42, 0.6);
}

.info-text {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.info-subtext {
  font-size: 0.85rem;
  color: #64748b;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-chip {
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 118, 110, 0.25);
  background: rgba(15, 118, 110, 0.08);
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 600;
}

.uploader {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.uploader-avatar {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff;
}

.uploader-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploader-name {
  font-weight: 600;
  color: #0f172a;
}

.uploader-time {
  font-size: 0.8rem;
  color: #64748b;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.stat-label {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(15, 23, 42, 0.6);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.6rem 0.8rem;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  font-weight: 600;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.85);
  color: #0f172a;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.12);
}

.action-btn--like.is-active {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(16, 185, 129, 0.4);
  color: #0f766e;
}

.action-btn--favorite.is-active {
  background: rgba(245, 158, 11, 0.18);
  border-color: rgba(245, 158, 11, 0.4);
  color: #b45309;
}

.action-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  border-radius: 16px;
  padding: 0.85rem 1rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(120deg, #0f766e, #f59e0b);
  box-shadow: 0 20px 35px rgba(15, 23, 42, 0.18);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.action-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 40px rgba(15, 23, 42, 0.22);
}

.share-notice {
  font-size: 0.85rem;
  color: #0f766e;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .media-img {
    max-height: 420px;
  }
}

@media (max-width: 640px) {
  .detail-title {
    font-size: 2.2rem;
  }

  .detail-container {
    padding: 2rem 1rem 3rem;
  }
}
</style>
