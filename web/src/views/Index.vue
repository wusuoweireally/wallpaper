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

    <main class="relative mx-auto max-w-7xl space-y-24 px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <!-- Hero -->
      <section
        class="grid items-center gap-12 rounded-[2.5rem] bg-gradient-to-br from-white/90 via-white/80 to-white/60 p-10 shadow-2xl ring-1 ring-black/5 lg:grid-cols-[1.1fr_0.9fr] dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-900/60 dark:ring-white/10"
      >
        <div class="space-y-8">
          <span
            class="inline-flex items-center gap-2 rounded-full bg-sky-100/80 px-4 py-1.5 text-sm font-medium text-sky-700 ring-1 ring-sky-200/70 dark:bg-sky-900/40 dark:text-sky-100 dark:ring-sky-800"
          >
            <span class="text-base">✨</span>
            精准推荐 · 沉浸体验
          </span>
          <div class="space-y-4">
            <h1 class="text-4xl font-bold text-slate-900 sm:text-5xl dark:text-slate-100">
              探索<span
                class="bg-gradient-to-r from-purple-600 to-sky-500 bg-clip-text text-transparent"
                >随心灵感</span
              >， 开启专属壁纸旅程
            </h1>
            <p class="text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              精心策划的视觉灵感库，覆盖极简、自然、赛博、CG 等 40+ 风格。AI 智能推荐、4K
              超清资源与社区共创让你的桌面始终保持新鲜感。
            </p>
          </div>
          <div class="flex flex-wrap gap-4">
            <router-link
              to="/wallpapers"
              class="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-500 to-sky-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:scale-[1.02]"
            >
              浏览热门壁纸
              <span aria-hidden="true">→</span>
            </router-link>
            <router-link
              to="/upload"
              class="inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 px-8 py-3 text-base font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              分享你的作品
            </router-link>
          </div>
        </div>
        <div class="relative">
          <div
            class="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-sky-100/80 to-transparent blur-3xl"
          ></div>
          <div
            class="relative grid gap-4 rounded-[2rem] bg-white/95 p-6 text-slate-900 shadow-2xl ring-1 ring-slate-100 dark:bg-slate-900/90 dark:text-slate-100 dark:ring-slate-800"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">极光梦境</p>
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <article
                v-for="collection in heroCollections"
                :key="collection.title"
                class="group overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div class="relative h-36 w-full overflow-hidden">
                  <img
                    :src="collection.image"
                    :alt="collection.title"
                    class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70"></div>
                  <div class="absolute bottom-3 left-3">
                    <p class="text-sm text-white/80">{{ collection.mood }}</p>
                    <p class="text-lg font-semibold text-white">
                      {{ collection.title }}
                    </p>
                  </div>
                </div>
              </article>
            </div>
            <div class="flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span
                v-for="tag in ['4K', '色彩分层', '限定系列', '桌面套装']"
                :key="tag"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Popular Wallpapers -->
      <section
        class="rounded-[2.25rem] bg-white/85 p-8 shadow-2xl ring-1 ring-black/5 dark:bg-slate-900/80 dark:ring-white/10"
      >
        <div class="flex flex-wrap items-center justify-between gap-4 pb-6">
          <div>
            <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">当季精选</p>
            <h2 class="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              实时更新的热门壁纸
            </h2>
          </div>
          <div class="flex gap-3">
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

      <!-- CTA -->
      <section
        class="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-gradient-to-r from-sky-100 via-white to-purple-50 p-10 text-slate-900 shadow-2xl shadow-slate-200/60 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:text-slate-100 dark:shadow-black/40"
      >
        <div class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-6">
            <p
              class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Join the drop
            </p>
            <h2 class="text-3xl font-semibold leading-snug text-slate-900 dark:text-slate-100">
              立即加入随心壁纸，把灵感带到每一块屏幕
            </h2>
            <p class="text-base text-slate-600 dark:text-slate-300">
              上传原创作品，关注喜欢的创作者，收藏可跨设备同步的壁纸组合。通过 Pro
              计划获得更自由的创作空间与 8K 高清上传额度。
            </p>
            <div class="flex flex-wrap gap-4">
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
            class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-inner shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-black/30"
          >
            <p class="text-sm font-semibold text-slate-600 dark:text-slate-300">
              最新创作计划 · 4 月
            </p>
            <ul class="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-base text-slate-700 dark:bg-white/10 dark:text-slate-100"
                  >1</span
                >
                主题限定系列：春日情绪板
              </li>
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-base text-slate-700 dark:bg-white/10 dark:text-slate-100"
                  >2</span
                >
                上传 5+ 作品可获得首页推荐资格
              </li>
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-base text-slate-700 dark:bg-white/10 dark:text-slate-100"
                  >3</span
                >
                Pro 会员享 8K &amp; PSD 原始文件同步
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
        <p>© {{ currentYear }} 随心壁纸 · 保持桌面纯粹且充满灵感</p>
        <div class="flex gap-6 text-sm">
          <router-link to="/forums" class="transition hover:text-slate-900 dark:hover:text-white">
            社区守则
          </router-link>
          <router-link
            to="/wallpapers"
            class="transition hover:text-slate-900 dark:hover:text-white"
          >
            浏览合集
          </router-link>
          <router-link to="/upload" class="transition hover:text-slate-900 dark:hover:text-white">
            提交作品
          </router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import WallpaperShowcase from "@/components/WallpaperShowcase.vue"

const heroCollections = [
  {
    title: "赛博霓虹",
    mood: "夜幕氛围",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "晨雾森林",
    mood: "自然沉浸",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
  },
]

const quickFilters = [
  { label: "4K 高清", to: { path: "/wallpapers", query: { resolution: "4k" } } },
  { label: "最新发布", to: { path: "/wallpapers", query: { sort: "latest" } } },
  { label: "编辑推荐", to: { path: "/wallpapers", query: { sort: "popular" } } },
]

const currentYear = new Date().getFullYear()
</script>
