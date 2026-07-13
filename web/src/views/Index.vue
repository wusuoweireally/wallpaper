<template>
  <div
    class="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100"
  >
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute left-1/2 top-[-15%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-purple-200/50 blur-[200px] dark:bg-purple-900/30"
      ></div>
      <div
        class="absolute left-[10%] top-1/2 h-[22rem] w-[22rem] -translate-y-1/2 rounded-full bg-sky-200/40 blur-[220px] dark:bg-sky-900/30"
      ></div>
      <div
        class="absolute bottom-[-10%] right-[-5%] h-[28rem] w-[28rem] rounded-full bg-pink-100/60 blur-[200px] dark:bg-fuchsia-900/30"
      ></div>
    </div>

    <main class="relative mx-auto max-w-7xl space-y-16 px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <!-- Hero -->
      <section
        class="grid items-center gap-10 rounded-[2.5rem] bg-gradient-to-br from-white/90 via-white/80 to-white/60 p-8 shadow-2xl ring-1 ring-black/5 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-900/60 dark:ring-white/10"
      >
        <div class="space-y-7">
          <span
            class="inline-flex items-center gap-2 rounded-full bg-sky-100/80 px-4 py-1.5 text-sm font-medium text-sky-700 ring-1 ring-sky-200/70 dark:bg-sky-900/40 dark:text-sky-100 dark:ring-sky-800"
          >
            社区壁纸 · 真实内容
          </span>
          <div class="space-y-4">
            <h1 class="text-4xl font-bold text-slate-900 sm:text-5xl dark:text-slate-100">
              发现
              <span
                class="bg-gradient-to-r from-purple-600 to-sky-500 bg-clip-text text-transparent"
                >随心壁纸</span
              >
            </h1>
            <p class="text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              浏览、收藏、上传社区壁纸。支持综合 / 动漫 / 人物分类与标签筛选，数据全部来自本站真实内容。
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <router-link
              to="/wallpapers?sort=popular"
              class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-500 to-sky-500 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:scale-[1.02]"
            >
              浏览热门壁纸
              <span aria-hidden="true">→</span>
            </router-link>
            <router-link
              to="/upload"
              class="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 px-7 py-3 text-base font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              上传作品
            </router-link>
          </div>
        </div>

        <!-- Hero 预览：真实热门壁纸 -->
        <div class="relative">
          <div
            class="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-sky-100/80 to-transparent blur-3xl dark:from-sky-900/40"
          ></div>
          <div
            class="relative space-y-4 rounded-[2rem] bg-white/95 p-5 shadow-2xl ring-1 ring-slate-100 dark:bg-slate-900/90 dark:ring-slate-800"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-base font-semibold text-slate-900 dark:text-slate-100">热门预览</p>
              <router-link
                to="/wallpapers?sort=popular"
                class="text-xs font-medium text-primary hover:underline"
              >
                查看全部
              </router-link>
            </div>

            <div v-if="heroLoading" class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="n in 2"
                :key="n"
                class="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
              ></div>
            </div>

            <div
              v-else-if="heroWallpapers.length"
              class="grid gap-3 sm:grid-cols-2"
            >
              <router-link
                v-for="wp in heroWallpapers"
                :key="wp.id"
                :to="`/wallpaper/${wp.id}`"
                class="group overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div class="relative h-36 w-full overflow-hidden">
                  <img
                    :src="`${wp.thumbnailUrl || wp.fileUrl}?t=${wp.updatedAt || wp.id}`"
                    :alt="`壁纸 ${wp.id}`"
                    class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                  <div class="absolute bottom-2.5 left-2.5 right-2.5">
                    <p class="truncate text-xs text-white/80">
                      {{ wp.uploader?.username || "创作者" }}
                    </p>
                    <p class="text-sm font-semibold text-white">
                      {{ wp.width }}×{{ wp.height }} · ♥ {{ wp.likeCount || 0 }}
                    </p>
                  </div>
                </div>
              </router-link>
            </div>

            <div
              v-else
              class="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-700"
            >
              暂无壁纸，去上传第一张吧
            </div>

            <div v-if="heroTagNames.length" class="flex flex-wrap gap-2">
              <router-link
                v-for="tag in heroTagNames"
                :key="tag.id"
                :to="`/tag/${tag.id}`"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                #{{ tag.name }}
              </router-link>
            </div>
          </div>
        </div>
      </section>

      <!-- 真实分类入口（系统分类，非假热度） -->
      <section
        class="rounded-[2.25rem] bg-white/85 p-6 shadow-2xl ring-1 ring-black/5 sm:p-8 dark:bg-slate-900/80 dark:ring-white/10"
      >
        <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">浏览分类</p>
            <h2 class="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              按类型筛选
            </h2>
          </div>
          <router-link
            to="/wallpapers"
            class="text-sm font-medium text-primary hover:underline"
          >
            全部壁纸
          </router-link>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <router-link
            v-for="cat in realCategories"
            :key="cat.value"
            :to="{ path: '/wallpapers', query: { category: cat.value } }"
            :class="`bg-gradient-to-r ${cat.color}`"
            class="flex items-center justify-between rounded-2xl px-5 py-5 text-white shadow-md transition hover:scale-[1.02] hover:shadow-lg"
          >
            <span class="text-base font-semibold">{{ cat.emoji }} {{ cat.label }}</span>
            <span class="text-sm opacity-90">查看 →</span>
          </router-link>
        </div>
      </section>

      <!-- 热门标签：usageCount 真实排序 -->
      <section
        class="rounded-[2.25rem] bg-white/85 p-6 shadow-2xl ring-1 ring-black/5 sm:p-8 dark:bg-slate-900/80 dark:ring-white/10"
      >
        <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">按使用量排序</p>
            <h2 class="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              热门标签
            </h2>
          </div>
          <router-link to="/tags" class="text-sm font-medium text-primary hover:underline">
            全部标签
          </router-link>
        </div>

        <div v-if="tagsLoading" class="flex flex-wrap gap-2">
          <div
            v-for="n in 8"
            :key="n"
            class="h-10 w-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
          ></div>
        </div>

        <div v-else-if="popularTags.length" class="flex flex-wrap gap-2.5">
          <router-link
            v-for="(tag, index) in popularTags"
            :key="tag.id"
            :to="`/tag/${tag.id}`"
            :class="tagColor(index)"
            class="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-105 hover:shadow-lg"
          >
            <span>#{{ tag.name }}</span>
            <span class="rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
              {{ tag.usageCount }}
            </span>
          </router-link>
        </div>

        <p v-else class="py-6 text-center text-sm text-slate-400">
          暂无标签数据
        </p>
      </section>

      <!-- 热门壁纸（组件内已调真实 API） -->
      <section
        class="rounded-[2.25rem] bg-white/85 p-6 shadow-2xl ring-1 ring-black/5 sm:p-8 dark:bg-slate-900/80 dark:ring-white/10"
      >
        <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">实时数据</p>
            <h2 class="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              热门壁纸
            </h2>
          </div>
          <div class="flex flex-wrap gap-2">
            <router-link
              v-for="filter in quickFilters"
              :key="filter.label"
              :to="filter.to"
              class="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
            >
              {{ filter.label }}
            </router-link>
          </div>
        </div>
        <WallpaperShowcase />
      </section>

      <!-- CTA：真实产品能力 -->
      <section
        class="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-gradient-to-r from-sky-100 via-white to-purple-50 p-8 text-slate-900 shadow-2xl shadow-slate-200/60 sm:p-10 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:text-slate-100 dark:shadow-black/40"
      >
        <div class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-6">
            <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">加入社区</p>
            <h2 class="text-3xl font-semibold leading-snug text-slate-900 dark:text-slate-100">
              上传你的壁纸，让更多人看到
            </h2>
            <p class="text-base text-slate-600 dark:text-slate-300">
              注册后即可上传、点赞、收藏与评论。内容来自社区创作者，持续更新。
            </p>
            <div class="flex flex-wrap gap-3">
              <router-link
                to="/auth/register"
                class="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3 text-base font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                免费注册
              </router-link>
              <router-link
                to="/upload"
                class="inline-flex items-center gap-2 rounded-full border border-slate-300 px-8 py-3 text-base font-semibold text-slate-800 transition hover:bg-white dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                发布壁纸
              </router-link>
            </div>
          </div>
          <div
            class="rounded-3xl border border-slate-200 bg-white/80 p-6 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70"
          >
            <p class="text-sm font-semibold text-slate-600 dark:text-slate-300">你可以这样开始</p>
            <ul class="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                  >1</span
                >
                注册并登录账号
              </li>
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                  >2</span
                >
                上传壁纸并添加分类、标签
              </li>
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                  >3</span
                >
                在列表页筛选、收藏喜欢的作品
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>

    <footer
      class="relative border-t border-slate-200 bg-white py-10 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
    >
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <p>© {{ currentYear }} 随心壁纸</p>
        <div class="flex gap-6 text-sm">
          <router-link to="/forums" class="transition hover:text-slate-900 dark:hover:text-white">
            社区
          </router-link>
          <router-link
            to="/wallpapers"
            class="transition hover:text-slate-900 dark:hover:text-white"
          >
            壁纸
          </router-link>
          <router-link to="/upload" class="transition hover:text-slate-900 dark:hover:text-white">
            上传
          </router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue"
import WallpaperShowcase from "@/components/WallpaperShowcase.vue"
import tagService, { type Tag } from "@/services/tag"
import wallpaperService, { type Wallpaper } from "@/services/wallpaper"

/** 系统真实分类（筛选参数），不是伪造热度 */
const realCategories = [
  { value: "general", label: "综合", emoji: "▦", color: "from-emerald-500 to-teal-600" },
  { value: "anime", label: "动漫", emoji: "✦", color: "from-violet-500 to-purple-600" },
  { value: "people", label: "人物", emoji: "◎", color: "from-sky-500 to-blue-600" },
] as const

/** 真实列表筛选入口 */
const quickFilters = [
  { label: "4K 高清", to: { path: "/wallpapers", query: { resolution: "4k" } } },
  { label: "最新发布", to: { path: "/wallpapers", query: { sort: "latest" } } },
  { label: "综合热门", to: { path: "/wallpapers", query: { sort: "popular" } } },
]

const TAG_COLORS = [
  "bg-gradient-to-r from-emerald-500 to-teal-600",
  "bg-gradient-to-r from-blue-500 to-indigo-600",
  "bg-gradient-to-r from-purple-500 to-pink-600",
  "bg-gradient-to-r from-slate-500 to-slate-700",
  "bg-gradient-to-r from-slate-700 to-gray-900",
  "bg-gradient-to-r from-cyan-500 to-violet-600",
  "bg-gradient-to-r from-pink-400 to-rose-500",
  "bg-gradient-to-r from-orange-500 to-red-600",
]

const tagColor = (index: number) => TAG_COLORS[index % TAG_COLORS.length]

const currentYear = new Date().getFullYear()

const heroLoading = ref(true)
const heroWallpapers = ref<Wallpaper[]>([])
const tagsLoading = ref(true)
const popularTags = ref<Tag[]>([])

const heroTagNames = computed(() => {
  const map = new Map<number, Tag>()
  for (const wp of heroWallpapers.value) {
    for (const t of wp.tags || []) {
      if (t?.id && !map.has(t.id)) {
        map.set(t.id, t as Tag)
      }
    }
  }
  return [...map.values()].slice(0, 6)
})

const loadHero = async () => {
  heroLoading.value = true
  try {
    const res = await wallpaperService.getPopularWallpapers(2)
    heroWallpapers.value = res.data || []
  } catch (e) {
    console.error("加载首页热门预览失败:", e)
    heroWallpapers.value = []
  } finally {
    heroLoading.value = false
  }
}

const loadPopularTags = async () => {
  tagsLoading.value = true
  try {
    const res = await tagService.getTags({
      sortBy: "usageCount",
      sortOrder: "DESC",
      page: 1,
      limit: 12,
    })
    popularTags.value = res.data || []
  } catch (e) {
    console.error("加载热门标签失败:", e)
    popularTags.value = []
  } finally {
    tagsLoading.value = false
  }
}

onMounted(() => {
  loadHero()
  loadPopularTags()
})
</script>
