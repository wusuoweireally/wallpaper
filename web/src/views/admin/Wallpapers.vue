<template>
  <div class="space-y-8">
    <!-- 页面标题 -->
    <div class="relative">
      <div
        class="absolute -inset-x-4 -inset-y-2 -z-10 rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-2xl"
      ></div>
      <div class="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30"
            >
              <iconify-icon icon="mdi:image" class="text-2xl text-white"></iconify-icon>
            </div>
            <div>
              <h1
                class="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-4xl font-bold text-transparent"
              >
                壁纸管理
              </h1>
              <p class="mt-1 text-white/70">Wallpaper Control</p>
            </div>
          </div>
          <button
            class="btn gap-2 border-none bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:from-purple-600 hover:to-pink-600"
            @click="openUploadModal"
          >
            <iconify-icon icon="mdi:plus" class="text-xl"></iconify-icon>
            上传壁纸
          </button>
        </div>
        <!-- 批量操作 -->
        <div
          v-if="hasSelection"
          class="mt-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
        >
          <span class="text-sm text-white/70">已选 {{ selectedIds.size }} 项</span>
          <div class="h-4 w-px bg-white/20"></div>
          <button
            class="btn btn-sm gap-1 rounded-xl border-none bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 hover:from-amber-500 hover:to-orange-500"
            :disabled="batchLoading"
            @click="batchSetFeatured(true)"
          >
            <iconify-icon icon="mdi:star"></iconify-icon>
            批量推荐
          </button>
          <button
            class="btn btn-sm gap-1 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20"
            :disabled="batchLoading"
            @click="batchSetFeatured(false)"
          >
            <iconify-icon icon="mdi:star-off"></iconify-icon>
            取消推荐
          </button>
          <button
            class="btn btn-sm gap-1 rounded-xl border-none bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600"
            :disabled="batchLoading"
            @click="batchDeleteSelected"
          >
            <iconify-icon icon="mdi:delete"></iconify-icon>
            批量删除
          </button>
          <button
            class="btn btn-ghost btn-sm rounded-xl text-white/60 hover:text-white"
            @click="selectedIds.clear()"
          >
            取消选择
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="notification"
      class="alert rounded-2xl border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-md"
    >
      <iconify-icon
        :icon="notification.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'"
        class="text-2xl"
        :class="notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'"
      ></iconify-icon>
      <span class="text-sm">{{ notification.text }}</span>
    </div>

    <!-- 筛选器 -->
    <div class="group relative">
      <div
        class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 opacity-75 blur transition duration-1000 group-hover:opacity-100"
      ></div>
      <div
        class="relative rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"
      >
        <div class="space-y-6 p-6">
          <div class="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/50">
            <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-400"></div>
            <span>筛选条件</span>
            <div class="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>
          <div class="grid gap-4 lg:grid-cols-12">
            <div class="form-control min-w-[150px] lg:col-span-3">
              <label class="label">
                <span class="label-text font-semibold text-white/80">分类</span>
              </label>
              <select
                v-model="filters.category"
                class="select rounded-xl border-white/20 bg-white/10 text-white backdrop-blur-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50"
                @change="refreshList"
              >
                <option value="" class="bg-slate-900">全部</option>
                <option value="general" class="bg-slate-900">通用</option>
                <option value="anime" class="bg-slate-900">动漫</option>
                <option value="people" class="bg-slate-900">人物</option>
              </select>
            </div>

            <div class="form-control min-w-[150px] lg:col-span-3">
              <label class="label">
                <span class="label-text font-semibold text-white/80">状态</span>
              </label>
              <select
                v-model="filters.status"
                class="select rounded-xl border-white/20 bg-white/10 text-white backdrop-blur-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50"
                @change="refreshList"
              >
                <option value="" class="bg-slate-900">全部</option>
                <option value="0" class="bg-slate-900">待审核</option>
                <option value="1" class="bg-slate-900">已审核</option>
              </select>
            </div>

            <div class="form-control min-w-[250px] flex-1 lg:col-span-4">
              <label class="label">
                <span class="label-text font-semibold text-white/80">搜索</span>
              </label>
              <div class="relative">
                <input
                  v-model="filters.search"
                  type="text"
                  placeholder="搜索壁纸标题..."
                  class="input w-full rounded-xl border-white/20 bg-white/10 pl-12 pr-12 text-white backdrop-blur-sm placeholder:text-white/40 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50"
                  @keyup.enter="refreshList"
                />
                <iconify-icon
                  icon="mdi:magnify"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-white/40"
                ></iconify-icon>
                <button
                  v-if="filters.search"
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
                  @click="clearSearch"
                >
                  <iconify-icon icon="mdi:close-circle" class="text-lg"></iconify-icon>
                </button>
              </div>
            </div>

            <div class="flex items-end gap-3 lg:col-span-2">
              <button
                class="btn flex-1 gap-2 rounded-xl border-none bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30 hover:from-pink-600 hover:to-purple-600"
                @click="refreshList"
              >
                <iconify-icon icon="mdi:magnify" class="text-lg"></iconify-icon>
                搜索
              </button>
              <button
                class="btn btn-outline rounded-xl border-white/30 text-white/80 hover:border-white/60 hover:bg-white/10 hover:text-white"
                @click="resetFilters"
              >
                重置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 壁纸网格 -->
    <div class="group relative">
      <div
        class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-indigo-500/30 opacity-75 blur transition duration-1000 group-hover:opacity-100"
      ></div>
      <div
        class="relative overflow-visible rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"
      >
        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="relative">
            <div
              class="h-16 w-16 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500"
            ></div>
          </div>
        </div>

        <div v-else-if="wallpapers.length === 0" class="py-20 text-center">
          <div
            class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/5 to-white/10"
          >
            <iconify-icon icon="mdi:image-off" class="text-4xl text-white/30"></iconify-icon>
          </div>
          <p class="text-lg font-semibold text-white/60">暂无壁纸数据</p>
          <p class="mt-2 text-sm text-white/40">开始上传你的第一个作品吧</p>
        </div>

        <div v-else class="p-6">
          <!-- 全选 -->
          <div class="mb-4 flex items-center gap-3">
            <button
              class="flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all"
              :class="
                isAllSelected
                  ? 'border-purple-400 bg-purple-500 text-white'
                  : 'border-white/30 bg-white/10 text-transparent hover:border-white/60'
              "
              @click="toggleSelectAll"
            >
              <iconify-icon v-if="isAllSelected" icon="mdi:check" class="text-sm"></iconify-icon>
            </button>
            <span class="text-sm text-white/60">全选当前页</span>
          </div>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="wallpaper in wallpapers"
              :key="wallpaper.id"
              class="relative flex h-full flex-col rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-4 shadow-xl"
              :class="{ 'ring-2 ring-purple-400/60': isSelected(wallpaper.id) }"
            >
              <!-- 选择复选框 -->
              <button
                class="absolute left-4 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all"
                :class="
                  isSelected(wallpaper.id)
                    ? 'border-purple-400 bg-purple-500 text-white'
                    : 'border-white/30 bg-white/10 text-transparent hover:border-white/60'
                "
                @click.stop="toggleSelect(wallpaper.id)"
              >
                <iconify-icon
                  v-if="isSelected(wallpaper.id)"
                  icon="mdi:check"
                  class="text-sm"
                ></iconify-icon>
              </button>
              <div class="relative overflow-hidden rounded-2xl">
                <img
                  :src="getWallpaperImage(wallpaper.thumbnailUrl || wallpaper.fileUrl)"
                  :alt="`壁纸 #${wallpaper.id}`"
                  class="h-64 w-full object-cover"
                  @error="handleImageError"
                />
                <button
                  class="btn btn-sm absolute left-3 top-3 border-none bg-white/15 text-white backdrop-blur hover:bg-white/25"
                  @click.stop="openPreview(wallpaper)"
                >
                  <iconify-icon icon="mdi:eye"></iconify-icon>
                  预览
                </button>
              </div>
              <div class="flex flex-1 flex-col gap-3 p-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40">
                      {{ getCategoryLabel(wallpaper.category) }}
                    </p>
                    <h3 class="mt-1 line-clamp-1 text-lg font-semibold text-white">
                      壁纸 #{{ wallpaper.id }}
                    </h3>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <div
                      class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white"
                      :class="
                        wallpaper.status === 1
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-orange-500 to-red-500'
                      "
                    >
                      <iconify-icon
                        :icon="wallpaper.status === 1 ? 'mdi:check-circle' : 'mdi:alert-circle'"
                        class="text-sm"
                      ></iconify-icon>
                      {{ formatStatus(wallpaper.status) }}
                    </div>
                    <span
                      v-if="wallpaper.isFeatured"
                      class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2 py-0.5 text-[10px] font-bold text-slate-900"
                    >
                      <iconify-icon icon="mdi:star" class="text-xs"></iconify-icon>
                      推荐
                    </span>
                  </div>
                </div>
                <div class="flex flex-wrap gap-3 text-xs text-white/60">
                  <span class="inline-flex items-center gap-1"
                    ><iconify-icon icon="mdi:crop" class="text-base"></iconify-icon
                    >{{ wallpaper.width }} × {{ wallpaper.height }}</span
                  >
                  <span class="inline-flex items-center gap-1"
                    ><iconify-icon icon="mdi:weight" class="text-base"></iconify-icon
                    >{{ formatFileSize(wallpaper.fileSize) }}</span
                  >
                  <span class="inline-flex items-center gap-1"
                    ><iconify-icon icon="mdi:calendar" class="text-base"></iconify-icon
                    >{{ formatDateTime(wallpaper.createdAt) }}</span
                  >
                </div>
                <div class="flex flex-wrap gap-2" v-if="wallpaper.tags?.length">
                  <span
                    v-for="(tag, index) in wallpaper.tags"
                    :key="getTagKey(tag, index)"
                    class="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70"
                  >
                    #{{ getTagLabel(tag) }}
                  </span>
                </div>
                <div class="flex items-center gap-3 text-sm text-white/70">
                  <span class="inline-flex items-center gap-1"
                    ><iconify-icon icon="mdi:eye-outline"></iconify-icon
                    >{{ wallpaper.viewCount || 0 }}</span
                  >
                  <span class="inline-flex items-center gap-1"
                    ><iconify-icon icon="mdi:heart-outline"></iconify-icon
                    >{{ wallpaper.likeCount || 0 }}</span
                  >
                  <span class="inline-flex items-center gap-1"
                    ><iconify-icon icon="mdi:star-outline"></iconify-icon
                    >{{ wallpaper.favoriteCount || 0 }}</span
                  >
                </div>
                <div class="mt-auto flex flex-wrap gap-3">
                  <button
                    class="btn flex-1 gap-2 rounded-xl border-none bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:from-purple-600 hover:to-pink-600"
                    @click.stop="openPreview(wallpaper)"
                  >
                    <iconify-icon icon="mdi:eye"></iconify-icon>
                    查看详情
                  </button>
                  <div class="dropdown dropdown-end">
                    <div
                      tabindex="0"
                      role="button"
                      class="btn btn-ghost btn-square rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <iconify-icon icon="mdi:dots-horizontal"></iconify-icon>
                    </div>
                    <ul
                      tabindex="0"
                      class="dropdown-content menu w-56 space-y-1 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl"
                    >
                      <li>
                        <button
                          class="rounded-xl text-white/90 transition-colors hover:bg-purple-500/20 hover:text-white"
                          @click="openInNewTab(wallpaper)"
                        >
                          <iconify-icon icon="mdi:arrow-top-right-bold-box"></iconify-icon>
                          在新标签中打开
                        </button>
                      </li>
                      <li>
                        <button
                          class="rounded-xl text-white/90 transition-colors hover:bg-purple-500/20 hover:text-white"
                          @click="copyWallpaperUrl(wallpaper)"
                        >
                          <iconify-icon icon="mdi:link-variant"></iconify-icon>
                          复制图片链接
                        </button>
                      </li>
                      <li>
                        <button
                          class="rounded-xl text-white/90 transition-colors hover:bg-purple-500/20 hover:text-white"
                          @click="copyWallpaperId(wallpaper)"
                        >
                          <iconify-icon icon="mdi:identifier"></iconify-icon>
                          复制壁纸ID
                        </button>
                      </li>
                      <div class="divider my-1 border-white/10"></div>
                      <li>
                        <button
                          class="rounded-xl text-white/90 transition-colors hover:bg-purple-500/20 hover:text-white"
                          @click="openEditModal(wallpaper)"
                        >
                          <iconify-icon icon="mdi:pencil"></iconify-icon>
                          编辑信息
                        </button>
                      </li>
                      <li>
                        <button
                          class="rounded-xl text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-200"
                          :disabled="actionLoadingId === wallpaper.id"
                          @click="confirmDelete(wallpaper)"
                        >
                          <iconify-icon
                            :icon="actionLoadingId === wallpaper.id ? 'mdi:loading' : 'mdi:delete'"
                            :class="{ 'animate-spin': actionLoadingId === wallpaper.id }"
                          ></iconify-icon>
                          删除壁纸
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="shouldShowPagination"
          class="flex flex-col gap-4 border-t border-white/10 bg-white/5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="text-sm text-white/70">
            当前显示
            <span class="font-semibold text-white">{{ pageRange.start }}-{{ pageRange.end }}</span>
            ，总计
            <span class="font-semibold text-white">{{ pagination.total }}</span>
            张壁纸
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              class="btn btn-sm rounded-xl border-white/30 text-white/80 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="pagination.page === 1"
              @click="changePage(pagination.page - 1)"
            >
              上一页
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              class="btn btn-sm rounded-xl"
              :class="
                page === pagination.page
                  ? 'border-white bg-white text-slate-900'
                  : 'border-white/30 bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
              "
              @click="changePage(page)"
            >
              {{ page }}
            </button>
            <button
              class="btn btn-sm rounded-xl border-white/30 text-white/80 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="pagination.page === pagination.pages"
              @click="changePage(pagination.page + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="showUploadModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <div
            class="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-800/90 text-white shadow-2xl"
            style="
              font-family:
                &quot;Noto Sans SC&quot;, &quot;PingFang SC&quot;, &quot;Microsoft YaHei&quot;,
                sans-serif;
            "
          >
            <button
              class="btn btn-sm btn-circle absolute right-4 top-4 border-white/15 bg-white/10 text-white hover:bg-white/20"
              @click="closeUploadModal"
              :disabled="uploadLoading"
            >
              ✕
            </button>
            <div class="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr]">
              <div class="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
                    Wallpaper Upload
                  </p>
                  <h3 class="mt-2 text-2xl font-semibold">上传新壁纸</h3>
                  <p class="mt-1 text-sm text-white/60">
                    选择图片、设置分类与标签，支持批量标签输入（逗号或回车）
                  </p>
                </div>

                <div class="space-y-3">
                  <label class="text-sm text-white/60">壁纸图片</label>
                  <div
                    v-if="uploadForm.previewUrl"
                    class="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                  >
                    <img :src="uploadForm.previewUrl" alt="预览" class="h-64 w-full object-cover" />
                    <button
                      type="button"
                      class="btn btn-error btn-xs absolute right-3 top-3"
                      @click="removeUploadFile"
                      :disabled="uploadLoading"
                    >
                      移除
                    </button>
                  </div>
                  <label
                    v-else
                    class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-gradient-to-br from-white/5 to-white/10 p-6 text-white/70 transition hover:border-emerald-300/70 hover:text-white"
                  >
                    <iconify-icon
                      icon="mdi:cloud-upload"
                      class="text-3xl text-white/80"
                    ></iconify-icon>
                    <div class="text-center text-sm">
                      <p>点击或拖拽图片到此处</p>
                      <p class="mt-1 text-xs text-white/40">
                        支持 JPG / PNG / WEBP，建议 4K+ 清晰度
                      </p>
                    </div>
                    <input
                      ref="uploadFileInput"
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleUploadFileChange"
                    />
                  </label>
                  <p v-if="uploadErrors.file" class="text-xs text-red-300">
                    {{ uploadErrors.file }}
                  </p>
                </div>

                <div class="space-y-2">
                  <label class="text-sm text-white/60">标签（最多 {{ uploadMaxTags }} 个）</label>
                  <div class="flex gap-2">
                    <input
                      v-model="uploadForm.tagsInput"
                      type="text"
                      placeholder="输入标签后按回车或逗号"
                      class="input flex-1 border-white/10 bg-slate-900/60 text-white placeholder:text-white/30 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/40"
                      :disabled="uploadLoading"
                      @keydown.enter.prevent="addUploadTagFromInput"
                    />
                    <button
                      type="button"
                      class="btn btn-outline border-white/20 text-white/80 hover:border-emerald-300/70 hover:bg-emerald-300/10 hover:text-white"
                      @click="addUploadTagFromInput"
                      :disabled="uploadLoading"
                    >
                      添加
                    </button>
                  </div>
                  <div class="flex min-h-[34px] flex-wrap gap-2">
                    <span
                      v-for="tag in uploadTags"
                      :key="tag"
                      class="badge badge-lg gap-1 border border-white/10 bg-white/10 text-white"
                    >
                      #{{ tag }}
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs btn-circle text-white/70 hover:text-white"
                        @click="removeUploadTag(tag)"
                        :disabled="uploadLoading"
                      >
                        ×
                      </button>
                    </span>
                    <span v-if="uploadTags.length === 0" class="text-xs text-white/40"
                      >例如：4K, 星空, 极简</span
                    >
                  </div>
                  <p v-if="uploadErrors.tags" class="text-xs text-red-300">
                    {{ uploadErrors.tags }}
                  </p>
                </div>
              </div>

              <div class="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div class="form-control">
                  <label class="label text-sm text-white/60">分类</label>
                  <select
                    v-model="uploadForm.category"
                    class="select border-white/10 bg-slate-900/60 text-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/40"
                    :disabled="uploadLoading"
                  >
                    <option
                      v-for="option in categoryOptions"
                      :key="option.value"
                      :value="option.value"
                      class="bg-slate-900"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <p v-if="uploadErrors.category" class="mt-1 text-xs text-red-300">
                    {{ uploadErrors.category }}
                  </p>
                </div>

                <div v-if="uploadLoading" class="space-y-2">
                  <div class="flex justify-between text-xs text-white/70">
                    <span>上传进度</span>
                    <span>{{ uploadProgress }}%</span>
                  </div>
                  <div class="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                      :style="{ width: uploadProgress + '%' }"
                    ></div>
                  </div>
                </div>

                <div class="flex flex-col gap-3 md:flex-row md:justify-end">
                  <button
                    type="button"
                    class="btn btn-ghost border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                    @click="closeUploadModal"
                    :disabled="uploadLoading"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    class="btn border-none bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-900 hover:from-emerald-300 hover:via-teal-300 hover:to-cyan-300"
                    :class="{ loading: uploadLoading }"
                    :disabled="uploadLoading"
                    @click="submitWallpaperUpload"
                  >
                    开始上传
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- 编辑壁纸弹窗 -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="editWallpaper"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          @click.self="closeEditModal"
        >
          <div
            class="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-800/90 text-white shadow-2xl"
          >
            <button
              class="btn btn-sm btn-circle absolute right-4 top-4 border-white/15 bg-white/10 text-white hover:bg-white/20"
              @click="closeEditModal"
              :disabled="editLoading"
            >
              ✕
            </button>
            <div class="space-y-6 p-6">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
                  Edit Wallpaper
                </p>
                <h3 class="mt-2 text-xl font-semibold">编辑壁纸 #{{ editWallpaper.id }}</h3>
              </div>

              <!-- 预览 -->
              <div class="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <img
                  :src="getWallpaperImage(editWallpaper.thumbnailUrl || editWallpaper.fileUrl)"
                  :alt="`壁纸 #${editWallpaper.id}`"
                  class="h-48 w-full object-cover"
                />
              </div>

              <div class="space-y-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold text-white/80">标签</span>
                    <span class="label-text-alt text-white/40">逗号分隔</span>
                  </label>
                  <input
                    v-model="editForm.tagsInput"
                    type="text"
                    placeholder="例如：4K, 星空, 极简"
                    class="input w-full rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/40"
                    :disabled="editLoading"
                  />
                </div>
              </div>

              <div class="flex justify-end gap-3">
                <button
                  class="btn btn-ghost rounded-xl border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                  @click="closeEditModal"
                  :disabled="editLoading"
                >
                  取消
                </button>
                <button
                  class="btn rounded-xl border-none bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-900 hover:from-emerald-300 hover:via-teal-300 hover:to-cyan-300"
                  :class="{ loading: editLoading }"
                  :disabled="editLoading"
                  @click="submitEdit"
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="previewWallpaper"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div
            class="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 text-white shadow-2xl"
          >
            <button
              class="btn btn-sm btn-circle absolute right-4 top-4 border-white/20 bg-white/10 text-white hover:bg-white/20"
              @click="closePreview"
            >
              ✕
            </button>
            <div class="grid gap-6 p-6 md:grid-cols-2">
              <div class="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <img
                  :src="getWallpaperImage(previewWallpaper.fileUrl)"
                  :alt="`壁纸 #${previewWallpaper.id}`"
                  class="h-full w-full object-cover"
                  @error="handleImageError"
                />
              </div>
              <div class="space-y-4">
                <div>
                  <p class="text-xs uppercase tracking-[0.3em] text-white/40">Wallpaper Detail</p>
                  <h3 class="mt-2 text-2xl font-semibold">壁纸 #{{ previewWallpaper.id }}</h3>
                  <p class="mt-1 text-sm text-white/70">
                    {{ formatStatus(previewWallpaper.status) }} ·
                    {{ formatDateTime(previewWallpaper.createdAt) }}
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span class="badge border-none bg-white/15 text-white">{{
                    getCategoryLabel(previewWallpaper.category)
                  }}</span>
                  <span class="badge border-none bg-white/15 text-white"
                    >{{ previewWallpaper.width }} × {{ previewWallpaper.height }}</span
                  >
                  <span class="badge border-none bg-white/15 text-white">{{
                    formatFileSize(previewWallpaper.fileSize)
                  }}</span>
                </div>
                <div class="grid grid-cols-3 gap-3 text-center text-sm text-white/70">
                  <div class="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p class="text-xs text-white/50">浏览</p>
                    <p class="text-lg font-semibold text-white">
                      {{ previewWallpaper.viewCount || 0 }}
                    </p>
                  </div>
                  <div class="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p class="text-xs text-white/50">点赞</p>
                    <p class="text-lg font-semibold text-white">
                      {{ previewWallpaper.likeCount || 0 }}
                    </p>
                  </div>
                  <div class="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p class="text-xs text-white/50">收藏</p>
                    <p class="text-lg font-semibold text-white">
                      {{ previewWallpaper.favoriteCount || 0 }}
                    </p>
                  </div>
                </div>
                <div v-if="previewWallpaper.tags?.length" class="space-y-2">
                  <p class="text-xs uppercase tracking-[0.3em] text-white/50">Tags</p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="(tag, index) in previewWallpaper.tags"
                      :key="getTagKey(tag, index)"
                      class="badge border-none bg-gradient-to-r from-purple-500/40 to-pink-500/40 text-white"
                    >
                      #{{ getTagLabel(tag) }}
                    </span>
                  </div>
                </div>
                <div v-else class="text-xs text-white/50">暂无标签</div>
                <div
                  v-if="previewWallpaper.uploader"
                  class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div class="avatar">
                    <div class="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/20">
                      <img
                        :src="getUploaderAvatar(previewWallpaper.uploader.avatarUrl)"
                        :alt="previewWallpaper.uploader.username"
                        class="h-full w-full object-cover"
                        @error="handleAvatarError"
                      />
                    </div>
                  </div>
                  <div>
                    <p class="text-sm font-semibold">{{ previewWallpaper.uploader.username }}</p>
                    <p class="text-xs text-white/60">上传者</p>
                  </div>
                </div>
                <div class="flex flex-wrap gap-3">
                  <button
                    class="btn flex-1 border-none bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                    @click="previewWallpaper && openInNewTab(previewWallpaper)"
                  >
                    <iconify-icon icon="mdi:arrow-top-right-bold-box"></iconify-icon>
                    打开原图
                  </button>
                  <button
                    class="btn flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                    @click="previewWallpaper && copyWallpaperUrl(previewWallpaper)"
                  >
                    <iconify-icon icon="mdi:link-variant"></iconify-icon>
                    复制链接
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from "vue"
import adminService, {
  type AdminWallpaper,
  type AdminWallpaperQuery,
  type AdminWallpaperTag,
} from "@/services/admin"
import wallpaperService from "@/services/wallpaper"
import type { ApiResponse } from "@/config/api"

interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

const loading = ref(true)
const wallpapers = ref<AdminWallpaper[]>([])
const previewWallpaper = ref<AdminWallpaper | null>(null)
const editWallpaper = ref<AdminWallpaper | null>(null)
const editForm = reactive({ tagsInput: "" })
const editLoading = ref(false)
const actionLoadingId = ref<number | null>(null)
const selectedIds = ref<Set<number>>(new Set())
const batchLoading = ref(false)
const notification = ref<{ type: "success" | "error"; text: string } | null>(null)
const showUploadModal = ref(false)
const uploadLoading = ref(false)
const uploadProgress = ref(0)

const pagination = ref<PaginationMeta>({
  page: 1,
  limit: 12,
  total: 0,
  pages: 0,
})

const filters = reactive({
  category: "",
  status: "",
  search: "",
})

const uploadForm = reactive({
  file: null as File | null,
  previewUrl: "",
  category: "general" as AdminWallpaper["category"],
  tagsInput: "",
})
const uploadTags = ref<string[]>([])
const uploadErrors = reactive({
  file: "",
  category: "",
  tags: "",
})
const uploadMaxTags = 8
const uploadFileInput = ref<HTMLInputElement | null>(null)
const categoryOptions = [
  { value: "general", label: "通用" },
  { value: "anime", label: "动漫" },
  { value: "people", label: "人物" },
]

type WallpaperTagLike = string | AdminWallpaperTag

const DEFAULT_WALLPAPER_PLACEHOLDER =
  "https://via.placeholder.com/600x900/0f172a/FFFFFF?text=Wallpaper"
const DEFAULT_AVATAR_PLACEHOLDER = "https://api.dicebear.com/7.x/avataaars/svg?seed=artist"

let notificationTimer: ReturnType<typeof setTimeout> | null = null

const showNotification = (text: string, type: "success" | "error" = "success") => {
  notification.value = { text, type }
  if (notificationTimer) {
    clearTimeout(notificationTimer)
  }
  notificationTimer = setTimeout(() => {
    notification.value = null
    notificationTimer = null
  }, 2600)
}

const getWallpaperImage = (url?: string | null) => {
  if (!url) return DEFAULT_WALLPAPER_PLACEHOLDER
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url
  if (url.startsWith("/")) return `${url}?t=${Date.now()}`
  return `/api/uploads/wallpapers/${url}?t=${Date.now()}`
}

const getUploaderAvatar = (url?: string | null) => {
  if (!url) return DEFAULT_AVATAR_PLACEHOLDER
  if (/^(https?:)?\/\//.test(url)) return url
  if (url.startsWith("/")) return url
  return `/api/uploads/profile-pictures/${url}`
}

const formatFileSize = (size?: number) => {
  if (!size && size !== 0) return "未知大小"
  const units = ["B", "KB", "MB", "GB"]
  let index = 0
  let value = size
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatStatus = (status?: number) => {
  if (status === 1) return "已审核"
  return "待审核"
}

const getCategoryLabel = (category: AdminWallpaper["category"]) => {
  switch (category) {
    case "anime":
      return "动漫"
    case "people":
      return "人物"
    default:
      return "通用"
  }
}

const getTagLabel = (tag: WallpaperTagLike) => {
  if (!tag) return ""
  if (typeof tag === "string") return tag
  return tag.name || tag.slug || (tag.id ? `ID-${tag.id}` : "标签")
}

const getTagKey = (tag: WallpaperTagLike, index?: number) => {
  if (typeof tag === "string") return `tag-${tag}`
  return `tag-${tag.id ?? tag.slug ?? tag.name ?? index ?? Math.random().toString(36).slice(2)}`
}

const normalizePagination = (payload?: Partial<PaginationMeta>): PaginationMeta => {
  const limit = payload?.limit ?? pagination.value.limit ?? 12
  const total = payload?.total ?? 0
  return {
    page: payload?.page ?? 1,
    limit,
    total,
    pages: payload?.pages ?? (limit > 0 ? Math.ceil(total / limit) : 0),
  }
}

const loadWallpapers = async () => {
  try {
    loading.value = true
    const query: AdminWallpaperQuery = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: filters.search || undefined,
      category: (filters.category || undefined) as AdminWallpaperQuery["category"],
      status: filters.status ? Number(filters.status) : undefined,
    }

    const response = await adminService.adminGetWallpapers(query)
    wallpapers.value = response.data ?? []
    pagination.value = normalizePagination(response.pagination)
  } catch (error) {
    console.error("加载壁纸列表失败:", error)
    wallpapers.value = []
    pagination.value = normalizePagination()
  } finally {
    loading.value = false
  }
}

const refreshList = () => {
  pagination.value.page = 1
  loadWallpapers()
}

const changePage = (page: number) => {
  if (page < 1 || (pagination.value.pages && page > pagination.value.pages)) return
  pagination.value.page = page
  loadWallpapers()
}

const clearSearch = () => {
  if (!filters.search) return
  filters.search = ""
  refreshList()
}

const resetFilters = () => {
  filters.category = ""
  filters.status = ""
  filters.search = ""
  refreshList()
}

const openPreview = (wallpaper: AdminWallpaper) => {
  previewWallpaper.value = wallpaper
}

const closePreview = () => {
  previewWallpaper.value = null
}

const openInNewTab = (wallpaper: AdminWallpaper) => {
  const targetUrl = getWallpaperImage(wallpaper.fileUrl)
  window.open(targetUrl, "_blank", "noopener")
}

const copyToClipboard = async (text: string, message = "已复制到剪贴板") => {
  if (!navigator?.clipboard) {
    console.warn("当前环境不支持剪贴板 API")
    showNotification("当前环境不支持自动复制", "error")
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    showNotification(message, "success")
  } catch (error) {
    console.error("复制失败:", error)
    showNotification("复制失败，请手动复制", "error")
  }
}

const copyWallpaperUrl = (wallpaper: AdminWallpaper) => {
  copyToClipboard(getWallpaperImage(wallpaper.fileUrl), "图片链接已复制")
}

const copyWallpaperId = (wallpaper: AdminWallpaper) => {
  copyToClipboard(String(wallpaper.id), "壁纸ID已复制")
}

const confirmDelete = async (wallpaper: AdminWallpaper) => {
  const confirmed = window.confirm(`确认删除壁纸 #${wallpaper.id} ? 删除后不可恢复。`)
  if (!confirmed) return

  try {
    actionLoadingId.value = wallpaper.id
    await adminService.adminDeleteWallpaper(wallpaper.id)
    showNotification("壁纸已删除")
    if (previewWallpaper.value?.id === wallpaper.id) {
      closePreview()
    }
    await loadWallpapers()
  } catch (error) {
    console.error("删除壁纸失败:", error)
    showNotification("删除壁纸失败，请稍后重试", "error")
  } finally {
    actionLoadingId.value = null
  }
}

const shouldShowPagination = computed(() => pagination.value.pages > 1)

const pageRange = computed(() => {
  if (!pagination.value.total) return { start: 0, end: 0 }
  const start = (pagination.value.page - 1) * pagination.value.limit + 1
  const end = Math.min(pagination.value.page * pagination.value.limit, pagination.value.total)
  return { start, end }
})

const visiblePages = computed(() => {
  const totalPages = pagination.value.pages || 0
  if (totalPages === 0) return [1]

  const current = pagination.value.page
  const windowSize = 5
  let start = Math.max(1, current - 2)
  let end = Math.min(totalPages, current + 2)

  const span = end - start + 1
  if (span < windowSize) {
    const remaining = windowSize - span
    start = Math.max(1, start - remaining)
    end = Math.min(totalPages, end + (windowSize - (end - start + 1)))
  }

  const pages: number[] = []
  for (let i = start; i <= end; i += 1) {
    pages.push(i)
  }
  return pages
})

const openUploadModal = () => {
  resetUploadForm()
  showUploadModal.value = true
}

const closeUploadModal = () => {
  showUploadModal.value = false
  resetUploadForm()
}

const resetUploadForm = () => {
  if (uploadForm.previewUrl) {
    URL.revokeObjectURL(uploadForm.previewUrl)
  }
  uploadForm.file = null
  uploadForm.previewUrl = ""
  uploadForm.category = "general"
  uploadForm.tagsInput = ""
  uploadTags.value = []
  uploadErrors.file = ""
  uploadErrors.category = ""
  uploadErrors.tags = ""
  uploadProgress.value = 0
  if (uploadFileInput.value) {
    uploadFileInput.value.value = ""
  }
}

const handleUploadFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    uploadErrors.file = "请选择要上传的图片"
    return
  }
  if (!file.type.startsWith("image/")) {
    uploadErrors.file = "仅支持图片文件"
    return
  }
  if (uploadForm.previewUrl) {
    URL.revokeObjectURL(uploadForm.previewUrl)
  }
  uploadForm.file = file
  uploadForm.previewUrl = URL.createObjectURL(file)
  uploadErrors.file = ""
}

const removeUploadFile = () => {
  if (uploadForm.previewUrl) {
    URL.revokeObjectURL(uploadForm.previewUrl)
  }
  uploadForm.file = null
  uploadForm.previewUrl = ""
  uploadErrors.file = ""
  if (uploadFileInput.value) {
    uploadFileInput.value.value = ""
  }
}

const addUploadTagFromInput = () => {
  if (!uploadForm.tagsInput) return

  const candidates = uploadForm.tagsInput
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)

  uploadForm.tagsInput = ""

  for (const tag of candidates) {
    if (uploadTags.value.includes(tag)) continue
    if (uploadTags.value.length >= uploadMaxTags) {
      uploadErrors.tags = `最多添加 ${uploadMaxTags} 个标签`
      break
    }
    uploadTags.value.push(tag)
    uploadErrors.tags = ""
  }
}

const removeUploadTag = (tag: string) => {
  uploadTags.value = uploadTags.value.filter((item) => item !== tag)
  if (uploadTags.value.length < uploadMaxTags) {
    uploadErrors.tags = ""
  }
}

const validateUploadForm = () => {
  let valid = true
  uploadErrors.file = ""
  uploadErrors.category = ""
  uploadErrors.tags = ""

  if (!uploadForm.file) {
    uploadErrors.file = "请选择要上传的图片"
    valid = false
  }

  if (!uploadForm.category) {
    uploadErrors.category = "请选择分类"
    valid = false
  }

  if (uploadTags.value.length > uploadMaxTags) {
    uploadErrors.tags = `最多添加 ${uploadMaxTags} 个标签`
    valid = false
  }

  return valid
}

const submitWallpaperUpload = async () => {
  if (uploadForm.tagsInput.trim()) {
    addUploadTagFromInput()
  }

  if (!validateUploadForm() || !uploadForm.file) return

  try {
    uploadLoading.value = true
    uploadProgress.value = 0

    const { response } = await wallpaperService.uploadWallpaper(
      {
        file: uploadForm.file,
        category: uploadForm.category,
        tags: uploadTags.value,
      },
      (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      },
    )

    const uploadResponse = response as ApiResponse<AdminWallpaper>
    if (uploadResponse.success && uploadResponse.data) {
      const uploadedWallpaper = uploadResponse.data
      if (uploadForm.category) {
        await adminService.adminUpdateWallpaper(uploadedWallpaper.id, {
          category: uploadForm.category,
        })
      }
      showNotification("壁纸上传成功")
      closeUploadModal()
      await loadWallpapers()
    } else {
      throw new Error(uploadResponse.message || "上传失败")
    }
  } catch (error) {
    console.error("上传壁纸失败:", error)
    const message = error instanceof Error ? error.message : "上传失败，请稍后重试"
    showNotification(message, "error")
  } finally {
    uploadLoading.value = false
    uploadProgress.value = 0
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.src !== DEFAULT_WALLPAPER_PLACEHOLDER) {
    img.src = DEFAULT_WALLPAPER_PLACEHOLDER
  }
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.src !== DEFAULT_AVATAR_PLACEHOLDER) {
    img.src = DEFAULT_AVATAR_PLACEHOLDER
  }
}

// 批量选择
const toggleSelect = (id: number) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

const toggleSelectAll = () => {
  if (selectedIds.value.size === wallpapers.value.length) {
    selectedIds.value.clear()
  } else {
    wallpapers.value.forEach((w) => selectedIds.value.add(w.id))
  }
}

const isSelected = (id: number) => selectedIds.value.has(id)

const hasSelection = computed(() => selectedIds.value.size > 0)
const isAllSelected = computed(
  () => wallpapers.value.length > 0 && selectedIds.value.size === wallpapers.value.length,
)

// 批量设置推荐
const batchSetFeatured = async (isFeatured: boolean) => {
  if (!selectedIds.value.size) return
  const action = isFeatured ? "设为推荐" : "取消推荐"
  const confirmed = window.confirm(`确认将 ${selectedIds.value.size} 个壁纸${action}？`)
  if (!confirmed) return

  try {
    batchLoading.value = true
    const ids = Array.from(selectedIds.value)
    await adminService.adminBatchSetFeatured(ids, isFeatured)
    showNotification(`已${action} ${ids.length} 个壁纸`)
    selectedIds.value.clear()
    await loadWallpapers()
  } catch (error) {
    console.error(`批量${action}失败:`, error)
    showNotification(`批量${action}失败`, "error")
  } finally {
    batchLoading.value = false
  }
}

const batchDeleteSelected = async () => {
  if (!selectedIds.value.size) return
  const confirmed = window.confirm(`确认删除 ${selectedIds.value.size} 个壁纸？删除后不可恢复。`)
  if (!confirmed) return

  try {
    batchLoading.value = true
    const ids = Array.from(selectedIds.value)
    await adminService.adminBatchDeleteWallpapers(ids)
    showNotification(`已删除 ${ids.length} 个壁纸`)
    selectedIds.value.clear()
    await loadWallpapers()
  } catch (error) {
    console.error("批量删除壁纸失败:", error)
    showNotification("批量删除失败", "error")
  } finally {
    batchLoading.value = false
  }
}

// 编辑壁纸标签
const openEditModal = (wallpaper: AdminWallpaper) => {
  editWallpaper.value = wallpaper
  editForm.tagsInput = (wallpaper.tags || [])
    .map((tag) => getTagLabel(tag))
    .filter(Boolean)
    .join(", ")
}

const closeEditModal = () => {
  editWallpaper.value = null
  editForm.tagsInput = ""
}

const submitEdit = async () => {
  if (!editWallpaper.value) return
  try {
    editLoading.value = true
    const tags = editForm.tagsInput
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
    await adminService.adminUpdateWallpaperTags(editWallpaper.value.id, { tags })
    showNotification("壁纸信息已更新")
    closeEditModal()
    await loadWallpapers()
  } catch (error) {
    console.error("更新壁纸信息失败:", error)
    showNotification("更新失败，请稍后重试", "error")
  } finally {
    editLoading.value = false
  }
}

onMounted(() => {
  loadWallpapers()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
