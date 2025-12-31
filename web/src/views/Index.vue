<template>
  <div
    class="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900"
  >
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute left-1/2 top-[-15%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-purple-200/50 blur-[200px]"
      ></div>
      <div
        class="absolute left-[10%] top-1/2 h-[22rem] w-[22rem] -translate-y-1/2 rounded-full bg-sky-200/40 blur-[220px]"
      ></div>
      <div
        class="absolute bottom-[-10%] right-[-5%] h-[28rem] w-[28rem] rounded-full bg-pink-100/60 blur-[200px]"
      ></div>
    </div>

    <main class="relative mx-auto max-w-7xl space-y-24 px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <!-- Hero -->
      <section
        class="grid items-center gap-12 rounded-[2.5rem] bg-gradient-to-br from-white/90 via-white/80 to-white/60 p-10 shadow-2xl ring-1 ring-black/5 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <div class="space-y-8">
          <span
            class="inline-flex items-center gap-2 rounded-full bg-sky-100/80 px-4 py-1.5 text-sm font-medium text-sky-700 ring-1 ring-sky-200/70"
          >
            <span class="text-base">✨</span>
            精准推荐 · 沉浸体验
          </span>
          <div class="space-y-4">
            <h1 class="text-4xl font-bold text-slate-900 sm:text-5xl">
              探索<span
                class="bg-gradient-to-r from-purple-600 to-sky-500 bg-clip-text text-transparent"
                >随心灵感</span
              >， 开启专属壁纸旅程
            </h1>
            <p class="text-lg leading-relaxed text-slate-600">
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
              class="inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 px-8 py-3 text-base font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white"
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
            class="relative grid gap-4 rounded-[2rem] bg-white/95 p-6 text-slate-900 shadow-2xl ring-1 ring-slate-100"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xl font-semibold text-slate-900">极光梦境</p>
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <article
                v-for="collection in heroCollections"
                :key="collection.title"
                class="group overflow-hidden rounded-2xl border border-slate-100 bg-white"
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
            <div class="flex flex-wrap gap-2 text-sm text-slate-600">
              <span
                v-for="tag in ['4K', '色彩分层', '限定系列', '桌面套装']"
                :key="tag"
                class="rounded-full border border-slate-200 bg-white px-3 py-1"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Popular Wallpapers -->
      <section class="rounded-[2.25rem] bg-white/85 p-8 shadow-2xl ring-1 ring-black/5">
        <div class="flex flex-wrap items-center justify-between gap-4 pb-6">
          <div>
            <p class="text-sm font-semibold text-slate-500">当季精选</p>
            <h2 class="mt-1 text-2xl font-semibold text-slate-900">实时更新的热门壁纸</h2>
          </div>
          <div class="flex gap-3">
            <router-link
              v-for="filter in quickFilters"
              :key="filter.label"
              :to="filter.to"
              class="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              {{ filter.label }}
            </router-link>
          </div>
        </div>
        <WallpaperShowcase />
      </section>

      <!-- Feature Highlights -->
      <section class="rounded-[2.5rem] bg-white/90 p-10 shadow-2xl ring-1 ring-black/5">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p class="text-sm font-semibold text-slate-500">平台能力</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900">为灵感而生的功能矩阵</h2>
          </div>
          <router-link
            to="/wallpapers"
            class="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
          >
            查看全部能力 →
          </router-link>
        </div>
        <div class="mt-8 grid gap-6 lg:grid-cols-4">
          <article
            v-for="feature in featureHighlights"
            :key="feature.title"
            class="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50"
          >
            <div class="text-2xl">{{ feature.icon }}</div>
            <h3 class="mt-4 text-lg font-semibold text-slate-900">{{ feature.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ feature.description }}</p>
          </article>
        </div>
      </section>

      <!-- Curated Collections -->
      <section class="rounded-[2.5rem] bg-gradient-to-br from-slate-50 via-white to-sky-50 p-10">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-slate-500">策展专题</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900">每周精选主题合辑</h2>
          </div>
          <router-link
            to="/wallpapers"
            class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            进入策展中心
          </router-link>
        </div>
        <div class="mt-8 grid gap-6 lg:grid-cols-3">
          <article
            v-for="collection in curatedCollections"
            :key="collection.name"
            class="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
          >
            <div class="relative h-44 overflow-hidden">
              <img
                :src="collection.image"
                :alt="collection.name"
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/70"></div>
              <div class="absolute bottom-4 left-4">
                <p class="text-xs uppercase tracking-wide text-white/70">{{ collection.mood }}</p>
                <h3 class="text-lg font-semibold text-white">{{ collection.name }}</h3>
              </div>
              <div
                class="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {{ collection.count }}
              </div>
            </div>
            <div class="space-y-3 p-5">
              <p class="text-sm text-slate-600">{{ collection.description }}</p>
              <div class="flex flex-wrap gap-2 text-xs text-slate-500">
                <span
                  v-for="tag in collection.tags"
                  :key="tag"
                  class="rounded-full border border-slate-200 px-2 py-1"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Community -->
      <section class="rounded-[2.5rem] bg-white/90 p-10 shadow-2xl ring-1 ring-black/5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-slate-500">社区生态</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900">创作者与灵感收藏者的聚集地</h2>
          </div>
          <router-link
            to="/forums"
            class="text-sm font-semibold text-slate-700 transition hover:text-slate-900"
          >
            进入社区 →
          </router-link>
        </div>
        <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div class="grid gap-4 rounded-3xl bg-slate-50 p-6">
            <div
              v-for="stat in communityStats"
              :key="stat.label"
              class="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow"
            >
              <span class="text-sm text-slate-500">{{ stat.label }}</span>
              <span class="text-lg font-semibold text-slate-900">{{ stat.value }}</span>
            </div>
          </div>
          <div class="grid gap-4">
            <article
              v-for="voice in communityVoices"
              :key="voice.name"
              class="flex gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60"
            >
              <img
                :src="voice.avatar"
                :alt="voice.name"
                class="h-14 w-14 rounded-2xl object-cover"
              />
              <div>
                <p class="text-sm font-semibold text-slate-900">{{ voice.name }}</p>
                <p class="text-xs uppercase tracking-wide text-slate-400">{{ voice.role }}</p>
                <p class="mt-3 text-sm leading-relaxed text-slate-600">
                  {{ voice.quote }}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section
        class="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-gradient-to-r from-sky-100 via-white to-purple-50 p-10 text-slate-900 shadow-2xl shadow-slate-200/60"
      >
        <div class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-6">
            <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Join the drop
            </p>
            <h2 class="text-3xl font-semibold leading-snug text-slate-900">
              立即加入随心壁纸，把灵感带到每一块屏幕
            </h2>
            <p class="text-base text-slate-600">
              上传原创作品，关注喜欢的创作者，收藏可跨设备同步的壁纸组合。通过 Pro
              计划获得更自由的创作空间与 8K 高清上传额度。
            </p>
            <div class="flex flex-wrap gap-4">
              <router-link
                to="/auth/register"
                class="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
              >
                免费注册
              </router-link>
              <router-link
                to="/upload"
                class="inline-flex items-center gap-2 rounded-full border border-slate-300 px-8 py-3 text-base font-semibold text-slate-800 transition hover:bg-white"
              >
                发布壁纸
              </router-link>
            </div>
          </div>
          <div
            class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-inner shadow-slate-200/60 backdrop-blur"
          >
            <p class="text-sm font-semibold text-slate-600">最新创作计划 · 4 月</p>
            <ul class="mt-6 space-y-4 text-sm text-slate-600">
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-base text-slate-700"
                  >1</span
                >
                主题限定系列：春日情绪板
              </li>
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-base text-slate-700"
                  >2</span
                >
                上传 5+ 作品可获得首页推荐资格
              </li>
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-base text-slate-700"
                  >3</span
                >
                Pro 会员享 8K &amp; PSD 原始文件同步
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>

    <footer class="relative border-t border-slate-200 bg-white py-10 text-slate-500">
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <p>© {{ currentYear }} 随心壁纸 · 保持桌面纯粹且充满灵感</p>
        <div class="flex gap-6 text-sm">
          <router-link to="/forums" class="transition hover:text-slate-900"> 社区守则 </router-link>
          <router-link to="/wallpapers" class="transition hover:text-slate-900">
            浏览合集
          </router-link>
          <router-link to="/upload" class="transition hover:text-slate-900"> 提交作品 </router-link>
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

const featureHighlights = [
  {
    icon: "🧠",
    title: "AI 灵感引擎",
    description: "根据你的收藏偏好实时推荐主题套装，从此不再审美疲劳。",
  },
  {
    icon: "📱",
    title: "多端同步",
    description: "一键将壁纸同步到桌面、移动端和超宽屏，享受统一的视觉体验。",
  },
  {
    icon: "🎨",
    title: "创作者计划",
    description: "提交原创作品即可获得曝光机会，还有专属的作品数据与反馈。",
  },
  {
    icon: "⚡",
    title: "极速下载",
    description: "全球加速节点保障 4K/8K 壁纸快速下载，支持批量导出与收藏夹。",
  },
]

const curatedCollections = [
  {
    name: "沉静自然",
    mood: "森林 · 风与光",
    description: "以柔和的绿色和雾气为主，适合希望远离喧嚣的你。",
    count: "2.4K",
    tags: ["治愈系", "自然光", "高分辨率"],
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "极简秩序",
    mood: "结构 · 线条",
    description: "保持工作专注力的极简风格，留白与几何元素互相平衡。",
    count: "1.8K",
    tags: ["极简", "灰度", "双屏适配"],
    image:
      "https://images.unsplash.com/photo-1481277542470-605612bd2d61?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "赛博能量",
    mood: "霓虹 · 科技",
    description: "科幻主题与霓虹色的碰撞，适合夜间工作或创意灵感激发。",
    count: "3.1K",
    tags: ["霓虹", "CGI", "暗色调"],
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
  },
]

const communityStats = [
  { label: "周投稿数", value: "2,900+" },
  { label: "精选系列", value: "64 套" },
  { label: "互动反馈", value: "18K+" },
]

const communityVoices = [
  {
    name: "Yuki Lin",
    role: "数字艺术家",
    quote: "我可以直接通过随心壁纸追踪作品热度，也能和收藏者在论坛展开灵感讨论，体验非常完整。",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80",
  },
  {
    name: "Kai Zhou",
    role: "UX 设计师",
    quote:
      "在这里我找到了适配超宽屏的整套桌面主题，更新频率高而且分类特别清晰，极大提升了工作沉浸感。",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80",
  },
]

const quickFilters = [
  { label: "4K 高清", to: { path: "/wallpapers", query: { resolution: "4k" } } },
  { label: "最新发布", to: { path: "/wallpapers", query: { sort: "latest" } } },
  { label: "编辑推荐", to: { path: "/wallpapers", query: { sort: "popular" } } },
]

const currentYear = new Date().getFullYear()
</script>
