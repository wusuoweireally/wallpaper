<template>
  <!-- 首屏即精选图墙；搜索在顶栏；标签/论坛下沉到后续 homeblock -->
  <div class="wb-page">
    <div class="wb-container-gallery pb-10 pt-3">
      <HomeBlock
        title="精选壁纸"
        :subtitle="featuredSub"
        to="/wallpapers?sort=popular"
        action-label="浏览全部"
      >
        <div class="no-scrollbar mb-3 flex items-center gap-2 overflow-x-auto pb-0.5">
          <router-link
            v-for="pill in quickPills"
            :key="pill.label"
            :to="pill.to"
            class="chip-link"
            :class="{ 'chip-link--on': pill.primary }"
          >
            {{ pill.label }}
          </router-link>
          <template v-if="tagsLoading">
            <span
              v-for="n in 6"
              :key="n"
              class="wb-skeleton h-7 shrink-0 rounded-full"
              :style="{ width: `${44 + (n % 4) * 16}px` }"
            ></span>
          </template>
          <router-link
            v-for="tag in popularTags.slice(0, 8)"
            v-else
            :key="tag.id"
            :to="{ path: '/wallpapers', query: { tags: tag.name } }"
            class="chip-link"
          >
            {{ tag.name }}
          </router-link>
          <router-link to="/tags" class="shrink-0 text-xs font-medium text-primary hover:underline">
            更多标签
          </router-link>
        </div>

        <div
          v-if="featuredError"
          class="wb-alert-danger mb-3 flex items-center justify-between gap-3"
          role="alert"
        >
          <span>{{ featuredError }}</span>
          <button type="button" class="wb-btn-ghost wb-btn-sm" @click="loadFeatured">重试</button>
        </div>
        <WallpaperGrid
          :wallpapers="featured"
          :loading="featuredLoading"
          :show-pagination="false"
          :show-reset="false"
          masonry
        />
      </HomeBlock>

      <HomeBlock title="论坛动态" to="/forums" action-label="进入论坛">
        <div v-if="forumLoading" class="grid gap-5 lg:grid-cols-3">
          <div v-for="n in 3" :key="n" class="wb-skeleton h-44 rounded-tile"></div>
        </div>
        <div v-else-if="forumPosts.length" class="grid gap-5 lg:grid-cols-3">
          <PostCard v-for="post in forumPosts.slice(0, 3)" :key="post.id" :post="post" />
        </div>
        <p v-else class="text-sm text-faint">暂无讨论，来论坛发第一帖吧。</p>
      </HomeBlock>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue"
import tagService, { type Tag } from "@/services/tag"
import wallpaperService, { type Wallpaper } from "@/services/wallpaper"
import { forumService } from "@/services/forum"
import type { Post } from "@/stores/forum"
import WallpaperGrid from "@/components/WallpaperGrid.vue"
import HomeBlock from "@/components/HomeBlock.vue"
import PostCard from "@/components/PostCard.vue"
import { formatNumber } from "@/utils/format"
import { HOME_FOLD_SIZE, mergeUniqueById } from "@/utils/wallpaperLayout"

const forumLoading = ref(true)
const forumPosts = ref<Post[]>([])
const featuredLoading = ref(true)
const featuredError = ref("")
const featured = ref<Wallpaper[]>([])
const tagsLoading = ref(true)
const popularTags = ref<Tag[]>([])
const stats = ref({ wallpapers: 0, tags: 0 })

const featuredSub = computed(() => {
  const parts: string[] = []
  if (stats.value.wallpapers) parts.push(`${formatNumber(stats.value.wallpapers)} 张壁纸`)
  if (stats.value.tags) parts.push(`${formatNumber(stats.value.tags)} 个标签可筛选`)
  return parts.length ? parts.join(" · ") : "社区高质量作品"
})

const quickPills = [
  { label: "全部", to: "/wallpapers", primary: true },
  { label: "综合", to: "/wallpapers?category=general" },
  { label: "动漫", to: "/wallpapers?category=anime" },
  { label: "真人", to: "/wallpapers?category=people" },
  { label: "横屏", to: "/wallpapers?orientation=landscape" },
  { label: "竖屏", to: "/wallpapers?orientation=portrait" },
  { label: "方形", to: "/wallpapers?orientation=square" },
]

/** 拉壁纸总数（精选副标题用），limit=1 只要 pagination */
const loadWallpaperCount = async () => {
  try {
    const res = await wallpaperService.getWallpapers({
      page: 1,
      limit: 1,
      sortBy: "createdAt",
      sortOrder: "DESC",
    })
    stats.value.wallpapers = res.pagination?.total ?? 0
  } catch {
    /* 副标题降级为不带数字 */
  }
}

/** 精选墙：优先编辑精选，不够用热门/最新补满首屏 */
const loadFeatured = async () => {
  featuredLoading.value = true
  featuredError.value = ""
  try {
    const res = await wallpaperService.getFeaturedWallpapers(HOME_FOLD_SIZE)
    let list = res.data || []
    if (list.length < HOME_FOLD_SIZE) {
      const popular = await wallpaperService.getPopularWallpapers(HOME_FOLD_SIZE)
      list = mergeUniqueById([list, popular.data || []], HOME_FOLD_SIZE)
    }
    if (list.length < HOME_FOLD_SIZE) {
      const latest = await wallpaperService.getWallpapers({
        page: 1,
        limit: HOME_FOLD_SIZE,
        sortBy: "createdAt",
        sortOrder: "DESC",
      })
      list = mergeUniqueById([list, latest.data || []], HOME_FOLD_SIZE)
    }
    featured.value = list
  } catch (e) {
    featuredError.value = e instanceof Error ? e.message : "加载精选失败"
    featured.value = []
  } finally {
    featuredLoading.value = false
  }
}

const loadTags = async () => {
  tagsLoading.value = true
  try {
    const res = await tagService.getTags({
      sortBy: "usageCount",
      sortOrder: "DESC",
      page: 1,
      limit: 28,
    })
    popularTags.value = res.data || []
    stats.value.tags = res.pagination?.total ?? popularTags.value.length
  } catch {
    popularTags.value = []
  } finally {
    tagsLoading.value = false
  }
}

const loadForum = async () => {
  forumLoading.value = true
  try {
    const res = await forumService.getPosts({
      page: 1,
      limit: 6,
      sortBy: "createdAt",
      sortOrder: "DESC",
    })
    forumPosts.value = res.data || []
  } catch {
    forumPosts.value = []
  } finally {
    forumLoading.value = false
  }
}

onMounted(() => {
  void loadFeatured()
  void loadWallpaperCount()
  void loadTags()
  void loadForum()
})
</script>

<style scoped>
.chip-link {
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid var(--wb-border);
  background: var(--wb-surface);
  padding: 0.28rem 0.7rem;
  font-size: 0.75rem;
  color: var(--wb-muted);
  transition:
    color 0.2s,
    border-color 0.2s,
    background-color 0.2s;
}
.chip-link:hover {
  border-color: var(--wb-accent);
  color: var(--wb-accent);
  background: var(--wb-accent-subtle);
}
.chip-link--on,
.chip-link--on:hover {
  border: 1.5px solid var(--wb-outline);
  background: var(--wb-accent-fill);
  color: var(--wb-accent-fg);
  font-weight: 700;
}

.no-scrollbar {
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
