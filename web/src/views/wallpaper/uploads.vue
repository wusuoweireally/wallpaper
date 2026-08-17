<template>
  <div
    class="text-fg"
    :class="
      phase === 'finalize' ? 'uploads-fit overflow-hidden bg-canvas' : 'min-h-screen bg-canvas'
    "
  >
    <!-- ========== 步骤 1：选图上传 ========== -->
    <div
      v-if="phase === 'select' || phase === 'uploading' || phase === 'upload-done'"
      class="mx-auto max-w-5xl px-4 py-10"
    >
      <header class="mb-6">
        <ol class="mb-4 flex items-center gap-2 text-xs" aria-label="上传步骤">
          <li class="flex items-center gap-1.5 font-semibold text-primary">
            <span
              class="flex h-5 w-5 items-center justify-center rounded-full bg-primary-fill text-[11px] text-primary-content"
              >1</span
            >
            选图上传
          </li>
          <li class="h-px w-8 bg-line" aria-hidden="true"></li>
          <li class="flex items-center gap-1.5 text-faint">
            <span
              class="flex h-5 w-5 items-center justify-center rounded-full border border-line text-[11px]"
              >2</span
            >
            完善信息
          </li>
        </ol>
        <h1 class="text-xl font-semibold tracking-tight">上传壁纸</h1>
        <p class="mt-1 text-sm text-muted">
          支持 JPG / PNG / WebP · 单张 ≤ 32 MB · 分辨率 ≥ {{ MIN_WIDTH }} × {{ MIN_HEIGHT }}
        </p>
      </header>

      <!-- 拖拽区 -->
      <div
        role="button"
        tabindex="0"
        aria-label="选择或拖拽图片"
        class="relative cursor-pointer overflow-hidden rounded-panel border-2 border-dashed text-center outline-none transition-all duration-200 focus-visible:border-primary"
        :class="{
          'border-primary bg-primary/5': isDragging,
          'border-line bg-surface hover:border-muted/50': !isDragging,
          'p-14': !pendingFiles.length,
          'p-5': pendingFiles.length,
        }"
        @click="!isUploading && fileInput?.click()"
        @keydown.enter.prevent="!isUploading && fileInput?.click()"
        @keydown.space.prevent="!isUploading && fileInput?.click()"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- 空状态 -->
        <div v-if="!pendingFiles.length" class="flex flex-col items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-subtle text-faint">
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <div class="space-y-1">
            <p class="text-base font-semibold text-fg">拖拽图片到此处</p>
            <p class="text-sm text-faint">或点击下方按钮选择文件</p>
          </div>
          <span
            aria-hidden="true"
            class="wb-btn-primary inline-flex items-center gap-1.5 px-5 py-2 text-sm"
          >
            选择文件
          </span>
        </div>

        <!-- 已选文件网格 -->
        <div v-else class="text-left" @click.stop>
          <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <li
              v-for="(item, index) in pendingFiles"
              :key="item.id"
              class="group overflow-hidden rounded-card border bg-surface shadow-sm transition-all duration-200 hover:shadow-md"
              :class="{
                'border-success': item.status === 'done',
                'border-error': item.status === 'error' || item.validationError,
                'border-line':
                  item.status !== 'done' && !item.validationError && item.status !== 'error',
              }"
            >
              <div class="relative aspect-[4/3] bg-inset">
                <img :src="item.previewUrl" class="h-full w-full object-cover" alt="" />

                <!-- 左上状态点 -->
                <span
                  class="absolute left-2 top-2 h-2 w-2 rounded-full ring-2 ring-white/80"
                  :class="{
                    'bg-faint': item.status === 'pending',
                    'bg-primary': item.status === 'uploading',
                    'bg-success': item.status === 'done',
                    'bg-error': item.status === 'error' || item.validationError,
                  }"
                ></span>

                <!-- 上传中遮罩 -->
                <div
                  v-if="item.status === 'uploading'"
                  class="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]"
                >
                  <span class="font-mono text-lg font-semibold tabular-nums text-white"
                    >{{ item.progress }}%</span
                  >
                </div>

                <!-- 完成勾 -->
                <div
                  v-if="item.status === 'done'"
                  class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white shadow"
                >
                  <svg
                    class="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <!-- 删除按钮(hover 显示) -->
                <button
                  v-if="!isUploading && item.status !== 'done'"
                  type="button"
                  class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                  @click="removePendingFile(index)"
                >
                  <svg
                    class="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                  >
                    <path d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>

                <!-- 尺寸角标 -->
                <div
                  v-if="
                    item.width && item.height && !item.validationError && item.status !== 'error'
                  "
                  class="absolute bottom-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-white"
                >
                  {{ item.width }}×{{ item.height }}
                </div>
              </div>

              <!-- 文件信息 -->
              <div class="px-3 py-2">
                <div class="flex items-center justify-between gap-2">
                  <span class="min-w-0 truncate text-xs font-medium text-fg">{{
                    item.file.name
                  }}</span>
                  <span class="shrink-0 font-mono text-[11px] tabular-nums text-faint">{{
                    formatFileSize(item.file.size)
                  }}</span>
                </div>
                <!-- 进度条 -->
                <div
                  v-if="item.status === 'uploading'"
                  class="mt-2 h-1 overflow-hidden rounded-full bg-inset"
                >
                  <div
                    class="h-full rounded-full bg-primary-fill transition-all duration-150"
                    :style="{ width: item.progress + '%' }"
                  ></div>
                </div>
                <p v-else-if="item.validating" class="mt-1.5 text-[11px] text-faint">校验中…</p>
                <!-- 错误信息(前端校验 + 服务端错误)+ 重试 -->
                <div
                  v-if="item.validationError || item.errorMsg"
                  class="mt-1.5 flex items-start justify-between gap-2"
                >
                  <p class="text-[11px] leading-tight text-error">
                    {{ item.validationError || item.errorMsg }}
                  </p>
                  <button
                    v-if="item.status === 'error' && !item.validationError && !isUploading"
                    type="button"
                    class="shrink-0 text-[11px] font-medium text-muted transition-colors hover:text-fg"
                    @click="retryUpload(item)"
                  >
                    重试
                  </button>
                </div>
              </div>
            </li>
          </ul>

          <button
            v-if="!isUploading && phase !== 'upload-done'"
            type="button"
            class="mt-4 text-sm font-medium text-faint transition-colors hover:text-muted"
            @click="fileInput?.click()"
          >
            + 继续添加
          </button>
        </div>
      </div>

      <p v-if="errors.image" class="mt-3 text-sm text-error">{{ errors.image }}</p>

      <!-- 底栏 -->
      <div class="mt-6 flex flex-wrap items-center justify-end gap-3">
        <button
          v-if="isUploading"
          type="button"
          :class="btnOutline"
          @click="cancelRequested = true"
        >
          取消上传
        </button>
        <button
          v-if="pendingFiles.length && !isUploading"
          type="button"
          :class="btnOutline"
          @click="clearAllFiles"
        >
          {{ phase === "upload-done" ? "重新选图" : "清空" }}
        </button>
        <button
          v-if="phase === 'upload-done' && uploadResult?.failed && !isUploading"
          type="button"
          :class="btnOutline"
          @click="retryAllFailed"
        >
          重试失败 {{ uploadResult?.failed }} 张
        </button>
        <button
          v-if="phase !== 'upload-done'"
          type="button"
          :class="btnPrimary"
          :disabled="!canStartUpload"
          @click="handleUploadFiles"
        >
          <span v-if="isUploading" class="wb-spinner"></span>
          {{ isUploading ? `上传中 ${uploadedCount}/${uploadTotal}` : "审核并上传" }}
        </button>
        <button v-else type="button" :class="btnPrimary" @click="goFinalize">
          完善信息
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </button>
      </div>

      <p v-if="phase === 'upload-done' && uploadResult" class="mt-4 text-sm text-muted">
        成功 {{ uploadResult.success }} 张<template v-if="uploadResult.failed">
          · 失败 {{ uploadResult.failed }} 张</template
        >，未发布前他人不可见
      </p>
    </div>

    <!-- ========== 步骤 2：完善信息（布局对齐详情页：左栏 + 右大图） ========== -->
    <div
      v-else-if="phase === 'finalize'"
      class="relative flex h-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden"
    >
      <!-- 信息栏：桌面在左，移动端置底（先看图） -->
      <aside
        class="relative z-20 order-2 flex w-full shrink-0 flex-col border-t border-line bg-surface lg:order-none lg:h-full lg:w-[min(100%,20rem)] lg:border-r lg:border-t-0"
      >
        <div
          class="h-full overflow-visible px-3 pb-8 pt-3 lg:overflow-y-auto lg:overscroll-contain"
        >
          <!-- 返回 + 标题 + 步骤指示 -->
          <div class="mb-4 flex items-start justify-between gap-2">
            <div class="min-w-0">
              <ol class="mb-2 flex items-center gap-2 text-xs" aria-label="上传步骤">
                <li class="flex items-center gap-1 text-primary">
                  <i class="i-[mdi--check-circle] text-sm" aria-hidden="true"></i>
                  选图上传
                </li>
                <li class="h-px w-6 bg-line" aria-hidden="true"></li>
                <li class="flex items-center gap-1.5 font-semibold text-primary">
                  <span
                    class="flex h-5 w-5 items-center justify-center rounded-full bg-primary-fill text-[11px] text-primary-content"
                    >2</span
                  >
                  完善信息
                </li>
              </ol>
              <h1 class="text-base font-semibold tracking-tight">完善信息</h1>
              <p class="mt-0.5 text-xs text-muted">
                为 {{ uploadedDrafts.length }} 张壁纸选择分类与标签
              </p>
            </div>
            <button
              type="button"
              class="wb-btn-ghost wb-btn-xs shrink-0"
              @click="phase = 'upload-done'"
            >
              <svg
                class="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              返回
            </button>
          </div>

          <!-- 发布主按钮（对齐详情页收藏条位置） -->
          <div class="mb-4 space-y-1.5">
            <button
              type="button"
              class="wb-btn-primary w-full disabled:opacity-60"
              :disabled="publishing"
              @click="handlePublish"
            >
              <span v-if="publishing" class="wb-spinner"></span>
              {{ publishing ? "发布中…" : `发布 ${uploadedDrafts.length} 张壁纸` }}
            </button>
            <p class="text-center text-[11px] text-faint">发布后将对所有人公开</p>
            <p
              v-if="publishMsg"
              class="text-center text-xs font-medium"
              :class="publishOk ? 'text-success' : 'text-error'"
            >
              {{ publishMsg }}
            </p>
          </div>

          <!-- 分类 -->
          <section class="mb-4">
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-muted">分类</h2>
            <div class="flex overflow-hidden rounded-control border border-line">
              <button
                v-for="(c, i) in categories"
                :key="c.value"
                type="button"
                :aria-pressed="formData.category === c.value"
                class="flex-1 px-2 py-2 text-sm font-medium transition-colors"
                :class="[
                  formData.category === c.value
                    ? 'bg-primary-fill text-primary-content'
                    : 'text-muted hover:bg-subtle',
                  i > 0 ? 'border-l border-line' : '',
                ]"
                @click="formData.category = c.value"
              >
                {{ c.label }}
              </button>
            </div>
            <p v-if="errors.category" class="mt-1.5 text-xs text-error">{{ errors.category }}</p>
          </section>

          <!-- 标签 -->
          <section class="mb-4">
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-muted">标签</h2>

            <div v-if="selectedTags.length" class="mb-2 flex flex-wrap gap-1.5">
              <span
                v-for="tag in selectedTags"
                :key="tag"
                class="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                #{{ tag }}
                <button
                  type="button"
                  class="opacity-60 transition-opacity hover:opacity-100"
                  :aria-label="`移除标签 ${tag}`"
                  @click="removeTag(tag)"
                >
                  <svg
                    class="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                  >
                    <path d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              </span>
            </div>

            <div class="relative">
              <div class="flex gap-1.5">
                <input
                  v-model="tagSearch"
                  type="text"
                  maxlength="30"
                  placeholder="搜索或添加标签"
                  class="wb-input h-9 flex-1"
                  autocomplete="off"
                  @keyup.enter.prevent="onTagEnter"
                  @keydown.down.prevent="moveTagHighlight(1)"
                  @keydown.up.prevent="moveTagHighlight(-1)"
                  @keydown.esc="closeTagSuggest"
                  @focus="onTagFocus"
                  @blur="onTagBlur"
                />
                <button
                  type="button"
                  class="wb-btn h-9 w-9 shrink-0"
                  @mousedown.prevent="onTagEnter"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </button>
              </div>
              <ul
                v-if="showTagSuggest"
                ref="suggestListRef"
                class="absolute left-0 right-0 z-30 mt-1.5 max-h-56 overflow-y-auto rounded-card border border-line bg-surface py-1 shadow-xl"
              >
                <li
                  v-if="tagSuggestLoading"
                  class="flex items-center gap-2 px-3 py-2 text-xs text-faint"
                >
                  <span class="wb-spinner"></span>
                  搜索中…
                </li>
                <template v-else>
                  <li v-for="(s, idx) in tagSuggestions" :key="s.id" :data-idx="idx">
                    <button
                      type="button"
                      class="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition"
                      :class="
                        idx === tagHighlight ? 'bg-subtle text-fg' : 'text-muted hover:bg-subtle'
                      "
                      @mousedown.prevent="pickTagSuggestion(s.name)"
                    >
                      <span
                        class="font-medium"
                        v-html="highlightTagMatch(s.name, tagSearch)"
                      ></span>
                      <span class="text-[11px] tabular-nums text-faint">{{
                        s.usageCount ?? 0
                      }}</span>
                    </button>
                  </li>
                  <li v-if="!tagSuggestions.length && tagSearch.trim()">
                    <button
                      type="button"
                      class="w-full px-3 py-2 text-left text-sm text-muted hover:bg-subtle"
                      @mousedown.prevent="addCustomOrSelectTag"
                    >
                      创建「{{ normalizeTag(tagSearch) }}」
                    </button>
                  </li>
                  <li
                    v-else-if="
                      tagSearch.trim() &&
                      !tagSuggestions.some(
                        (s) => s.name.toLowerCase() === normalizeTag(tagSearch).toLowerCase(),
                      )
                    "
                  >
                    <button
                      type="button"
                      class="w-full border-t border-line/60 px-3 py-2 text-left text-xs text-muted hover:bg-subtle"
                      @mousedown.prevent="addCustomOrSelectTag"
                    >
                      + 使用「{{ normalizeTag(tagSearch) }}」
                    </button>
                  </li>
                </template>
              </ul>
            </div>
            <p v-if="errors.tags" class="mt-1.5 text-xs text-error">{{ errors.tags }}</p>

            <div v-if="hotTags.length" class="mt-3 flex flex-wrap gap-1.5">
              <button
                v-for="tag in hotTags"
                :key="tag"
                type="button"
                class="rounded-md border px-2 py-0.5 text-xs transition-all duration-150"
                :class="
                  selectedTags.includes(tag)
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-line text-muted hover:border-primary/40 hover:text-primary'
                "
                @click="toggleTag(tag)"
              >
                #{{ tag }}
              </button>
            </div>
          </section>

          <!-- 属性（当前预览图） -->
          <section v-if="previewDraft" class="mb-2">
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-muted">属性</h2>
            <dl class="space-y-2 text-sm">
              <div v-if="previewDraft.file.size > 0" class="flex items-center gap-2">
                <dt class="w-14 shrink-0 text-xs text-muted">文件</dt>
                <dd class="min-w-0 truncate text-fg">
                  {{ previewDraft.file.name }}
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt class="w-14 shrink-0 text-xs text-muted">尺寸</dt>
                <dd class="font-mono font-medium tabular-nums text-fg">
                  {{ previewDraft.width }} × {{ previewDraft.height }}
                </dd>
              </div>
              <div v-if="previewDraft.file.size > 0" class="flex items-center gap-2">
                <dt class="w-14 shrink-0 text-xs text-muted">大小</dt>
                <dd class="font-mono text-fg">
                  {{ formatFileSize(previewDraft.file.size) }}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </aside>

      <!-- 观图区：桌面在右，移动端置顶 -->
      <main
        class="relative order-1 flex min-h-[55vh] min-w-0 flex-1 flex-col overflow-hidden bg-inset lg:order-none lg:min-h-0"
      >
        <div class="relative flex min-h-0 flex-1 items-center justify-center p-4">
          <img
            v-if="previewDraft"
            :src="previewDraft.previewUrl"
            class="max-h-full max-w-full select-none object-contain"
            :alt="previewDraft.file.name"
            draggable="false"
          />
        </div>

        <!-- 多图时底部缩略切换 -->
        <div
          v-if="uploadedDrafts.length > 1"
          class="flex shrink-0 gap-2 overflow-x-auto border-t border-line bg-subtle px-3 py-2"
        >
          <button
            v-for="(item, idx) in uploadedDrafts"
            :key="item.id"
            type="button"
            class="h-14 w-20 shrink-0 overflow-hidden rounded-md ring-2 transition"
            :class="
              idx === previewIndex
                ? 'ring-primary'
                : 'opacity-70 ring-transparent hover:opacity-100 hover:ring-primary/40'
            "
            @click="previewIndex = idx"
          >
            <img :src="item.previewUrl" class="h-full w-full object-cover" alt="" />
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch, onUnmounted, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import { wallpaperService } from "@/services/wallpaper"
import tagService, { type Tag } from "@/services/tag"
import { useUserStore } from "@/stores/user"
import { useGlobalToast } from "@/composables/useToast"
import { formatFileSize } from "@/utils/format"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const toast = useGlobalToast()

const MIN_WIDTH = 1280
const MIN_HEIGHT = 800
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_TAGS = 5
const CONCURRENCY = 3

type Phase = "select" | "uploading" | "upload-done" | "finalize"

const phase = ref<Phase>("select")

const btnPrimary = "wb-btn-primary"
const btnOutline = "wb-btn"
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
/** 取消剩余上传队列（已完成的不受影响） */
const cancelRequested = ref(false)
const publishing = ref(false)
const uploadedCount = ref(0)
const uploadTotal = ref(0)
const uploadResult = ref<{ success: number; failed: number } | null>(null)
const publishMsg = ref("")
const publishOk = ref(false)

interface PendingFile {
  id: string
  file: File
  previewUrl: string
  status: "pending" | "uploading" | "done" | "error"
  progress: number
  errorMsg?: string
  width?: number
  height?: number
  validating?: boolean
  validationError?: string
  /** 服务端草稿 id */
  wallpaperId?: number
}

const pendingFiles = ref<PendingFile[]>([])
const formData = reactive({
  category: "general" as "general" | "anime" | "people",
})
const errors = reactive({ image: "", category: "", tags: "" })
const categories = [
  { value: "general" as const, label: "综合" },
  { value: "anime" as const, label: "动漫" },
  { value: "people" as const, label: "人物" },
]
const selectedTags = ref<string[]>([])
const hotTags = ref<string[]>([])
const tagsLoading = ref(false)
const tagSearch = ref("")
const tagSuggestions = ref<Tag[]>([])
const tagSuggestLoading = ref(false)
const tagHighlight = ref(0)
const tagPanelOpen = ref(false)
const suggestListRef = ref<HTMLUListElement | null>(null)
let tagSearchTimer: ReturnType<typeof setTimeout> | null = null

const showTagSuggest = computed(
  () =>
    tagPanelOpen.value &&
    !!tagSearch.value.trim() &&
    (tagSuggestLoading.value || tagSuggestions.value.length > 0 || !!normalizeTag(tagSearch.value)),
)

const pendingCount = computed(
  () =>
    pendingFiles.value.filter((f) => f.status === "pending" && !f.validationError && !f.validating)
      .length,
)
const canStartUpload = computed(
  () =>
    pendingCount.value > 0 && !isUploading.value && !pendingFiles.value.some((f) => f.validating),
)
const uploadedDrafts = computed(() =>
  pendingFiles.value.filter((f) => f.status === "done" && f.wallpaperId),
)

/** 完善信息页当前预览的草稿下标（多图时底部切换） */
const previewIndex = ref(0)
const previewDraft = computed(() => {
  const list = uploadedDrafts.value
  if (!list.length) return null
  const i = Math.min(Math.max(previewIndex.value, 0), list.length - 1)
  return list[i] ?? null
})

/** 文件头解析宽高（不解码整图） */
const readImageSizeFromHeader = async (file: File): Promise<{ width: number; height: number }> => {
  const buf = await file.slice(0, 256 * 1024).arrayBuffer()
  const view = new DataView(buf)
  const u8 = new Uint8Array(buf)

  if (u8.length >= 24 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) {
    return { width: view.getUint32(16), height: view.getUint32(20) }
  }

  if (u8.length > 4 && u8[0] === 0xff && u8[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < u8.length) {
      if (u8[offset] !== 0xff) {
        offset++
        continue
      }
      const marker = u8[offset + 1]
      if (marker === 0xff) {
        offset++
        continue
      }
      const isSof =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      if (isSof && offset + 8 < u8.length) {
        return {
          height: view.getUint16(offset + 5),
          width: view.getUint16(offset + 7),
        }
      }
      if (marker === 0xda || marker === 0xd9) break
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
        offset += 2
        continue
      }
      if (offset + 3 >= u8.length) break
      const segLen = view.getUint16(offset + 2)
      if (segLen < 2) break
      offset += 2 + segLen
    }
  }

  if (
    u8.length >= 30 &&
    u8[0] === 0x52 &&
    u8[1] === 0x49 &&
    u8[2] === 0x46 &&
    u8[3] === 0x46 &&
    u8[8] === 0x57 &&
    u8[9] === 0x45 &&
    u8[10] === 0x42 &&
    u8[11] === 0x50
  ) {
    let offset = 12
    while (offset + 8 <= u8.length) {
      const fourcc = String.fromCharCode(u8[offset], u8[offset + 1], u8[offset + 2], u8[offset + 3])
      const chunkSize = view.getUint32(offset + 4, true)
      const dataStart = offset + 8
      if (fourcc === "VP8X" && dataStart + 10 <= u8.length) {
        const w = 1 + (u8[dataStart + 4] | (u8[dataStart + 5] << 8) | (u8[dataStart + 6] << 16))
        const h = 1 + (u8[dataStart + 7] | (u8[dataStart + 8] << 8) | (u8[dataStart + 9] << 16))
        return { width: w, height: h }
      }
      if (fourcc === "VP8 " && dataStart + 10 <= u8.length) {
        const w = view.getUint16(dataStart + 6, true) & 0x3fff
        const h = view.getUint16(dataStart + 8, true) & 0x3fff
        if (w > 0 && h > 0) return { width: w, height: h }
      }
      if (fourcc === "VP8L" && dataStart + 5 <= u8.length && u8[dataStart] === 0x2f) {
        const b1 = u8[dataStart + 1]
        const b2 = u8[dataStart + 2]
        const b3 = u8[dataStart + 3]
        const b4 = u8[dataStart + 4]
        const w = 1 + (((b2 & 0x3f) << 8) | b1)
        const h = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6))
        return { width: w, height: h }
      }
      offset = dataStart + chunkSize + (chunkSize & 1)
    }
  }

  throw new Error("无法解析图片尺寸")
}

/** 始终改数组里的响应式对象，避免 push 后改原 plain object UI 不更新 */
const patchPending = (id: string, patch: Partial<PendingFile>) => {
  const row = pendingFiles.value.find((f) => f.id === id)
  if (!row) return
  Object.assign(row, patch)
}

const validatePendingFile = async (id: string, file: File) => {
  patchPending(id, { validating: true, validationError: undefined })
  try {
    if (!ALLOWED_MIME.has(file.type)) {
      patchPending(id, {
        validationError: "仅支持 JPG、PNG、WebP 格式",
        status: "error",
        validating: false,
      })
      return
    }
    if (file.size > 32 * 1024 * 1024) {
      patchPending(id, {
        validationError: "文件不能超过 32MB",
        status: "error",
        validating: false,
      })
      return
    }

    let width = 0
    let height = 0
    try {
      const size = await readImageSizeFromHeader(file)
      width = size.width
      height = size.height
    } catch {
      // 头解析失败再 fallback（少数奇怪编码）
      const bmp = await createImageBitmap(file)
      width = bmp.width
      height = bmp.height
      bmp.close()
    }

    if (!width || !height) {
      patchPending(id, {
        validationError: "无法读取图片尺寸",
        status: "error",
        validating: false,
      })
      return
    }

    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      patchPending(id, {
        width,
        height,
        validationError: `分辨率须 ≥ ${MIN_WIDTH}×${MIN_HEIGHT}（当前 ${width}×${height}）`,
        status: "error",
        validating: false,
      })
      return
    }

    // sha256 查重：选图阶段就判断，避免上传后才发现重复
    try {
      const buf = await file.arrayBuffer()
      const digest = await crypto.subtle.digest("SHA-256", buf)
      const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
      const dup = await wallpaperService.checkDuplicate(hash)
      if (dup.data?.exists) {
        patchPending(id, {
          width,
          height,
          validationError: `与壁纸 #${dup.data.id} 完全一致`,
          status: "error",
          validating: false,
        })
        return
      }
    } catch {
      // 查重失败不阻断上传，留给后端兜底
    }

    patchPending(id, { width, height, validating: false, validationError: undefined })
  } catch {
    patchPending(id, {
      validationError: "图片文件已损坏或无法读取",
      status: "error",
      validating: false,
    })
  }
}

const addFiles = (files: File[]) => {
  if (isUploading.value || phase.value === "finalize") return
  if (phase.value === "upload-done") phase.value = "select"
  const ids: string[] = []
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    pendingFiles.value.push({
      id,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
      validating: true,
    })
    ids.push(id)
    // 立刻校验；通过 id 写回响应式行（勿改 push 前的 plain 引用）
    void validatePendingFile(id, file)
  }
  errors.image = ""
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
  input.value = ""
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  if (event.dataTransfer?.files) addFiles(Array.from(event.dataTransfer.files))
}

const removePendingFile = (index: number) => {
  if (isUploading.value) return
  const item = pendingFiles.value[index]
  if (item) URL.revokeObjectURL(item.previewUrl)
  pendingFiles.value.splice(index, 1)
  if (!pendingFiles.value.length) phase.value = "select"
}

const clearAllFiles = () => {
  if (isUploading.value) return
  pendingFiles.value.forEach((item) => URL.revokeObjectURL(item.previewUrl))
  pendingFiles.value = []
  phase.value = "select"
  uploadResult.value = null
}

const uploadSingleFile = async (item: PendingFile): Promise<boolean> => {
  if (item.validationError) {
    item.status = "error"
    item.errorMsg = item.validationError
    return false
  }
  item.status = "uploading"
  item.progress = 0
  try {
    // 只传文件；类型/大小/分辨率/查重由后端完整校验 + 内容审核
    const { response } = await wallpaperService.uploadWallpaper(
      { file: item.file },
      (progressEvent) => {
        if (progressEvent.total) {
          item.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      },
    )
    const res = response as { success?: boolean; data?: { id: number }; message?: string }
    if (res.success && res.data?.id) {
      item.status = "done"
      item.progress = 100
      item.wallpaperId = res.data.id
      return true
    }
    throw new Error(res.message || "上传失败")
  } catch (error: unknown) {
    const err = error as Error & { userMessage?: string }
    item.status = "error"
    item.errorMsg = err.userMessage || err.message || "上传失败"
    item.progress = 0
    return false
  }
}

// 重试单张失败上传(仅服务端错误;前端校验失败需用户换图重新选择)
const retryUpload = async (item: PendingFile) => {
  if (item.validationError) return
  item.errorMsg = undefined
  await uploadSingleFile(item)
}

// 一次性重试所有服务端失败的图片:重置为 pending 后复用上传流程(并发队列 + 状态 + 统计)
const retryAllFailed = () => {
  pendingFiles.value
    .filter((f) => f.status === "error" && !f.validationError)
    .forEach((f) => {
      f.status = "pending"
      f.errorMsg = undefined
      f.progress = 0
    })
  handleUploadFiles()
}

const handleUploadFiles = async () => {
  errors.image = ""
  const ready = pendingFiles.value.filter(
    (f) => f.status === "pending" && !f.validationError && !f.validating,
  )
  if (!ready.length) {
    errors.image = pendingFiles.value.some((f) => f.validationError)
      ? "请移除不合格图片后再上传"
      : "请选择图片"
    return
  }
  if (!userStore.user?.id) {
    toast.warning("请先登录")
    return
  }

  phase.value = "uploading"
  isUploading.value = true
  const queueIds = ready.map((f) => f.id)
  uploadTotal.value = queueIds.length
  uploadedCount.value = 0
  let success = 0
  let failed = 0

  const runNext = async () => {
    while (queueIds.length && !cancelRequested.value) {
      const id = queueIds.shift()!
      const item = pendingFiles.value.find((f) => f.id === id)
      if (!item || item.status !== "pending") continue
      const ok = await uploadSingleFile(item)
      uploadedCount.value++
      if (ok) success++
      else failed++
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, Math.max(queueIds.length, 1)) }, () => runNext()),
  )

  isUploading.value = false
  if (cancelRequested.value) {
    cancelRequested.value = false
    toast.info("已取消剩余上传")
  }
  uploadResult.value = { success, failed }
  phase.value = "upload-done"
  if (success === 0) {
    toast.error("全部上传失败")
  } else {
    toast.success(`已上传 ${success} 张草稿`)
  }
}

const goFinalize = async () => {
  if (!uploadedDrafts.value.length) {
    toast.warning("没有成功上传的壁纸")
    return
  }
  previewIndex.value = 0
  phase.value = "finalize"
  await loadHotTags()
}

const loadHotTags = async () => {
  tagsLoading.value = true
  try {
    const res = await tagService.getTags({
      sortBy: "usageCount",
      sortOrder: "DESC",
      limit: 24,
    })
    hotTags.value = (res.data || []).map((t) => t.name)
  } catch {
    hotTags.value = []
  } finally {
    tagsLoading.value = false
  }
}

const normalizeTag = (tag: string) => tag.replace(/\s+/g, " ").trim().slice(0, 30)

/** 下拉高亮匹配片段（纯文本转义，只包一层 span） */
const highlightTagMatch = (name: string, q: string) => {
  const query = q.trim()
  if (!query) return escapeHtml(name)
  const lower = name.toLowerCase()
  const i = lower.indexOf(query.toLowerCase())
  if (i < 0) return escapeHtml(name)
  const before = escapeHtml(name.slice(0, i))
  const mid = escapeHtml(name.slice(i, i + query.length))
  const after = escapeHtml(name.slice(i + query.length))
  return `${before}<span class="text-primary">${mid}</span>${after}`
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const fetchTagSuggestions = async (keyword: string) => {
  const kw = keyword.trim()
  if (!kw) {
    tagSuggestions.value = []
    tagSuggestLoading.value = false
    return
  }
  tagSuggestLoading.value = true
  try {
    const res = await tagService.getTags({
      keyword: kw,
      limit: 10,
      sortBy: "usageCount",
      sortOrder: "DESC",
    })
    const selected = new Set(selectedTags.value.map((t) => t.toLowerCase()))
    tagSuggestions.value = (res.data || []).filter((t) => !selected.has(t.name.toLowerCase()))
    tagHighlight.value = 0
  } catch {
    tagSuggestions.value = []
  } finally {
    tagSuggestLoading.value = false
  }
}

watch(tagSearch, (value) => {
  if (tagSearchTimer) clearTimeout(tagSearchTimer)
  const kw = value.trim()
  if (!kw) {
    tagSuggestions.value = []
    tagSuggestLoading.value = false
    return
  }
  tagPanelOpen.value = true
  tagSearchTimer = setTimeout(() => fetchTagSuggestions(kw), 220)
})

const onTagFocus = () => {
  if (tagSearch.value.trim()) {
    tagPanelOpen.value = true
    void fetchTagSuggestions(tagSearch.value)
  }
}

const onTagBlur = () => {
  // 延迟关闭，便于 mousedown 选中项
  setTimeout(() => {
    tagPanelOpen.value = false
  }, 150)
}

const closeTagSuggest = () => {
  tagPanelOpen.value = false
  tagSuggestions.value = []
}

const moveTagHighlight = (delta: number) => {
  if (!tagSuggestions.value.length) return
  const n = tagSuggestions.value.length
  tagHighlight.value = (tagHighlight.value + delta + n) % n
  // 高亮项跟随滚动，避免滚出下拉视野
  void nextTick(() => {
    suggestListRef.value
      ?.querySelector(`[data-idx="${tagHighlight.value}"]`)
      ?.scrollIntoView({ block: "nearest" })
  })
}

const pickTagSuggestion = (name: string) => {
  addTag(name)
  tagSearch.value = ""
  tagSuggestions.value = []
  tagPanelOpen.value = false
}

const onTagEnter = () => {
  if (tagSuggestions.value.length && tagPanelOpen.value) {
    const pick = tagSuggestions.value[tagHighlight.value]
    if (pick) {
      pickTagSuggestion(pick.name)
      return
    }
  }
  addCustomOrSelectTag()
}

const addTag = (tag: string) => {
  const n = normalizeTag(tag)
  if (!n) return
  if (selectedTags.value.some((t) => t.toLowerCase() === n.toLowerCase())) {
    tagSearch.value = ""
    return
  }
  if (selectedTags.value.length >= MAX_TAGS) {
    errors.tags = `最多 ${MAX_TAGS} 个标签`
    return
  }
  selectedTags.value.push(n)
  errors.tags = ""
  tagSearch.value = ""
  tagSuggestions.value = []
  tagPanelOpen.value = false
}

const removeTag = (tag: string) => {
  selectedTags.value = selectedTags.value.filter((t) => t !== tag)
}

const toggleTag = (tag: string) => {
  if (selectedTags.value.includes(tag)) removeTag(tag)
  else addTag(tag)
}

const addCustomOrSelectTag = () => {
  addTag(tagSearch.value)
}

/** 有未落地的上传/发布时提醒，避免误关页面丢进度 */
const onBeforeUnload = (e: BeforeUnloadEvent) => {
  if (!isUploading.value && !publishing.value) return
  e.preventDefault()
}

onMounted(() => {
  window.addEventListener("beforeunload", onBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener("beforeunload", onBeforeUnload)
  if (tagSearchTimer) clearTimeout(tagSearchTimer)
})

const handlePublish = async () => {
  errors.category = ""
  errors.tags = ""
  publishMsg.value = ""
  if (!formData.category) {
    errors.category = "请选择分类"
    return
  }
  if (!selectedTags.value.length) {
    errors.tags = "请至少添加一个标签"
    return
  }
  const items = uploadedDrafts.value
    .filter((f) => f.wallpaperId)
    .map((f) => ({
      id: f.wallpaperId!,
      category: formData.category,
      tags: [...selectedTags.value],
    }))
  if (!items.length) {
    publishMsg.value = "没有可发布的壁纸"
    publishOk.value = false
    return
  }

  publishing.value = true
  try {
    const res = await wallpaperService.publishWallpapers(items)
    if (res.success) {
      publishOk.value = true
      publishMsg.value = `已发布 ${items.length} 张壁纸`
      toast.success(publishMsg.value)
      setTimeout(() => router.push("/user/uploads"), 800)
    } else {
      throw new Error(res.message || "发布失败")
    }
  } catch (e: unknown) {
    publishOk.value = false
    publishMsg.value = (e as Error).message || "发布失败"
    toast.error(publishMsg.value)
  } finally {
    publishing.value = false
  }
}

/**
 * 从个人中心「去发布」带入 ?drafts=1,2,3
 * 拉详情拼成已上传草稿，直接进入第二步
 */
const loadDraftsFromQuery = async () => {
  const raw = String(route.query.drafts || "").trim()
  if (!raw) return false
  const ids = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => n > 0)
  if (!ids.length) return false

  const items: PendingFile[] = []
  // 记录首张带分类/标签的草稿：仅单张带入时预填，多张时保持空白避免错配
  let prefillFrom: { category?: string; tags: string[] } | null = null
  for (const id of ids) {
    try {
      const res = await wallpaperService.getWallpaperDetail(id)
      if (!res.success || !res.data) continue
      const w = res.data
      // 已发布也可重新改分类标签再 publish
      items.push({
        id: `draft_${id}`,
        file: new File([], `wallpaper-${id}.${w.format || "png"}`),
        previewUrl: w.thumbnailUrl || w.fileUrl,
        status: "done",
        progress: 100,
        width: w.width,
        height: w.height,
        wallpaperId: w.id,
      })
      if (w.category || w.tags?.length) {
        prefillFrom ??= {
          category: w.category,
          tags: (w.tags || []).map((t) => t.name).slice(0, MAX_TAGS),
        }
      }
    } catch {
      /* skip */
    }
  }
  if (!items.length) {
    toast.warning("没有可发布的草稿")
    return false
  }
  if (items.length === 1 && prefillFrom) {
    // 单张草稿：预填已有分类/标签，用户只需确认发布
    if (prefillFrom.category) formData.category = prefillFrom.category as typeof formData.category
    if (prefillFrom.tags.length) selectedTags.value = prefillFrom.tags
  }
  pendingFiles.value = items
  previewIndex.value = 0
  phase.value = "finalize"
  await loadHotTags()
  return true
}

onMounted(async () => {
  const fromDrafts = await loadDraftsFromQuery()
  if (!fromDrafts) void loadHotTags()
})
</script>

<style scoped>
/* dvh 跟随移动端地址栏伸缩；旧浏览器回退 vh */
.uploads-fit {
  height: calc(100vh - 3.5rem);
  height: calc(100dvh - 3.5rem);
}
</style>
