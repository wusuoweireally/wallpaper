<template>
  <div class="relative min-h-screen bg-[#f5f6fa] dark:bg-slate-900">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#dceafe] opacity-60 blur-3xl dark:bg-slate-800/40"
      ></div>
      <div
        class="absolute right-[-80px] top-24 h-80 w-80 rounded-full bg-[#fde2c5] opacity-70 blur-3xl dark:bg-slate-800/40"
      ></div>
      <div
        class="absolute left-1/3 top-52 h-56 w-56 rounded-full bg-[#e8e7ff] opacity-60 blur-3xl dark:bg-slate-800/40"
      ></div>
    </div>

    <section class="relative mx-auto w-full max-w-6xl space-y-8 px-4 py-12">
      <div
        class="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 shadow-2xl shadow-slate-200/50 dark:border-white/70 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-50 dark:shadow-slate-900/50"
      >
        <div
          class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent dark:from-blue-600/20"
        ></div>
        <div
          class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent dark:from-amber-500/10"
        ></div>
        <div class="relative grid gap-8 p-8 lg:grid-cols-[1.6fr_1fr] lg:p-10">
          <div class="space-y-5">
            <div
              class="inline-flex items-center gap-2 rounded-full bg-slate-200/50 px-4 py-1.5 backdrop-blur dark:bg-white/10"
            >
              <i class="i-mdi-star-four-points text-amber-500 dark:text-amber-400"></i>
              <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-slate-200">
                Wallpaper Forum
              </p>
            </div>
            <h1 class="text-4xl font-bold leading-tight lg:text-5xl">
              <span
                class="bg-gradient-to-r from-slate-900 via-blue-600 to-slate-800 bg-clip-text text-transparent dark:from-white dark:via-blue-100 dark:to-white"
              >
                创意灵感集散地
              </span>
            </h1>
            <p class="max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300/90">
              汇聚壁纸创作的灵感火花，分享设计技巧与创作经验，每一篇帖子都是可复用的创意资产。
            </p>
            <div class="flex flex-wrap gap-2.5">
              <span
                class="rounded-full border border-blue-400/50 bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-800 backdrop-blur transition-all hover:border-blue-500/70 hover:bg-blue-200 hover:shadow-md hover:shadow-blue-500/20 dark:border-blue-400/50 dark:bg-blue-500/40 dark:text-blue-100 dark:hover:bg-blue-500/50 dark:hover:shadow-blue-500/30"
                >💡 技术讨论</span
              >
              <span
                class="rounded-full border border-purple-400/50 bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-800 backdrop-blur transition-all hover:border-purple-500/70 hover:bg-purple-200 hover:shadow-md hover:shadow-purple-500/20 dark:border-purple-400/50 dark:bg-purple-500/40 dark:text-purple-100 dark:hover:bg-purple-500/50 dark:hover:shadow-purple-500/30"
                >✨ 经验分享</span
              >
              <span
                class="rounded-full border border-amber-400/50 bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-800 backdrop-blur transition-all hover:border-amber-500/70 hover:bg-amber-200 hover:shadow-md hover:shadow-amber-500/20 dark:border-amber-400/50 dark:bg-amber-500/40 dark:text-amber-100 dark:hover:bg-amber-500/50 dark:hover:shadow-amber-500/30"
                >❓ 问答求助</span
              >
              <span
                class="rounded-full border border-emerald-400/50 bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800 backdrop-blur transition-all hover:border-emerald-500/70 hover:bg-emerald-200 hover:shadow-md hover:shadow-emerald-500/20 dark:border-emerald-400/50 dark:bg-emerald-500/40 dark:text-emerald-100 dark:hover:bg-emerald-500/50 dark:hover:shadow-emerald-500/30"
                >🎁 资源分享</span
              >
            </div>
            <div class="grid gap-3 sm:grid-cols-3">
              <div
                v-for="stat in heroStats"
                :key="stat.label"
                class="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/60 px-5 py-4 backdrop-blur transition-all hover:border-slate-300/80 hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.08] dark:hover:border-white/20 dark:hover:bg-white/[0.12]"
              >
                <div
                  class="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/[0.05]"
                ></div>
                <p class="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/80">{{ stat.label }}</p>
                <p
                  class="mt-2 flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-slate-200"
                >
                  <i :class="stat.icon" class="text-2xl text-slate-600/80 dark:text-white/90"></i>
                  {{ stat.value }}
                </p>
              </div>
            </div>
          </div>
          <div
            class="flex flex-col justify-between gap-5 rounded-[30px] border border-slate-200/60 bg-white/60 p-7 shadow-xl backdrop-blur-lg dark:border-white/20 dark:bg-white/[0.08]"
          >
            <div class="space-y-4">
              <div class="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
                <i class="i-mdi-lightbulb-on text-emerald-600 dark:text-emerald-400"></i>
                <p class="text-xs font-medium text-emerald-700 dark:text-emerald-200">创作小贴士</p>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-200/90">
                把今天的灵感发出来，或先存成草稿，晚点再打磨。
              </p>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div
                  class="group rounded-2xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:border-slate-300/80 hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-white/20 dark:hover:bg-white/[0.1]"
                >
                  <div class="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <i class="i-mdi-chart-line text-lg"></i>
                    <p class="text-[11px] uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">活跃</p>
                  </div>
                  <p class="text-2xl font-bold text-slate-800 dark:text-white">
                    {{ formatNumber(forumStore.postsPagination.totalCount || 0) }}
                  </p>
                  <p class="mt-1 text-xs text-slate-500 dark:text-slate-300/80">帖子累积</p>
                </div>
                <div
                  class="group rounded-2xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:border-slate-300/80 hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-white/20 dark:hover:bg-white/[0.1]"
                >
                  <div class="mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <i class="i-mdi-heart-hands text-lg"></i>
                    <p class="text-[11px] uppercase tracking-[0.15em] text-amber-700 dark:text-amber-300">互动</p>
                  </div>
                  <p class="text-2xl font-bold text-slate-800 dark:text-white">
                    {{
                      formatNumber(
                        forumStore.posts.reduce(
                          (sum, item) => sum + (item.likeCount || 0) + (item.commentCount || 0),
                          0,
                        ),
                      )
                    }}
                  </p>
                  <p class="mt-1 text-xs text-slate-500 dark:text-slate-300/80">点赞与评论</p>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-3">
              <button
                class="group btn btn-primary relative overflow-hidden border-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/40"
                @click="handleCreatePost"
              >
                <span
                  class="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover:translate-x-full"
                ></span>
                <i class="i-mdi-plus relative z-10"></i>
                <span class="relative z-10">立即发帖</span>
              </button>
              <button
                class="btn btn-outline border-slate-300 text-slate-700 backdrop-blur transition-all hover:border-slate-400 hover:bg-slate-100 dark:border-white/30 dark:text-white dark:hover:border-white/50 dark:hover:bg-white/10"
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
        <div
          class="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/95 dark:shadow-slate-900/50"
        >
          <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div class="space-y-1">
              <div class="inline-flex items-center gap-2">
                <i class="i-mdi-post-outline text-2xl text-slate-700 dark:text-slate-300"></i>
                <h2
                  class="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-bold text-transparent dark:from-slate-100 dark:to-slate-400"
                >
                  讨论区
                </h2>
              </div>
              <p class="ml-10 text-sm text-slate-500 dark:text-slate-400">
                按分类、热度或时间筛选你感兴趣的主题
              </p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label
                class="input input-sm flex w-full items-center gap-2 border border-slate-200 bg-white shadow-sm transition-colors focus-within:border-slate-900 hover:border-slate-300 sm:w-64 dark:border-slate-600 dark:bg-slate-700 dark:focus-within:border-slate-400 dark:hover:border-slate-500"
              >
                <i class="i-mdi-magnify text-slate-400 dark:text-slate-500"></i>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜索帖子或关键词..."
                  class="grow bg-transparent text-sm outline-none dark:text-slate-200"
                  @input="handleSearch"
                />
              </label>
              <div class="flex gap-2">
                <select
                  v-model="forumStore.filters.sortBy"
                  class="select select-sm cursor-pointer border border-slate-200 bg-white text-sm shadow-sm transition-colors hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500"
                  @change="handleSortChange"
                >
                  <option value="createdAt">🕒 最新</option>
                  <option value="viewCount">🔥 最热</option>
                  <option value="likeCount">❤️ 点赞</option>
                  <option value="commentCount">💬 评论</option>
                </select>
                <button
                  class="group btn btn-primary btn-sm gap-1 shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                  @click="handleCreatePost"
                >
                  <i
                    class="i-mdi-plus text-base transition-transform duration-300 group-hover:rotate-90"
                  ></i>
                  <span>发帖</span>
                </button>
              </div>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2.5">
            <button
              class="rounded-full border px-4 py-1.5 text-sm font-medium transition-all"
              :class="
                forumStore.filters.category === ''
                  ? 'border-slate-900 bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-md shadow-slate-500/30 dark:border-slate-400 dark:from-slate-600 dark:to-slate-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-600'
              "
              @click="handleCategoryChange('')"
            >
              🌟 全部
            </button>
            <button
              v-for="category in forumStore.postCategories"
              :key="category.value"
              class="rounded-full border px-4 py-1.5 text-sm font-medium transition-all"
              :class="{
                'border-slate-900 bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-md shadow-slate-500/30 dark:border-slate-400 dark:from-slate-600 dark:to-slate-700':
                  forumStore.filters.category === category.value,
                'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-600':
                  forumStore.filters.category !== category.value,
              }"
              @click="handleCategoryChange(category.value)"
            >
              {{ category.emoji || "📝" }} {{ category.label }}
            </button>
          </div>
        </div>

        <div
          class="rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-6 shadow-lg shadow-slate-200/30 backdrop-blur-sm dark:border-slate-700/80 dark:from-slate-800 dark:to-slate-900/80 dark:shadow-slate-900/30"
        >
          <div class="mb-4 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <div
                class="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-2 shadow-md shadow-amber-500/30"
              >
                <i class="i-mdi-lightbulb-on text-lg text-white"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">创作小贴士</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">让内容更易读、更有价值</p>
              </div>
            </div>
            <span
              class="badge badge-outline badge-sm border-amber-300 bg-amber-50 font-medium text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300"
              >每日创作</span
            >
          </div>
          <ul class="space-y-3 text-sm">
            <li
              class="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-white/60 dark:hover:bg-slate-700/50"
            >
              <span class="text-lg">💡</span>
              <span class="text-slate-700 dark:text-slate-300">先写结论，再补充思路/步骤</span>
            </li>
            <li
              class="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-white/60 dark:hover:bg-slate-700/50"
            >
              <span class="text-lg">🖼️</span>
              <span class="text-slate-700 dark:text-slate-300">图片与代码并列展示，方便复现</span>
            </li>
            <li
              class="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-white/60 dark:hover:bg-slate-700/50"
            >
              <span class="text-lg">📝</span>
              <span class="text-slate-700 dark:text-slate-300">想保密可先存草稿，之后再完善</span>
            </li>
          </ul>
          <div class="mt-5 grid gap-2.5 sm:grid-cols-2">
            <button
              class="group btn btn-primary btn-sm w-full shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              @click="handleCreatePost"
            >
              <i class="i-mdi-pencil"></i>
              开始创作
            </button>
            <button
              class="btn btn-outline btn-sm w-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              @click="forumStore.resetFilters()"
            >
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
            class="flex min-h-[40vh] items-center justify-center rounded-3xl border border-slate-200/70 bg-white/90 shadow dark:border-slate-700/70 dark:bg-slate-800/90"
          >
            <div class="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
              <span class="loading loading-spinner loading-lg text-primary"></span>
              <p class="text-sm">正在加载讨论...</p>
            </div>
          </div>
          <div
            v-else-if="forumStore.error"
            class="border-error/30 bg-error/5 dark:bg-error/10 rounded-3xl border p-6 text-error shadow"
          >
            <div class="flex flex-wrap items-center gap-3">
              <i class="i-mdi-alert-circle text-2xl"></i>
              <span class="text-sm">{{ forumStore.error }}</span>
              <button class="btn btn-outline btn-sm" @click="handleRetry">重试</button>
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
              class="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center shadow-sm dark:border-slate-600 dark:bg-slate-800/50"
            >
              <i class="i-mdi-forum-outline mb-4 text-6xl text-slate-300 dark:text-slate-600"></i>
              <p class="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {{
                  forumStore.filters.search
                    ? "没有找到相关帖子"
                    : "暂时还没有帖子，来分享第一个吧！"
                }}
              </p>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                你可以尝试调整分类/排序，或者直接发布一个新的讨论。
              </p>
              <div class="mt-5 flex flex-wrap justify-center gap-3">
                <button class="btn btn-primary" @click="handleCreatePost">发布帖子</button>
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
            v-if="forumStore.filteredPosts.length > 0 && forumStore.postsPagination.totalPages > 1"
            class="flex justify-center"
          >
            <div class="join">
              <button
                class="btn btn-sm join-item"
                :disabled="forumStore.postsPagination.currentPage === 1"
                @click="goToPage(forumStore.postsPagination.currentPage - 1)"
              >
                «
              </button>
              <button
                v-for="(page, index) in visiblePages"
                :key="typeof page === 'number' ? `page-${page}` : `ellipsis-${index}`"
                class="btn btn-sm join-item"
                :class="{
                  'btn-active': page === forumStore.postsPagination.currentPage,
                  'btn-disabled': typeof page === 'string',
                }"
                @click="typeof page === 'number' ? goToPage(page) : undefined"
              >
                {{ page }}
              </button>
              <button
                class="btn btn-sm join-item"
                :disabled="
                  forumStore.postsPagination.currentPage === forumStore.postsPagination.totalPages
                "
                @click="goToPage(forumStore.postsPagination.currentPage + 1)"
              >
                »
              </button>
            </div>
          </div>
        </section>

        <aside class="space-y-5">
          <div
            class="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/90 p-6 shadow-lg shadow-slate-200/30 backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-slate-700/80 dark:from-slate-800 dark:to-slate-900/80 dark:shadow-slate-900/30"
          >
            <div
              class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 blur-2xl transition-transform duration-500 group-hover:scale-150"
            ></div>
            <div class="relative">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-2.5 shadow-lg shadow-amber-500/30"
                  >
                    <i class="i-mdi-fire text-xl text-white"></i>
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">热门帖子</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">本周最受关注</p>
                  </div>
                </div>
                <span
                  class="badge badge-sm border-amber-200 bg-amber-100 font-medium text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300"
                  >🔥 热门</span
                >
              </div>
              <ul class="space-y-3">
                <li
                  v-for="(post, index) in forumStore.popularPosts"
                  :key="`popular-${post.id}`"
                  class="group cursor-pointer rounded-2xl border border-slate-200/70 bg-white/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-slate-900/40 hover:bg-white hover:shadow-lg hover:shadow-slate-300/20 dark:border-slate-700/70 dark:bg-slate-800/60 dark:hover:border-slate-500/40 dark:hover:bg-slate-700 dark:hover:shadow-slate-900/20"
                  @click="$router.push(`/forums/post/${post.id}`)"
                >
                  <div class="flex items-start gap-4">
                    <div class="relative">
                      <span
                        class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-bold text-white shadow-lg dark:from-slate-600 dark:to-slate-700"
                      >
                        {{ index + 1 }}
                      </span>
                      <span v-if="index < 3" class="absolute -right-1 -top-1 text-xs">🏆</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p
                        class="mb-2 line-clamp-2 text-sm font-semibold text-slate-800 transition-colors group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-slate-100"
                      >
                        {{ post.title }}
                      </p>
                      <div
                        class="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400"
                      >
                        <div
                          class="flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700"
                        >
                          <i class="i-mdi-eye text-xs"></i>
                          <span>{{ formatNumber(post.viewCount) }}</span>
                        </div>
                        <div
                          class="flex items-center gap-1.5 rounded-full bg-rose-100 px-2 py-0.5 dark:bg-rose-900/30"
                        >
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

          <div
            class="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-6 shadow-lg shadow-slate-200/30 backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-slate-700/80 dark:from-slate-800 dark:to-slate-900/80 dark:shadow-slate-900/30"
          >
            <div
              class="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-2xl transition-transform duration-500 group-hover:scale-150"
            ></div>
            <div class="relative">
              <div class="mb-4 flex items-start justify-between gap-3">
                <div class="flex-1">
                  <h3 class="mb-1 text-base font-bold text-slate-900 dark:text-slate-100">
                    🚀 快速发布
                  </h3>
                  <p class="text-sm text-slate-600 dark:text-slate-300">
                    有灵感就写下标题，先存草稿，或直接发布。可随时编辑完善。
                  </p>
                </div>
                <div
                  class="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/30"
                >
                  <i class="i-mdi-lightning-bolt text-xl text-white"></i>
                </div>
              </div>
              <div class="space-y-2.5">
                <button
                  class="group btn btn-primary btn-sm w-full shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                  @click="handleCreatePost"
                >
                  <i class="i-mdi-pencil"></i>
                  去创作
                </button>
                <button
                  class="btn btn-ghost btn-sm w-full transition-colors hover:bg-white/60 dark:text-slate-100 dark:hover:bg-slate-700/60"
                  @click="forumStore.resetFilters()"
                >
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue"
import { useRouter } from "vue-router"
import { useForumStore } from "@/stores/forum"
import { useUserStore } from "@/stores/user"
import { forumService } from "@/services/forum"
import PostCard from "@/components/PostCard.vue"
import type { Post, PostCategory } from "@/stores/forum"

defineOptions({ name: "ForumIndex" })

const router = useRouter()
const forumStore = useForumStore()
const userStore = useUserStore()

const searchQuery = ref("")
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
type CategoryFilter = PostCategory["value"] | ""

function formatNumber(num: number) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "w"
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k"
  }
  return num.toString()
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
      forumStore.popularPosts.slice(0, 5).reduce((sum, item) => sum + (item.viewCount || 0), 0),
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
])

const visiblePages = computed(() => {
  const current = forumStore.postsPagination.currentPage
  const total = forumStore.postsPagination.totalPages
  const delta = 2
  const range: number[] = []
  const rangeWithDots: (number | string)[] = []
  let l: number | undefined

  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    }
  }

  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push("...")
      }
    }
    rangeWithDots.push(i)
    l = i
  })

  return rangeWithDots
})

const fetchPosts = async (reset = false) => {
  if (reset) {
    forumStore.setPostsPagination({ currentPage: 1 })
  }

  try {
    forumStore.setLoading(true)
    forumStore.setError(null)

    const { data, pagination } = await forumService.getPosts({
      page: forumStore.postsPagination.currentPage,
      limit: forumStore.postsPagination.pageSize,
      sortBy: forumStore.filters.sortBy,
      sortOrder: forumStore.filters.sortOrder as "ASC" | "DESC",
      category: forumStore.filters.category || undefined,
      search: forumStore.filters.search || undefined,
    })

    forumStore.setPosts(data)
    forumStore.setPostsPagination({
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      totalCount: pagination.totalCount,
    })
  } catch (error) {
    console.error("获取帖子失败:", error)
    forumStore.setError("获取帖子失败，请稍后重试")
  } finally {
    forumStore.setLoading(false)
  }
}

const normalizeCategory = (value: unknown): CategoryFilter => {
  if (typeof value !== "string" || value === "") {
    return ""
  }
  const match = forumStore.postCategories.find((item) => item.value === value)
  return match ? match.value : ""
}

const handleRetry = () => {
  fetchPosts()
}

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    forumStore.updateFilters({ search: searchQuery.value })
    fetchPosts(true)
  }, 500)
}

const handleCategoryChange = (category: CategoryFilter) => {
  const newCategory = forumStore.filters.category === category ? "" : category
  forumStore.updateFilters({ category: newCategory })
  fetchPosts(true)
}

const handleSortChange = () => {
  fetchPosts(true)
}

const handleScrollToContent = () => {
  const el = document.getElementById("forum-content")
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= forumStore.postsPagination.totalPages) {
    forumStore.setPostsPagination({ currentPage: page })
    fetchPosts()
  }
}

const handleCreatePost = () => {
  if (!userStore.isLoggedIn) {
    router.push("/auth/login")
    return
  }
  router.push("/forums/new")
}

const handleLike = async (post: Post) => {
  if (!userStore.isLoggedIn) {
    router.push("/auth/login")
    return
  }
  try {
    const hasLiked = post.isLiked
    if (hasLiked) {
      await forumService.unlikePost(post.id)
      forumStore.togglePostLike(post.id, false)
    } else {
      await forumService.likePost(post.id)
      forumStore.togglePostLike(post.id, true)
    }
  } catch (error) {
    console.error("点赞操作失败:", error)
  }
}

const handleComment = (post: Post) => {
  router.push(`/forums/post/${post.id}#comments`)
}

const handleEdit = (post: Post) => {
  router.push(`/forums/edit/${post.id}`)
}

const handleDelete = async (post: Post) => {
  try {
    await forumService.deletePost(post.id)
    forumStore.setPosts(forumStore.posts.filter((p) => p.id !== post.id))
  } catch (error) {
    console.error("删除帖子失败:", error)
  }
}

const handleShare = (post: Post) => {
  const shareUrl = `${window.location.origin}/forums/post/${post.id}`
  if (navigator.share) {
    navigator.share({
      title: post.title,
      text: post.summary || post.title,
      url: shareUrl,
    })
  } else {
    navigator.clipboard.writeText(shareUrl)
    alert("链接已复制到剪贴板")
  }
}

onMounted(() => {
  const route = router.currentRoute.value
  if (route.query.category) {
    forumStore.updateFilters({ category: normalizeCategory(route.query.category) })
  }
  if (route.query.search) {
    searchQuery.value = route.query.search as string
    forumStore.updateFilters({ search: route.query.search as string })
  }
  fetchPosts()
})

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
    searchTimeout.value = null
  }
})

watch(
  () => router.currentRoute.value.query,
  (newQuery) => {
    if (newQuery.category !== forumStore.filters.category) {
      forumStore.updateFilters({
        category: normalizeCategory(newQuery.category),
      })
      fetchPosts(true)
    }
    if (newQuery.search !== forumStore.filters.search) {
      searchQuery.value = (newQuery.search as string) || ""
      forumStore.updateFilters({ search: (newQuery.search as string) || "" })
      fetchPosts(true)
    }
  },
)
</script>
