<template>
  <div class="card-shell group" @click="handleClick">
    <figure class="card-figure">
      <img
        :src="wallpaper.thumbnailUrl || wallpaper.fileUrl"
        class="card-image"
        loading="lazy"
        :alt="`壁纸 ${wallpaper.id}`"
        @load="handleImageLoad"
        @error="handleImageError"
      />

      <div v-if="!imageLoaded && !imageError" class="card-skeleton"></div>
      <div v-if="imageError" class="card-error">
        <i class="i-mdi-image-off text-4xl text-slate-400"></i>
      </div>
      <div class="card-glow"></div>
      <div class="card-overlay">
        <div class="overlay-pill">ID · {{ wallpaper.id }}</div>
        <div class="overlay-info">
          <span>{{ wallpaper.width }}×{{ wallpaper.height }}</span>
          <span>views {{ wallpaper.viewCount || 0 }}</span>
        </div>
      </div>
      <div v-if="showActions" class="card-actions">
        <div class="card-actions__wrap">
          <button
            class="action-icon"
            :class="{ 'text-red-300': isLiked }"
            :disabled="liking"
            @click.stop="handleLike"
            title="点赞"
          >
            👍
          </button>
          <button
            class="action-icon"
            :class="{ 'text-yellow-200': isFavorited }"
            :disabled="favoriting"
            @click.stop="handleFavorite"
            title="收藏"
          >
            ☆
          </button>
        </div>
      </div>
    </figure>
    <div class="card-footer">
      <div class="stat-row">
        <span class="stat-badge">
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {{ wallpaper.viewCount || 0 }}
        </span>
        <span class="stat-badge">
          <svg class="h-3.5 w-3.5" :class="isLiked ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-current'" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {{ likeCount }}
        </span>
        <span class="stat-badge">
          <svg class="h-3.5 w-3.5" :class="isFavorited ? 'fill-amber-400 stroke-amber-400' : 'fill-none stroke-current'" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          {{ favoriteCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { Wallpaper } from "@/services/wallpaper";
import { wallpaperService } from "@/services/wallpaper";
import { useUserStore } from "@/stores";

interface Props {
  wallpaper: Wallpaper;
  showActions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
});

const router = useRouter();
const userStore = useUserStore();

const imageLoaded = ref(false);
const imageError = ref(false);
const likeCount = ref(props.wallpaper.likeCount || 0);
const favoriteCount = ref(props.wallpaper.favoriteCount || 0);
const isLiked = ref(Boolean(props.wallpaper.isLiked));
const isFavorited = ref(Boolean(props.wallpaper.isFavorited));
const liking = ref(false);
const favoriting = ref(false);

const handleCardClick = () => {
  router.push(`/wallpaper/${props.wallpaper.id}`);
};

const syncState = (wallpaper: Wallpaper) => {
  likeCount.value = wallpaper.likeCount || 0;
  favoriteCount.value = wallpaper.favoriteCount || 0;
  isLiked.value = Boolean(wallpaper.isLiked);
  isFavorited.value = Boolean(wallpaper.isFavorited);
};

watch(
  () => props.wallpaper,
  (newWallpaper) => {
    if (newWallpaper) {
      syncState(newWallpaper);
    }
  },
);
syncState(props.wallpaper);

const ensureAuth = () => {
  if (userStore.isLoggedIn) {
    return true;
  }
  router.push("/auth/login");
  return false;
};

const handleLike = async () => {
  if (!ensureAuth() || liking.value) {
    return;
  }

  liking.value = true;
  try {
    if (isLiked.value) {
      await wallpaperService.unlikeWallpaper(props.wallpaper.id);
      isLiked.value = false;
      likeCount.value = Math.max(0, likeCount.value - 1);
    } else {
      await wallpaperService.likeWallpaper(props.wallpaper.id);
      isLiked.value = true;
      likeCount.value += 1;
    }
  } catch (error) {
    console.error("点赞壁纸失败:", error);
    alert("点赞失败，请稍后重试");
  } finally {
    liking.value = false;
  }
};

const handleFavorite = async () => {
  if (!ensureAuth() || favoriting.value) {
    return;
  }

  favoriting.value = true;
  try {
    if (isFavorited.value) {
      await wallpaperService.unfavoriteWallpaper(props.wallpaper.id);
      isFavorited.value = false;
      favoriteCount.value = Math.max(0, favoriteCount.value - 1);
    } else {
      await wallpaperService.favoriteWallpaper(props.wallpaper.id);
      isFavorited.value = true;
      favoriteCount.value += 1;
    }
  } catch (error) {
    console.error("收藏壁纸失败:", error);
    alert("收藏失败，请稍后重试");
  } finally {
    favoriting.value = false;
  }
};

const handleImageLoad = () => {
  imageLoaded.value = true;
  imageError.value = false;
};

const handleImageError = () => {
  imageLoaded.value = false;
  imageError.value = true;
};

const handleClick = (event: Event) => {
  const target = event.target as HTMLElement;
  if (target.closest("button")) {
    return;
  }
  handleCardClick();
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');

.card-shell {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1.8rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 45px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  font-family: 'Sora', 'Noto Sans SC', sans-serif;
}

.card-shell:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 55px rgba(15, 23, 42, 0.18);
}

.card-figure {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.card-shell:hover .card-image {
  transform: scale(1.05);
}

.card-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 200%;
  animation: shimmer 1.8s ease infinite;
}

.card-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
}

.card-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 118, 110, 0) 50%, rgba(15, 118, 110, 0.35));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card-shell:hover .card-glow {
  opacity: 1;
}

.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
  pointer-events: none;
}

.overlay-pill {
  align-self: flex-start;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  font-weight: 600;
  color: #0f172a;
  border: 1px solid rgba(15, 23, 42, 0.12);
}

.overlay-info {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.card-actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 1rem;
  pointer-events: none;
}

.card-actions__wrap {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.card-shell:hover .card-actions__wrap {
  opacity: 1;
}

.action-icon {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.65);
  color: #fff;
  font-size: 0.75rem;
  transition: transform 0.2s ease, background 0.2s ease;
}

.action-icon:hover {
  transform: translateY(-2px);
  background: rgba(15, 23, 42, 0.8);
}

.card-footer {
  padding: 0.9rem 1rem 1.1rem;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  border-radius: 1.1rem;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.2);
  font-size: 0.8rem;
  color: #475569;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
}

@keyframes shimmer {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}
</style>
