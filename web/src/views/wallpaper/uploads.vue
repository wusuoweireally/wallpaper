<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <div
      class="mx-auto px-4 py-8 sm:py-10"
      :class="pendingFiles.length ? 'max-w-4xl' : 'max-w-2xl'"
    >
      <!-- 页头 -->
      <header class="mb-6 flex flex-wrap items-center gap-3 sm:gap-4">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-content shadow-md shadow-primary/25"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
            />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">上传壁纸</h1>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">选图 · 分类标签 · 一键发布</p>
        </div>
        <div class="hidden w-full items-center justify-end gap-1.5 sm:flex sm:w-auto">
          <span
            class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
            :class="
              pendingFiles.length
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
            "
          >
            <span
              class="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
              :class="
                pendingFiles.length
                  ? 'bg-primary text-primary-content'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              "
              >1</span
            >
            选图
          </span>
          <span class="text-slate-300 dark:text-slate-600">→</span>
          <span
            class="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
          >
            <span
              class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-content"
              >2</span
            >
            分类
          </span>
          <span class="text-slate-300 dark:text-slate-600">→</span>
          <span
            class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
            :class="
              selectedTags.length
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
            "
          >
            <span
              class="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
              :class="
                selectedTags.length
                  ? 'bg-primary text-primary-content'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              "
              >3</span
            >
            标签
          </span>
        </div>
      </header>

      <!-- 状态 -->
      <div
        v-if="uploadStatus"
        class="mb-4 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm"
        :class="{
          'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300':
            uploadStatus.type === 'success',
          'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300':
            uploadStatus.type === 'error',
          'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300':
            uploadStatus.type === 'info',
        }"
      >
        <span class="font-medium">{{ uploadStatus.message }}</span>
        <button
          v-if="uploadStatus.type === 'success'"
          type="button"
          class="btn btn-ghost btn-xs rounded-full"
          @click="resetForm"
        >
          继续上传
        </button>
      </div>

      <div
        class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/20 sm:p-7"
      >
        <!-- 1 选图 -->
        <section class="space-y-3">
          <div class="flex items-center gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary"
              >1</span
            >
            <h2 class="text-sm font-semibold">选择图片</h2>
          </div>

          <div
            class="relative cursor-pointer rounded-2xl border-2 border-dashed text-center transition-all duration-200"
            :class="{
              'border-primary bg-primary/5 shadow-[0_0_0_4px] shadow-primary/10': isDragging,
              'border-error bg-error/5': errors.image && !isDragging,
              'border-slate-200 bg-slate-50/80 hover:border-primary/50 hover:bg-primary/[0.03] dark:border-slate-600 dark:bg-slate-900/40 dark:hover:border-primary/40':
                !isDragging && !errors.image,
              'p-8': !pendingFiles.length,
              'p-3 sm:p-4': pendingFiles.length,
            }"
            @click="fileInput?.click()"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleFileSelect"
            />

            <div v-if="!pendingFiles.length" class="flex flex-col items-center gap-3">
              <div
                class="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-md ring-1 ring-primary/20 dark:bg-slate-800"
              >
                <svg class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path
                    d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-base font-semibold text-slate-800 dark:text-slate-100">
                  {{ isDragging ? "松开即可添加" : "拖拽或点击选择图片" }}
                </p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  JPG / PNG / WEBP · 单张 ≤ 50MB · 可多选
                </p>
              </div>
              <div class="mt-1 flex flex-wrap justify-center gap-2">
                <span
                  class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                >
                  推荐 1080p+
                </span>
                <span
                  class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                >
                  健康合规
                </span>
              </div>
            </div>

            <div v-else class="space-y-3 text-left" @click.stop>
              <div class="flex items-center justify-between gap-2 px-0.5">
                <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  已选 <span class="text-primary">{{ pendingFiles.length }}</span> 张
                  <span
                    v-if="doneCount || errorCount || uploadingCount"
                    class="ml-1.5 text-xs font-normal text-slate-400"
                  >
                    <template v-if="doneCount">· 完成 {{ doneCount }}</template>
                    <template v-if="uploadingCount"> · 上传中 {{ uploadingCount }}</template>
                    <template v-if="errorCount"> · 失败 {{ errorCount }}</template>
                  </span>
                </p>
                <div class="flex gap-1">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-full"
                    :disabled="isUploading"
                    @click="fileInput?.click()"
                  >
                    + 继续添加
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-full text-error"
                    :disabled="isUploading"
                    @click="clearAllFiles"
                  >
                    清空
                  </button>
                </div>
              </div>

              <!-- 网格卡片：多图时更省空间 -->
              <ul
                class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              >
                <li
                  v-for="(item, index) in pendingFiles"
                  :key="item.id"
                  class="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition dark:bg-slate-900/60"
                  :class="{
                    'border-emerald-300 dark:border-emerald-700': item.status === 'done',
                    'border-red-300 dark:border-red-800': item.status === 'error',
                    'border-primary/50': item.status === 'uploading',
                    'border-slate-200 dark:border-slate-600': item.status === 'pending',
                  }"
                >
                  <div class="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                    <img
                      :src="item.previewUrl"
                      :alt="item.file.name"
                      class="h-full w-full object-cover"
                    />
                    <!-- 上传进度遮罩 -->
                    <div
                      v-if="item.status === 'uploading'"
                      class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/45 px-2"
                    >
                      <div
                        class="h-1.5 w-full max-w-[80%] overflow-hidden rounded-full bg-white/25"
                      >
                        <div
                          class="h-full rounded-full bg-white transition-all"
                          :style="{ width: item.progress + '%' }"
                        ></div>
                      </div>
                      <span class="text-[11px] font-semibold text-white tabular-nums"
                        >{{ item.progress }}%</span
                      >
                    </div>
                    <!-- 完成/失败角标 -->
                    <span
                      v-if="item.status === 'done'"
                      class="absolute left-1.5 top-1.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
                    >
                      完成
                    </span>
                    <span
                      v-else-if="item.status === 'error'"
                      class="absolute left-1.5 top-1.5 max-w-[calc(100%-2rem)] truncate rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
                      :title="item.errorMsg || '失败'"
                    >
                      失败
                    </span>
                    <button
                      v-if="
                        !isUploading && (item.status === 'pending' || item.status === 'error')
                      "
                      type="button"
                      class="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
                      title="移除"
                      @click="removePendingFile(index)"
                    >
                      ✕
                    </button>
                  </div>
                  <div class="space-y-0.5 px-2 py-1.5">
                    <p class="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                      {{ item.file.name }}
                    </p>
                    <p class="text-[11px] text-slate-400">{{ formatFileSize(item.file.size) }}</p>
                    <p
                      v-if="item.status === 'error'"
                      class="truncate text-[11px] text-error"
                      :title="item.errorMsg"
                    >
                      {{ item.errorMsg || "上传失败" }}
                    </p>
                  </div>
                </li>

                <!-- 末尾快捷添加格 -->
                <li v-if="!isUploading">
                  <button
                    type="button"
                    class="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 text-slate-400 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:border-slate-600 dark:bg-slate-900/40"
                    @click="fileInput?.click()"
                  >
                    <span class="text-xl leading-none">+</span>
                    <span class="text-[11px] font-medium">添加</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <p v-if="errors.image" class="text-sm text-error">{{ errors.image }}</p>
        </section>

        <div class="h-px bg-slate-100 dark:bg-slate-700"></div>

        <!-- 2 分类 -->
        <section class="space-y-3">
          <div class="flex items-center gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary"
              >2</span
            >
            <h2 class="text-sm font-semibold">选择分类</h2>
          </div>
          <div class="grid grid-cols-3 gap-2.5">
            <button
              v-for="category in categories"
              :key="category.value"
              type="button"
              class="flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-3.5 text-sm font-medium transition-all"
              :class="
                formData.category === category.value
                  ? 'border-primary bg-primary text-primary-content shadow-md shadow-primary/25'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/40 hover:bg-white dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-primary/40'
              "
              @click="formData.category = category.value"
            >
              <span class="text-lg leading-none" aria-hidden="true">{{ category.emoji }}</span>
              <span>{{ category.label }}</span>
            </button>
          </div>
        </section>

        <div class="h-px bg-slate-100 dark:bg-slate-700"></div>

        <!-- 3 标签 -->
        <section class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary"
                >3</span
              >
              <h2 class="text-sm font-semibold">添加标签</h2>
              <span class="text-xs text-slate-400">至少 1 个 · 可自定义</span>
            </div>
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
              :class="
                selectedTags.length
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400'
              "
            >
              {{ selectedTags.length }}/{{ MAX_TAGS }}
            </span>
          </div>

          <!-- 已选标签 + 输入一体 -->
          <div
            class="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3 transition focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-[0_0_0_3px] focus-within:shadow-primary/10 dark:border-slate-600 dark:bg-slate-900/40 dark:focus-within:bg-slate-900"
          >
            <div class="mb-2 flex min-h-[28px] flex-wrap items-center gap-1.5">
              <span
                v-for="tag in selectedTags"
                :key="tag"
                class="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-content shadow-sm shadow-primary/20"
              >
                #{{ tag }}
                <button
                  type="button"
                  class="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] leading-none hover:bg-white/30"
                  :aria-label="`移除 ${tag}`"
                  @click="removeTag(tag)"
                >
                  ×
                </button>
              </span>
              <span v-if="!selectedTags.length" class="text-xs text-slate-400">
                点选下方常用标签，或输入后回车
              </span>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="tagSearch"
                type="text"
                maxlength="30"
                placeholder="输入标签，回车添加（可新建）"
                class="min-w-0 flex-1 border-0 bg-transparent px-1 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-slate-100"
                @keyup.enter.prevent="addCustomOrSelectTag"
              />
              <button
                type="button"
                class="shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition"
                :class="
                  canAddFromInput
                    ? 'bg-primary text-primary-content shadow-sm shadow-primary/25 hover:brightness-110'
                    : 'cursor-not-allowed bg-slate-200/80 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                "
                :disabled="!canAddFromInput"
                @click="addCustomOrSelectTag"
              >
                添加
              </button>
            </div>
          </div>

          <div v-if="tagSearch.trim()" class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in tagSuggestions"
              :key="tag.id"
              type="button"
              class="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10"
              @click="addTag(tag.name); tagSearch = ''; tagSuggestions = []"
            >
              + {{ tag.name }}
            </button>
            <button
              v-if="showCreateCustomHint"
              type="button"
              class="rounded-full border border-dashed border-primary/50 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
              @click="addCustomOrSelectTag"
            >
              + 创建「{{ normalizeTag(tagSearch) }}」
            </button>
          </div>

          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <p class="text-xs font-medium text-slate-400">常用标签</p>
              <button
                v-if="recommendedTags.length > 0 || tagsLoading"
                type="button"
                class="text-xs text-slate-400 transition hover:text-primary"
                :disabled="tagsLoading"
                @click="loadRecommendedTags"
              >
                {{ tagsLoading ? "加载中…" : "刷新" }}
              </button>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="tag in recommendedTags.slice(0, 24)"
                :key="tag"
                type="button"
                class="rounded-full border px-2.5 py-1 text-xs font-medium transition"
                :class="
                  selectedTags.includes(tag)
                    ? 'border-primary bg-primary text-primary-content shadow-sm shadow-primary/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300'
                "
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
          <p v-if="errors.tags" class="text-sm text-error">{{ errors.tags }}</p>
        </section>

        <!-- 进度 -->
        <div
          v-if="isUploading"
          class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900/40"
        >
          <div class="flex justify-between text-xs text-slate-500">
            <span>上传中 {{ uploadedCount }}/{{ pendingFiles.length }}</span>
            <span class="font-semibold text-primary">{{ overallProgress }}%</span>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              class="h-full rounded-full bg-primary transition-all"
              :style="{ width: overallProgress + '%' }"
            ></div>
          </div>
        </div>

        <div
          v-if="uploadResult"
          class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-900/40"
        >
          <span>
            成功 <strong class="text-success">{{ uploadResult.success }}</strong>
            <template v-if="uploadResult.failed">
              · 失败 <strong class="text-error">{{ uploadResult.failed }}</strong>
            </template>
          </span>
          <button
            type="button"
            class="rounded-full px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            @click="resetForm"
          >
            继续上传
          </button>
        </div>

        <!-- 操作 -->
        <div
          class="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 dark:border-slate-700 sm:flex-row sm:items-center"
        >
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            @click="$router.back()"
          >
            返回
          </button>
          <button
            type="button"
            class="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition"
            :class="
              !canStartUpload
                ? 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                : 'bg-primary text-primary-content shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.99]'
            "
            :disabled="!canStartUpload"
            @click="handleSubmit"
          >
            <svg
              v-if="canStartUpload"
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"
              />
            </svg>
            <span
              v-if="loading || isUploading"
              class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            ></span>
            {{
              loading || isUploading
                ? `上传中 (${uploadedCount}/${pendingCount || pendingFiles.length})`
                : pendingCount
                  ? `上传 ${pendingCount} 张壁纸`
                  : pendingFiles.length
                    ? "没有待上传的文件"
                    : "选择图片后上传"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from "vue"
import { wallpaperService } from "@/services/wallpaper"
import tagService, { type Tag } from "@/services/tag"
import { useUserStore } from "@/stores/user"

const userStore = useUserStore()
const fileInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadStatus = ref<{ type: string; message: string } | null>(null)

const overallProgress = computed(() => {
  if (!pendingFiles.value.length) return 0
  const total = pendingFiles.value.reduce((sum, f) => sum + f.progress, 0)
  return Math.round(total / pendingFiles.value.length)
})

const doneCount = computed(() => pendingFiles.value.filter((f) => f.status === "done").length)
const errorCount = computed(() => pendingFiles.value.filter((f) => f.status === "error").length)
const uploadingCount = computed(
  () => pendingFiles.value.filter((f) => f.status === "uploading").length,
)
const pendingCount = computed(
  () => pendingFiles.value.filter((f) => f.status === "pending").length,
)
const canStartUpload = computed(() => pendingCount.value > 0 && !loading.value && !isUploading.value)

const currentUserId = computed(() => userStore.user?.id || 0)

interface PendingFile {
  id: string
  file: File
  previewUrl: string
  status: "pending" | "uploading" | "done" | "error"
  progress: number
  errorMsg?: string
}

const pendingFiles = ref<PendingFile[]>([])
const uploadedCount = ref(0)
const uploadResult = ref<{ success: number; failed: number } | null>(null)

const formData = reactive({
  category: "general",
  tags: [] as string[],
})

const errors = reactive({
  image: "",
  category: "",
  tags: "",
})

const recommendedTags = ref<string[]>([])
const tagSuggestions = ref<Tag[]>([])
const tagSearch = ref("")
const MAX_TAG_LENGTH = 30
const MAX_TAGS = 5
const tagsLoading = ref(false)

const categories = [
  { value: "general", label: "综合", emoji: "▦" },
  { value: "anime", label: "动漫", emoji: "✦" },
  { value: "people", label: "人物", emoji: "◎" },
]

const selectedTags = ref<string[]>([])
const availableTagNames = computed(
  () => new Set([...recommendedTags.value, ...tagSuggestions.value.map((tag) => tag.name)]),
)

const normalizeTag = (tag: string) => tag.replace(/\s+/g, " ").trim().slice(0, MAX_TAG_LENGTH)

const canAddFromInput = computed(() => {
  const n = normalizeTag(tagSearch.value)
  return n.length > 0 && selectedTags.value.length < MAX_TAGS
})

const showCreateCustomHint = computed(() => {
  const n = normalizeTag(tagSearch.value)
  if (!n) return false
  if (selectedTags.value.some((t) => t.toLowerCase() === n.toLowerCase())) return false
  const exists = [...availableTagNames.value].some((t) => t.toLowerCase() === n.toLowerCase())
  return !exists
})

const addTag = (tag: string) => {
  const normalized = normalizeTag(tag)
  if (!normalized) return
  if (selectedTags.value.some((t) => t.toLowerCase() === normalized.toLowerCase())) {
    errors.tags = ""
    return
  }
  if (selectedTags.value.length >= MAX_TAGS) {
    errors.tags = `最多选择 ${MAX_TAGS} 个标签`
    return
  }
  selectedTags.value.push(normalized)
  formData.tags = [...selectedTags.value]
  errors.tags = ""
}

const removeTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index !== -1) {
    selectedTags.value.splice(index, 1)
    formData.tags = [...selectedTags.value]
  }
}

const toggleTag = (tag: string) => {
  const normalized = normalizeTag(tag)
  const existing = selectedTags.value.find((t) => t.toLowerCase() === normalized.toLowerCase())
  if (existing) removeTag(existing)
  else addTag(normalized)
}

const addCustomOrSelectTag = () => {
  const keyword = normalizeTag(tagSearch.value)
  if (!keyword) return

  const exactExisting = [...availableTagNames.value].find(
    (tag) => tag.toLowerCase() === keyword.toLowerCase(),
  )
  const alreadySelected = selectedTags.value.find((t) => t.toLowerCase() === keyword.toLowerCase())
  if (alreadySelected) {
    errors.tags = ""
    tagSearch.value = ""
    tagSuggestions.value = []
    return
  }

  addTag(exactExisting || keyword)
  tagSearch.value = ""
  tagSuggestions.value = []
}

const loadRecommendedTags = async () => {
  tagsLoading.value = true
  try {
    const response = await tagService.getTags({
      sortBy: "createdAt",
      sortOrder: "DESC",
      limit: 60,
    })
    const serverTags = response.data || []
    recommendedTags.value = Array.isArray(serverTags)
      ? Array.from(new Set(serverTags.map((tag) => tag.name)))
      : []
  } catch (error) {
    console.error("加载推荐标签失败:", error)
    recommendedTags.value = []
  } finally {
    tagsLoading.value = false
  }
}

const fetchTagSuggestions = async (keyword: string) => {
  const value = keyword.trim()
  if (!value) {
    tagSuggestions.value = []
    return
  }
  try {
    const response = await tagService.getTags({ keyword: value, limit: 6 })
    tagSuggestions.value =
      response.data?.filter((tag) => !selectedTags.value.includes(tag.name)) || []
  } catch (error) {
    console.error("获取标签建议失败:", error)
  }
}

watch(
  () => tagSearch.value,
  (value) => {
    if (value.trim()) fetchTagSuggestions(value)
    else tagSuggestions.value = []
  },
)

onMounted(() => {
  loadRecommendedTags()
})

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  if (event.dataTransfer?.files) addFiles(Array.from(event.dataTransfer.files))
}

const addFiles = (files: File[]) => {
  if (isUploading.value) return
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue
    if (file.size > 50 * 1024 * 1024) continue
    pendingFiles.value.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
    })
  }
  errors.image = ""
  if (pendingFiles.value.length) {
    uploadResult.value = null
    uploadStatus.value = null
  }
}

const removePendingFile = (index: number) => {
  if (isUploading.value) return
  const item = pendingFiles.value[index]
  if (item) URL.revokeObjectURL(item.previewUrl)
  pendingFiles.value.splice(index, 1)
}

const clearAllFiles = () => {
  if (isUploading.value) return
  pendingFiles.value.forEach((item) => URL.revokeObjectURL(item.previewUrl))
  pendingFiles.value = []
  if (fileInput.value) fileInput.value.value = ""
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const validateForm = (): boolean => {
  errors.image = ""
  errors.tags = ""
  errors.category = ""
  let isValid = true
  if (!pendingFiles.value.some((f) => f.status === "pending")) {
    errors.image = "请选择待上传的图片"
    isValid = false
  }
  if (selectedTags.value.length === 0) {
    errors.tags = "请至少选择一个标签"
    isValid = false
  }
  return isValid
}

const CONCURRENCY = 3

const uploadSingleFile = async (item: PendingFile): Promise<boolean> => {
  item.status = "uploading"
  item.progress = 0
  try {
    const { response } = await wallpaperService.uploadWallpaper(
      {
        file: item.file,
        category: formData.category,
        tags: formData.tags,
      },
      (progressEvent) => {
        if (progressEvent.total) {
          item.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      },
    )
    if ((response as { success?: boolean }).success) {
      item.status = "done"
      item.progress = 100
      return true
    }
    throw new Error((response as { message?: string }).message || "上传失败")
  } catch (error: unknown) {
    const err = error as Error & { message?: string }
    item.status = "error"
    item.errorMsg = err.message || "上传失败"
    item.progress = 0
    return false
  }
}

const batchUpload = async () => {
  // 用稳定 id 排队；每轮从 pendingFiles 取活项，已移除的跳过
  const queueIds = pendingFiles.value
    .filter((f) => f.status === "pending")
    .map((f) => f.id)
  uploadedCount.value = 0
  let successCount = 0
  let failedCount = 0

  const runNext = async () => {
    while (queueIds.length > 0) {
      const id = queueIds.shift()!
      const item = pendingFiles.value.find((f) => f.id === id)
      if (!item || item.status !== "pending") continue
      const ok = await uploadSingleFile(item)
      uploadedCount.value++
      if (ok) successCount++
      else failedCount++
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, Math.max(queueIds.length, 1)) }, () => runNext()),
  )
  return { success: successCount, failed: failedCount }
}

const handleSubmit = async () => {
  if (!validateForm()) return
  loading.value = true
  isUploading.value = true
  uploadStatus.value = null
  uploadResult.value = null

  pendingFiles.value.forEach((f) => {
    if (f.status !== "done") {
      f.status = "pending"
      f.progress = 0
      f.errorMsg = undefined
    }
  })

  try {
    if (!currentUserId.value) throw new Error("请先登录")
    const result = await batchUpload()
    uploadResult.value = result
    if (result.failed === 0) {
      uploadStatus.value = { type: "success", message: `全部 ${result.success} 张上传成功` }
    } else if (result.success > 0) {
      uploadStatus.value = {
        type: "info",
        message: `成功 ${result.success} 张，失败 ${result.failed} 张`,
      }
    } else {
      uploadStatus.value = { type: "error", message: `全部 ${result.failed} 张上传失败` }
    }
  } catch (error: unknown) {
    const err = error as Error & { message?: string }
    console.error("上传失败:", err)
    uploadStatus.value = { type: "error", message: err.message || "上传失败，请重试" }
  } finally {
    loading.value = false
    isUploading.value = false
  }
}

const resetForm = () => {
  clearAllFiles()
  formData.category = "general"
  formData.tags = []
  errors.image = ""
  errors.tags = ""
  errors.category = ""
  selectedTags.value = []
  tagSearch.value = ""
  tagSuggestions.value = []
  uploadStatus.value = null
  uploadResult.value = null
  isUploading.value = false
  uploadedCount.value = 0
}
</script>
