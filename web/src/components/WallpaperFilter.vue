<template>
  <!-- 横向工具条:胶囊直接趴在画布上(无卡片壳),分类 toggle + 面板筛选 + 排序 -->
  <div ref="rootRef" class="px-0.5 py-1" @click="onRootClick">
    <div class="flex flex-col gap-2.5">
      <div class="flex min-w-0 flex-wrap items-center gap-1.5">
        <!-- 分类分段 -->
        <div class="seg-group" role="group" aria-label="分类">
          <button
            v-for="c in CATEGORIES"
            :key="c.value || 'all'"
            type="button"
            class="seg-btn"
            :class="{ 'seg-btn--on': props.modelValue.category === c.value }"
            @click="setCategory(c.value)"
          >
            {{ c.label }}
          </button>
        </div>

        <!-- 分辨率面板 -->
        <div class="wb-drop">
          <div
            tabindex="0"
            role="button"
            class="filter-pill"
            :class="{ 'filter-pill--active': resActive }"
          >
            <i class="filter-ico i-[mdi--image-size-select-large]"></i>
            <span>分辨率</span>
            <span v-if="resLabel !== '全部'" class="max-w-[6rem] truncate opacity-80">{{
              resLabel
            }}</span>
            <i class="filter-chevron i-[mdi--chevron-down]"></i>
          </div>
          <div
            tabindex="0"
            class="wb-drop-panel filter-panel z-[40] mt-2 w-[min(100vw-1.5rem,28rem)] p-3"
          >
            <!-- data-keep-open：切换模式后不收起面板，便于继续选择 -->
            <div data-keep-open class="mb-2 flex gap-1 rounded-lg bg-subtle/80 p-1">
              <button
                type="button"
                class="flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition"
                :class="
                  props.modelValue.resolutionMode === 'atLeast'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-muted'
                "
                @click="setResMode('atLeast')"
              >
                至少
              </button>
              <button
                type="button"
                class="flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition"
                :class="
                  props.modelValue.resolutionMode === 'exact'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-muted'
                "
                @click="setResMode('exact')"
              >
                精确
              </button>
              <button
                type="button"
                class="flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition"
                :class="
                  props.modelValue.resolutionMode === 'custom'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-muted'
                "
                @click="setResMode('custom')"
              >
                自定义
              </button>
            </div>

            <p v-if="screenHint" class="mb-2 text-[11px] text-muted">本机屏幕约 {{ screenHint }}</p>

            <template v-if="props.modelValue.resolutionMode === 'atLeast'">
              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  class="chip"
                  :class="{ 'chip--on': !props.modelValue.resolution }"
                  @click="pickAtLeast('')"
                >
                  全部
                </button>
                <button
                  v-for="(tier, key) in RESOLUTION_TIERS"
                  :key="key"
                  type="button"
                  class="chip"
                  :class="{ 'chip--on': props.modelValue.resolution === key }"
                  @click="pickAtLeast(key)"
                >
                  {{ tier.label }}
                </button>
              </div>
            </template>

            <template v-else-if="props.modelValue.resolutionMode === 'exact'">
              <div class="max-h-56 space-y-2 overflow-y-auto">
                <div v-for="g in EXACT_RESOLUTION_GROUPS" :key="g.label">
                  <p class="mb-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {{ g.label }}
                  </p>
                  <div class="flex flex-wrap gap-1">
                    <button
                      v-for="er in g.items"
                      :key="er"
                      type="button"
                      class="chip chip--sm tabular-nums"
                      :class="{ 'chip--on': props.modelValue.exactResolution === er }"
                      @click="pickExact(er)"
                    >
                      {{ er.replace("x", "×") }}
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  min="320"
                  placeholder="宽"
                  class="wb-input w-full"
                  :value="props.modelValue.customWidth"
                  @input="onCustomW"
                />
                <span class="text-muted">×</span>
                <input
                  type="number"
                  min="320"
                  placeholder="高"
                  class="wb-input w-full"
                  :value="props.modelValue.customHeight"
                  @input="onCustomH"
                />
              </div>
              <p class="mt-1.5 text-[11px] text-muted">按「至少」该宽高筛选</p>
            </template>
          </div>
        </div>

        <!-- 比例面板 -->
        <div class="wb-drop">
          <div
            tabindex="0"
            role="button"
            class="filter-pill"
            :class="{ 'filter-pill--active': !!props.modelValue.ratio || isOrientRatio }"
          >
            <i class="filter-ico i-[mdi--aspect-ratio]"></i>
            <span>比例</span>
            <span v-if="ratioLabel !== '全部'" class="opacity-80">{{ ratioLabel }}</span>
            <i class="filter-chevron i-[mdi--chevron-down]"></i>
          </div>
          <div
            tabindex="0"
            class="wb-drop-panel filter-panel z-[40] mt-2 w-[min(100vw-1.5rem,26rem)] p-3"
          >
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div v-for="g in RATIO_GROUPS" :key="g.label">
                <p class="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {{ g.label }}
                </p>
                <div class="flex flex-col gap-1">
                  <button
                    v-for="item in g.items"
                    :key="item.value"
                    type="button"
                    class="chip chip--block"
                    :class="{ 'chip--on': isRatioSelected(item.value) }"
                    @click="pickRatio(item.value)"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              class="mt-2 text-xs text-muted underline-offset-2 hover:text-primary hover:underline"
              @click="clearRatio"
            >
              清除比例
            </button>
          </div>
        </div>

        <!-- 颜色面板 -->
        <div class="wb-drop">
          <div
            tabindex="0"
            role="button"
            class="filter-pill"
            :class="{ 'filter-pill--active': !!props.modelValue.color }"
          >
            <i class="filter-ico i-[mdi--palette-outline]"></i>
            <span>颜色</span>
            <span
              v-if="props.modelValue.color"
              class="h-3 w-3 rounded-full ring-1 ring-line"
              :style="{ background: colorSwatch }"
            ></span>
            <i class="filter-chevron i-[mdi--chevron-down]"></i>
          </div>
          <div tabindex="0" class="wb-drop-panel filter-panel z-[40] mt-2 w-56 p-3">
            <div class="grid grid-cols-6 gap-2">
              <button
                v-for="c in COLOR_CHIPS"
                :key="c.value"
                type="button"
                class="h-7 w-7 rounded-md ring-2 transition"
                :class="
                  props.modelValue.color === c.value
                    ? 'scale-110 ring-primary'
                    : 'ring-line hover:ring-line'
                "
                :style="{ background: c.swatch }"
                :title="c.label"
                @click="
                  updateFilters({
                    color: props.modelValue.color === c.value ? '' : c.value,
                  })
                "
              />
              <button
                type="button"
                class="relative h-7 w-7 overflow-hidden rounded-md bg-surface ring-2 ring-line"
                title="清除颜色"
                @click="updateFilters({ color: '' })"
              >
                <span
                  class="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent"
                ></span>
                <span
                  class="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 rotate-45 bg-error/80"
                ></span>
              </button>
            </div>
          </div>
        </div>

        <!-- 排序 -->
        <div class="wb-drop">
          <div
            tabindex="0"
            role="button"
            class="filter-pill"
            :class="{ 'filter-pill--active': props.modelValue.sortBy !== 'latest' }"
          >
            <i class="filter-ico i-[mdi--sort-variant]"></i>
            <span>{{ getSortLabel(props.modelValue.sortBy) }}</span>
            <i class="filter-chevron i-[mdi--chevron-down]"></i>
          </div>
          <ul tabindex="0" class="wb-drop-panel filter-menu z-[40]">
            <li v-for="option in SORT_OPTIONS" :key="option.value">
              <a
                class="rounded-lg"
                :class="{ active: props.modelValue.sortBy === option.value }"
                @click="updateSort(option.value)"
              >
                {{ option.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 排行榜时间窗 -->
        <div v-if="props.modelValue.sortBy === 'toplist'" class="wb-drop">
          <div tabindex="0" role="button" class="filter-pill filter-pill--active">
            <i class="filter-ico i-[mdi--calendar-range]"></i>
            <span>{{ topRangeLabel }}</span>
            <i class="filter-chevron i-[mdi--chevron-down]"></i>
          </div>
          <ul tabindex="0" class="wb-drop-panel filter-menu z-[40]">
            <li v-for="r in TOP_RANGES" :key="r.value">
              <a
                class="rounded-lg"
                :class="{ active: props.modelValue.topRange === r.value }"
                @click="updateFilters({ topRange: r.value })"
              >
                {{ r.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- 升降序（热门/排行/随机无效时仍可点，API 对部分 sort 强制 DESC） -->
        <button
          type="button"
          class="filter-pill"
          :class="{ 'filter-pill--active': props.modelValue.sortOrder === 'ASC' }"
          :title="props.modelValue.sortOrder === 'DESC' ? '降序' : '升序'"
          @click="toggleOrder"
        >
          <i
            class="filter-ico"
            :class="
              props.modelValue.sortOrder === 'DESC'
                ? 'i-[mdi--sort-descending]'
                : 'i-[mdi--sort-ascending]'
            "
          ></i>
        </button>

        <!-- 格式（次要） -->
        <div class="wb-drop">
          <div
            tabindex="0"
            role="button"
            class="filter-pill"
            :class="{ 'filter-pill--active': !!props.modelValue.format }"
          >
            <span class="opacity-45">格式</span>
            <span>{{ formatLabel }}</span>
            <i class="filter-chevron i-[mdi--chevron-down]"></i>
          </div>
          <ul tabindex="0" class="wb-drop-panel filter-menu z-[40]">
            <li>
              <a
                class="rounded-lg"
                :class="{ active: !props.modelValue.format }"
                @click="updateFilters({ format: '' })"
                >全部</a
              >
            </li>
            <li v-for="fmt in formats" :key="fmt.value">
              <a
                class="rounded-lg"
                :class="{ active: props.modelValue.format === fmt.value }"
                @click="updateFilters({ format: fmt.value })"
              >
                {{ fmt.label }}
              </a>
            </li>
          </ul>
        </div>

        <button
          v-if="hasActive"
          type="button"
          class="filter-pill filter-pill--ghost"
          title="重置筛选"
          @click="resetFilters"
        >
          <i class="filter-ico i-[mdi--refresh]"></i>
          重置
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import {
  CATEGORIES,
  COLOR_CHIPS,
  EXACT_RESOLUTION_GROUPS,
  RATIO_GROUPS,
  RESOLUTION_TIERS,
  SORT_OPTIONS,
  TOP_RANGES,
  getSortLabel,
  hasActiveBrowseFilters,
  type BrowseFilters,
  type BrowseSortBy,
  type ResolutionMode,
} from "@/utils/wallpaperBrowse"

export type { BrowseFilters }
export type Filters = BrowseFilters

interface Props {
  modelValue: BrowseFilters
}

interface Emits {
  (e: "update:modelValue", filters: BrowseFilters): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formats = [
  { value: "jpeg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
]

const rootRef = ref<HTMLElement | null>(null)
const screenHint = ref("")

/** 点击面板内按钮/链接后收起（focus-within 方案自身不会失焦） */
const onRootClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null
  if (!target?.closest(".wb-drop-panel button, .wb-drop-panel a")) return
  if (target.closest("[data-keep-open]")) return
  ;(document.activeElement as HTMLElement | null)?.blur()
}

/** 点击组件外部时关闭已展开的面板 */
const onDocClick = (e: MouseEvent) => {
  if (rootRef.value?.contains(e.target as Node)) return
  ;(document.activeElement as HTMLElement | null)?.blur()
}

onMounted(() => {
  document.addEventListener("click", onDocClick)
  try {
    screenHint.value = `${window.screen.width} × ${window.screen.height}`
  } catch {
    screenHint.value = ""
  }
})

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick)
})

const hasActive = computed(() => hasActiveBrowseFilters(props.modelValue))

const resActive = computed(
  () =>
    !!(
      props.modelValue.resolution ||
      props.modelValue.exactResolution ||
      props.modelValue.customWidth ||
      props.modelValue.customHeight
    ),
)

const resLabel = computed(() => {
  const f = props.modelValue
  if (f.resolutionMode === "exact" && f.exactResolution) {
    return f.exactResolution.replace("x", "×")
  }
  if (f.resolutionMode === "custom" && (f.customWidth || f.customHeight)) {
    return `${f.customWidth || "?"}×${f.customHeight || "?"}`
  }
  if (f.resolution) return RESOLUTION_TIERS[f.resolution]?.label || f.resolution
  return "全部"
})

const isOrientRatio = computed(
  () => props.modelValue.orientation === "landscape" || props.modelValue.orientation === "portrait",
)

const ratioLabel = computed(() => {
  if (props.modelValue.ratio) return props.modelValue.ratio
  if (props.modelValue.orientation === "landscape") return "横屏"
  if (props.modelValue.orientation === "portrait") return "竖屏"
  return "全部"
})

const colorSwatch = computed(
  () => COLOR_CHIPS.find((c) => c.value === props.modelValue.color)?.swatch || "#94a3b8",
)

const topRangeLabel = computed(
  () => TOP_RANGES.find((r) => r.value === props.modelValue.topRange)?.label || "近 1 月",
)

const formatLabel = computed(
  () => formats.find((f) => f.value === props.modelValue.format)?.label || "全部",
)

const updateFilters = (updates: Partial<BrowseFilters>) => {
  emit("update:modelValue", { ...props.modelValue, ...updates })
}

const setCategory = (category: string) => {
  updateFilters({ category, subCategory: "" })
}

const updateSort = (sortBy: BrowseSortBy) => {
  const patch: Partial<BrowseFilters> = { sortBy }
  if (sortBy === "toplist" && !props.modelValue.topRange) patch.topRange = "1M"
  updateFilters(patch)
}

const toggleOrder = () => {
  updateFilters({
    sortOrder: props.modelValue.sortOrder === "DESC" ? "ASC" : "DESC",
  })
}

const setResMode = (resolutionMode: ResolutionMode) => {
  updateFilters({ resolutionMode })
}

const pickAtLeast = (resolution: string) => {
  updateFilters({
    resolutionMode: "atLeast",
    resolution,
    exactResolution: "",
    customWidth: "",
    customHeight: "",
  })
}

const pickExact = (exactResolution: string) => {
  updateFilters({
    resolutionMode: "exact",
    exactResolution,
    resolution: "",
    customWidth: "",
    customHeight: "",
  })
}

const onCustomW = (e: Event) => {
  updateFilters({
    resolutionMode: "custom",
    customWidth: (e.target as HTMLInputElement).value,
    resolution: "",
    exactResolution: "",
  })
}

const onCustomH = (e: Event) => {
  updateFilters({
    resolutionMode: "custom",
    customHeight: (e.target as HTMLInputElement).value,
    resolution: "",
    exactResolution: "",
  })
}

const isRatioSelected = (value: string) => {
  if (value === "landscape" || value === "portrait") {
    return props.modelValue.orientation === value && !props.modelValue.ratio
  }
  return props.modelValue.ratio === value
}

const pickRatio = (value: string) => {
  if (value === "landscape" || value === "portrait") {
    updateFilters({ orientation: value, ratio: "" })
  } else {
    updateFilters({ ratio: value, orientation: "" })
  }
}

const clearRatio = () => {
  updateFilters({ ratio: "", orientation: "" })
}

const resetFilters = () => {
  emit("update:modelValue", {
    sortBy: "latest",
    sortOrder: "DESC",
    category: "",
    subCategory: "",
    resolution: "",
    exactResolution: "",
    resolutionMode: "atLeast",
    customWidth: "",
    customHeight: "",
    ratio: "",
    orientation: "",
    format: "",
    topRange: "1M",
    color: "",
    tags: "",
    search: "",
  })
}
</script>

<style scoped>
.filter-ico {
  flex-shrink: 0;
  font-size: 0.95rem;
  opacity: 0.55;
  line-height: 1;
}
.filter-pill--active .filter-ico {
  opacity: 0.9;
}
.filter-chevron {
  flex-shrink: 0;
  font-size: 0.9rem;
  opacity: 0.35;
  line-height: 1;
}
.filter-pill {
  display: inline-flex;
  height: 2rem;
  cursor: pointer;
  align-items: center;
  gap: 0.35rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, var(--wb-fg) 12%, transparent);
  background: color-mix(in oklab, var(--wb-subtle) 70%, var(--wb-surface));
  padding: 0 0.7rem;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1;
  color: var(--wb-fg);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
  user-select: none;
}
.filter-pill:hover {
  border-color: color-mix(in oklab, var(--wb-accent) 35%, transparent);
  background: color-mix(in oklab, var(--wb-accent) 8%, var(--wb-surface));
}
.filter-pill--active {
  border-color: color-mix(in oklab, var(--wb-accent) 40%, transparent);
  background: color-mix(in oklab, var(--wb-accent) 12%, var(--wb-surface));
  color: var(--wb-accent);
}
.filter-pill--ghost:hover {
  border-color: color-mix(in oklab, var(--wb-danger) 30%, transparent);
  color: var(--wb-danger);
}

.seg-group {
  display: inline-flex;
  height: 2rem;
  align-items: center;
  gap: 1px;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, var(--wb-fg) 12%, transparent);
  background: var(--wb-accent-subtle);
  padding: 2px;
}
.seg-btn {
  height: calc(2rem - 6px);
  border-radius: 9999px;
  padding: 0 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: color-mix(in oklab, var(--wb-fg) 55%, transparent);
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}
.seg-btn--on {
  background: var(--wb-surface);
  color: var(--wb-fg);
  font-weight: 700;
  box-shadow: 0 1px 2px color-mix(in oklab, var(--wb-fg) 18%, transparent);
}

.filter-panel {
  border-radius: 0.9rem;
  border: 1px solid color-mix(in oklab, var(--wb-fg) 12%, transparent);
  background: var(--wb-surface);
  box-shadow: 0 12px 40px color-mix(in oklab, var(--wb-fg) 12%, transparent);
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid color-mix(in oklab, var(--wb-fg) 12%, transparent);
  background: color-mix(in oklab, var(--wb-subtle) 50%, var(--wb-surface));
  padding: 0.35rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition:
    border-color 0.12s ease,
    background 0.12s ease;
}
.chip--sm {
  padding: 0.25rem 0.45rem;
  font-size: 0.7rem;
}
.chip--block {
  width: 100%;
}
.chip--on {
  border-color: var(--wb-outline);
  background: var(--wb-accent-fill);
  color: var(--wb-accent-fg);
  font-weight: 700;
}

.filter-menu {
  margin-top: 0.35rem;
  min-width: 9rem;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in oklab, var(--wb-fg) 12%, transparent);
  padding: 0.35rem;
  box-shadow: 0 10px 30px color-mix(in oklab, var(--wb-fg) 10%, transparent);
}
</style>
