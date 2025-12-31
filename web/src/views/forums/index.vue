<template>
  <div class="relative min-h-screen bg-[#f5f6fa]">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#dceafe] blur-3xl opacity-60"></div>
      <div class="absolute right-[-80px] top-24 h-80 w-80 rounded-full bg-[#fde2c5] blur-3xl opacity-70"></div>
      <div class="absolute left-1/3 top-52 h-56 w-56 rounded-full bg-[#e8e7ff] blur-3xl opacity-60"></div>
    </div>

    <section class="relative mx-auto w-full max-w-6xl px-4 py-12 space-y-8">
      <div class="overflow-hidden rounded-[36px] border border-white/70 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-slate-50 shadow-2xl relative">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent"></div>
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent"></div>
        <div class="relative grid gap-8 p-8 lg:grid-cols-[1.6fr_1fr] lg:p-10">
          <div class="space-y-5">
            <div class="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur">
              <i class="i-mdi-star-four-points text-amber-400"></i>
              <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-200">Wallpaper Forum</p>
            </div>
            <h1 class="text-4xl font-bold leading-tight lg:text-5xl">
              <span class="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                创意灵感集散地
              </span>
            </h1>
            <p class="max-w-3xl text-base text-slate-300/90 leading-relaxed">
              汇聚壁纸创作的灵感火花，分享设计技巧与创作经验，每一篇帖子都是可复用的创意资产。
            </p>
            <div class="flex flex-wrap gap-2.5">
              <span class="rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 px-4 py-1.5 text-sm text-blue-200 border border-blue-400/30 backdrop-blur hover:from-blue-500/30 hover:to-indigo-500/30 transition-all">💡 技术讨论</span>
              <span class="rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-1.5 text-sm text-purple-200 border border-purple-400/30 backdrop-blur hover:from-purple-500/30 hover:to-pink-500/30 transition-all">✨ 经验分享</span>
              <span class="rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-1.5 text-sm text-amber-200 border border-amber-400/30 backdrop-blur hover:from-amber-500/30 hover:to-orange-500/30 transition-all">❓ 问答求助</span>
              <span class="rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-1.5 text-sm text-emerald-200 border border-emerald-400/30 backdrop-blur hover:from-emerald-500/30 hover:to-teal-500/30 transition-all">🎁 资源分享</span>
            </div>
            <div class="grid gap-3 sm:grid-cols-3">
              <div
                v-for="stat in heroStats"
                :key="stat.label"
                class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 backdrop-blur transition-all hover:bg-white/[0.12] hover:border-white/20"
              >
                <div class="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p class="text-xs uppercase tracking-[0.2em] text-slate-300/80">{{ stat.label }}</p>
                <p class="mt-2 flex items-center gap-2 text-3xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  <i :class="stat.icon" class="text-2xl text-white/90"></i>
                  {{ stat.value }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex flex-col justify-between gap-5 rounded-[30px] border border-white/20 bg-white/[0.08] p-7 backdrop-blur-lg shadow-xl">
            <div class="space-y-4">
              <div class="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1">
                <i class="i-mdi-lightbulb-on text-emerald-400"></i>
                <p class="text-xs font-medium text-emerald-200">创作小贴士</p>
              </div>
              <p class="text-sm text-slate-200/90">把今天的灵感发出来，或先存成草稿，晚点再打磨。</p>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="group rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition-all hover:bg-white/[0.1] hover:border-white/20">
                  <div class="flex items-center gap-2 text-emerald-400 mb-2">
                    <i class="i-mdi-chart-line text-lg"></i>
                    <p class="text-[11px] uppercase tracking-[0.15em] text-emerald-300">活跃</p>
                  </div>
                  <p class="text-2xl font-bold text-white">{{ formatNumber(forumStore.postsPagination.totalCount || 0) }}</p>
                  <p class="text-xs text-slate-300/80 mt-1">帖子累积</p>
                </div>
                <div class="group rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition-all hover:bg-white/[0.1] hover:border-white/20">
                  <div class="flex items-center gap-2 text-amber-400 mb-2">
                    <i class="i-mdi-heart-hands text-lg"></i>
                    <p class="text-[11px] uppercase tracking-[0.15em] text-amber-300">互动</p>
                  </div>
                  <p class="text-2xl font-bold text-white">
                    {{
                      formatNumber(
                        forumStore.posts.reduce(
                          (sum, item) => sum + (item.likeCount || 0) + (item.commentCount || 0),
                          0,
                        ),
                      )
                    }}
                  </p>
                  <p class="text-xs text-slate-300/80 mt-1">点赞与评论</p>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-3">
              <button
                class="group relative btn btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-none shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105 overflow-hidden"
                @click="handleCreatePost"
              >
                <span class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                <i class="i-mdi-plus relative z-10"></i>
                <span class="relative z-10">立即发帖</span>
              </button>
              <button
                class="btn btn-outline border-white/30 text-white hover:border-white/50 hover:bg-white/10 backdrop-blur transition-all"
                @click="handleScrollToContent"
              >
                <i class="i-mdi-compass-outline"></i>
                浏览讨论
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div class="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
          <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div class="space-y-1">
              <div class="inline-flex items-center gap-2">
                <i class="i-mdi-post-outline text-2xl text-slate-700"></i>
                <h2 class="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">讨论区</h2>
              </div>
              <p class="text-sm text-slate-500 ml-10">按分类、热度或时间筛选你感兴趣的主题</p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label class="input input-sm flex w-full items-center gap-2 border border-slate-200 bg-white shadow-sm sm:w-64 hover:border-slate-300 transition-colors focus-within:border-slate-900">
                <i class="i-mdi-magnify text-slate-400"></i>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜索帖子或关键词..."
                  class="grow bg-transparent outline-none text-sm"
                  @input="handleSearch"
                />
              </label>
              <div class="flex gap-2">
                <select
                  v-model="forumStore.filters.sortBy"
                  class="select select-sm border border-slate-200 bg-white text-sm shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
                  @change="handleSortChange"
                >
                  <option value="createdAt">🕒 最新</option>
                  <option value="viewCount">🔥 最热</option>
                  <option value="likeCount">❤️ 点赞</option>
                  <option value="commentCount">💬 评论</option>
                </select>
                <button class="group btn btn-sm btn-primary gap-1 shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105" @click="handleCreatePost">
                  <i class="i-mdi-plus text-base group-hover:rotate-90 transition-transform duration-300"></i>
                  <span>发帖</span>
                </button>
              </div>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2.5">
            <button
              class="rounded-full px-4 py-1.5 text-sm font-medium transition-all border"
              :class="forumStore.filters.category === ''
                ? 'border-slate-900 text-white bg-gradient-to-r from-slate-900 to-slate-700 shadow-md shadow-slate-500/30'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100'"
              @click="handleCategoryChange('')"
            >
              🌟 全部
            </button>
            <button
              v-for="category in forumStore.postCategories"
              :key="category.value"
              class="rounded-full px-4 py-1.5 text-sm font-medium transition-all border"
              :class="{
                'border-slate-900 text-white bg-gradient-to-r from-slate-900 to-slate-700 shadow-md shadow-slate-500/30': forumStore.filters.category === category.value,
                'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100': forumStore.filters.category !== category.value,
              }"
              @click="handleCategoryChange(category.value)"
            >
              {{ category.emoji || '📝' }} {{ category.label }}
            </button>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-6 shadow-lg shadow-slate-200/30 backdrop-blur-sm">
          <div class="mb-4 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <div class="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-2 shadow-md shadow-amber-500/30">
                <i class="i-mdi-lightbulb-on text-white text-lg"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900">创作小贴士</h3>
                <p class="text-xs text-slate-500">让内容更易读、更有价值</p>
              </div>
            </div>
            <span class="badge badge-outline border-amber-300 text-amber-700 bg-amber-50 badge-sm font-medium">每日创作</span>
          </div>
          <ul class="space-y-3 text-sm">
            <li class="flex items-start gap-3 p-2 rounded-lg hover:bg-white/60 transition-colors">
              <span class="text-lg">💡</span>
              <span class="text-slate-700">先写结论，再补充思路/步骤</span>
            </li>
            <li class="flex items-start gap-3 p-2 rounded-lg hover:bg-white/60 transition-colors">
              <span class="text-lg">🖼️</span>
              <span class="text-slate-700">图片与代码并列展示，方便复现</span>
            </li>
            <li class="flex items-start gap-3 p-2 rounded-lg hover:bg-white/60 transition-colors">
              <span class="text-lg">📝</span>
              <span class="text-slate-700">想保密可先存草稿，之后再完善</span>
            </li>
          </ul>
          <div class="mt-5 grid gap-2.5 sm:grid-cols-2">
            <button class="group btn btn-primary btn-sm w-full shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105" @click="handleCreatePost">
              <i class="i-mdi-pencil"></i>
              开始创作
            </button>
            <button class="btn btn-outline btn-sm w-full hover:bg-slate-100 transition-colors" @click="forumStore.resetFilters()">
              <i class="i-mdi-refresh"></i>
              清空筛选
            </button>
          </div>
        </div>
      </div>

      <div
        id="forum-content"
        class="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[3fr_1.05fr]"
      >
        <section class="space-y-4">
          <div
            v-if="forumStore.loading"
            class="flex min-h-[40vh] items-center justify-center rounded-3xl border border-slate-200/70 bg-white/90 shadow"
          >
            <div class="flex flex-col items-center gap-3 text-slate-500">
              <span class="loading loading-lg loading-spinner text-primary"></span>
              <p class="text-sm">正在加载讨论...</p>
            </div>
          </div>
          <div
            v-else-if="forumStore.error"
            class="rounded-3xl border border-error/30 bg-error/5 p-6 text-error shadow"
          >
            <div class="flex flex-wrap items-center gap-3">
              <i class="i-mdi-alert-circle text-2xl"></i>
              <span class="text-sm">{{ forumStore.error }}</span>
              <button class="btn btn-sm btn-outline" @click="fetchPosts">重试</button>
            </div>
          </div>
          <div v-else class="space-y-4">
            <PostCard
              v-for="post in forumStore.filteredPosts"
              :key="post.id"
              :post="post"
              @like="handleLike"
              @comment="handleComment"
              @edit="handleEdit"
              @delete="handleDelete"
              @share="handleShare"
            />
            <div
              v-if="forumStore.filteredPosts.length === 0"
              class="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center shadow-sm"
            >
              <i
                class="i-mdi-forum-outline mb-4 text-6xl text-slate-300"
              ></i>
              <p class="text-lg text-slate-800 font-semibold">
                {{
                  forumStore.filters.search
                    ? "没有找到相关帖子"
                    : "暂时还没有帖子，来分享第一个吧！"
                }}
              </p>
              <p class="mt-1 text-sm text-slate-500">
                你可以尝试调整分类/排序，或者直接发布一个新的讨论。
              </p>
              <div class="mt-5 flex flex-wrap justify-center gap-3">
                <button class="btn btn-primary" @click="handleCreatePost">
                  发布帖子
                </button>
                <button
                  class="btn btn-outline"
                  v-if="forumStore.filters.search"
                  @click="forumStore.resetFilters()"
                >
                  清除筛选
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="
              forumStore.filteredPosts.length > 0 &&
              forumStore.postsPagination.totalPages > 1
            "
            class="flex justify-center"
          >
            <div class="join">
              <button
                class="btn join-item btn-sm"
                :disabled="forumStore.postsPagination.currentPage === 1"
                @click="goToPage(forumStore.postsPagination.currentPage - 1)"
              >
                «
              </button>
              <button
                v-for="(page, index) in visiblePages"
                :key="
                  typeof page === 'number' ? `page-${page}` : `ellipsis-${index}`
                "
                class="btn join-item btn-sm"
                :class="{
                  'btn-active': page === forumStore.postsPagination.currentPage,
                  'btn-disabled': typeof page === 'string',
                }"
                @click="typeof page === 'number' ? goToPage(page) : undefined"
              >
                {{ page }}
              </button>
              <button
                class="btn join-item btn-sm"
                :disabled="
                  forumStore.postsPagination.currentPage ===
                  forumStore.postsPagination.totalPages
                "
                @click="goToPage(forumStore.postsPagination.currentPage + 1)"
              >
                »
              </button>
            </div>
          </div>
        </section>

        <aside class="space-y-5">
          <div class="rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/90 p-6 shadow-lg shadow-slate-200/30 backdrop-blur-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div class="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div class="relative">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-2.5 shadow-lg shadow-amber-500/30">
                    <i class="i-mdi-fire text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-slate-900">热门帖子</h3>
                    <p class="text-xs text-slate-500">本周最受关注</p>
                  </div>
                </div>
                <span class="badge badge-sm font-medium bg-amber-100 text-amber-700 border-amber-200">🔥 热门</span>
              </div>
              <ul class="space-y-3">
                <li
                  v-for="(post, index) in forumStore.popularPosts"
                  :key="`popular-${post.id}`"
                  class="group cursor-pointer rounded-2xl border border-slate-200/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-slate-900/40 hover:shadow-lg hover:shadow-slate-300/20 bg-white/60 hover:bg-white"
                  @click="$router.push(`/forums/post/${post.id}`)"
                >
                  <div class="flex items-start gap-4">
                    <div class="relative">
                      <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-bold text-white shadow-lg">
                        {{ index + 1 }}
                      </span>
                      <span v-if="index < 3" class="absolute -right-1 -top-1 text-xs">🏆</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-slate-800 group-hover:text-slate-900 line-clamp-2 transition-colors mb-2">
                        {{ post.title }}
                      </p>
                      <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div class="flex items-center gap-1.5 bg-slate-100 rounded-full px-2 py-0.5">
                          <i class="i-mdi-eye text-xs"></i>
                          <span>{{ formatNumber(post.viewCount) }}</span>
                        </div>
                        <div class="flex items-center gap-1.5 bg-rose-100 rounded-full px-2 py-0.5">
                          <i class="i-mdi-heart text-xs"></i>
                          <span>{{ formatNumber(post.likeCount) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div class="rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-6 shadow-lg shadow-slate-200/30 backdrop-blur-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div class="relative">
              <div class="flex items-start justify-between gap-3 mb-4">
                <div class="flex-1">
                  <h3 class="text-base font-bold text-slate-900 mb-1">🚀 快速发布</h3>
                  <p class="text-sm text-slate-600">
                    有灵感就写下标题，先存草稿，或直接发布。可随时编辑完善。
                  </p>
                </div>
                <div class="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/30">
                  <i class="i-mdi-lightning-bolt text-white text-xl"></i>
                </div>
              </div>
              <div class="space-y-2.5">
                <button class="group btn btn-primary btn-sm w-full shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105" @click="handleCreatePost">
                  <i class="i-mdi-pencil"></i>
                  去创作
                </button>
                <button class="btn btn-ghost btn-sm w-full hover:bg-white/60 transition-colors" @click="forumStore.resetFilters()">
                  <i class="i-mdi-refresh"></i>
                  重置筛选
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useForumStore } from "@/stores/forum";
import { useUserStore } from "@/stores";
import { forumService } from "@/services/forum";
import PostCard from "@/components/PostCard.vue";
import type { Post } from "@/stores/forum";

defineOptions({ name: "ForumIndex" });

const router = useRouter();
const forumStore = useForumStore();
const userStore = useUserStore();

const searchQuery = ref("");
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

function formatNumber(num: number) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "w";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

const heroStats = computed(() => [
  {
    label: "帖子",
    value: formatNumber(forumStore.postsPagination.totalCount || 0),
    icon: "i-mdi-forum-outline",
  },
  {
    label: "热度",
    value: formatNumber(
      forumStore.popularPosts
        .slice(0, 5)
        .reduce((sum, item) => sum + (item.viewCount || 0), 0),
    ),
    icon: "i-mdi-fire",
  },
  {
    label: "互动",
    value: formatNumber(
      forumStore.posts.reduce(
        (sum, item) => sum + (item.likeCount || 0) + (item.commentCount || 0),
        0,
      ),
    ),
    icon: "i-mdi-hand-heart",
  },
]);

const visiblePages = computed(() => {
  const current = forumStore.postsPagination.currentPage;
  const total = forumStore.postsPagination.totalPages;
  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];
  let l: number | undefined;

  for (let i = 1; i <= total; i += 1) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }

  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  });

  return rangeWithDots;
});

const fetchPosts = async (reset = false) => {
  if (reset) {
    forumStore.setPostsPagination({ currentPage: 1 });
  }

  try {
    forumStore.setLoading(true);
    forumStore.setError(null);

    const { data, pagination } = await forumService.getPosts({
      page: forumStore.postsPagination.currentPage,
      limit: forumStore.postsPagination.pageSize,
      sortBy: forumStore.filters.sortBy,
      sortOrder: forumStore.filters.sortOrder as "ASC" | "DESC",
      category: forumStore.filters.category || undefined,
      search: forumStore.filters.search || undefined,
    });

    forumStore.setPosts(data);
    forumStore.setPostsPagination({
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      totalCount: pagination.totalCount,
    });
  } catch (error) {
    console.error("获取帖子失败:", error);
    forumStore.setError("获取帖子失败，请稍后重试");
  } finally {
    forumStore.setLoading(false);
  }
};

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    forumStore.updateFilters({ search: searchQuery.value });
    fetchPosts(true);
  }, 500);
};

const handleCategoryChange = (category: string) => {
  const newCategory = forumStore.filters.category === category ? "" : category;
  forumStore.updateFilters({ category: (newCategory as any) || "" });
  fetchPosts(true);
};

const handleSortChange = () => {
  fetchPosts(true);
};

const handleScrollToContent = () => {
  const el = document.getElementById("forum-content");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= forumStore.postsPagination.totalPages) {
    forumStore.setPostsPagination({ currentPage: page });
    fetchPosts();
  }
};

const handleCreatePost = () => {
  if (!userStore.isLoggedIn) {
    router.push("/auth/login");
    return;
  }
  router.push("/forums/new");
};

const handleLike = async (post: Post) => {
  if (!userStore.isLoggedIn) {
    router.push("/auth/login");
    return;
  }
  try {
    const hasLiked = post.isLiked;
    if (hasLiked) {
      await forumService.unlikePost(post.id);
      forumStore.togglePostLike(post.id, false);
    } else {
      await forumService.likePost(post.id);
      forumStore.togglePostLike(post.id, true);
    }
  } catch (error) {
    console.error("点赞操作失败:", error);
  }
};

const handleComment = (post: Post) => {
  router.push(`/forums/post/${post.id}#comments`);
};

const handleEdit = (post: Post) => {
  router.push(`/forums/edit/${post.id}`);
};

const handleDelete = async (post: Post) => {
  try {
    await forumService.deletePost(post.id);
    forumStore.setPosts(forumStore.posts.filter((p) => p.id !== post.id));
  } catch (error) {
    console.error("删除帖子失败:", error);
  }
};

const handleShare = (post: Post) => {
  const shareUrl = `${window.location.origin}/forums/post/${post.id}`;
  if (navigator.share) {
    navigator.share({
      title: post.title,
      text: post.summary || post.title,
      url: shareUrl,
    });
  } else {
    navigator.clipboard.writeText(shareUrl);
    alert("链接已复制到剪贴板");
  }
};

onMounted(() => {
  const route = router.currentRoute.value;
  if (route.query.category) {
    forumStore.updateFilters({ category: route.query.category as string });
  }
  if (route.query.search) {
    searchQuery.value = route.query.search as string;
    forumStore.updateFilters({ search: route.query.search as string });
  }
  fetchPosts();
});

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
    searchTimeout.value = null;
  }
});

watch(
  () => router.currentRoute.value.query,
  (newQuery) => {
    if (newQuery.category !== forumStore.filters.category) {
      forumStore.updateFilters({
        category: (newQuery.category as string) || "",
      });
      fetchPosts(true);
    }
    if (newQuery.search !== forumStore.filters.search) {
      searchQuery.value = (newQuery.search as string) || "";
      forumStore.updateFilters({ search: (newQuery.search as string) || "" });
      fetchPosts(true);
    }
  },
);
</script>
