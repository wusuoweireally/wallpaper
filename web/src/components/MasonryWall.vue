<template>
  <div ref="wallEl" class="wb-masonry" data-gallery="masonry" :style="wallStyle">
    <div
      v-for="(col, i) in columns"
      :key="i"
      class="wb-masonry-col"
      :style="colStyle(i)"
    >
      <slot :items="col" />
    </div>
  </div>
</template>

<script lang="ts" setup generic="T">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import {
  masonryColumnCount,
  masonryColumnFlexGrow,
  masonryColumnHeights,
  splitMasonryColumns,
} from "@/utils/wallpaperLayout"

const props = defineProps<{
  items: T[]
  itemHeight?: (item: T) => number
}>()

const viewportWidth = ref(typeof window === "undefined" ? 1200 : window.innerWidth)
const wallEl = ref<HTMLElement | null>(null)
/** 墙体实际宽度与列间 gap（px）：变宽列求解需要与渲染同单位的无量纲间隙比 */
const wallWidth = ref(0)
const columnGapPx = ref(16)

const updateWidth = () => {
  viewportWidth.value = window.innerWidth
  if (wallEl.value) {
    wallWidth.value = wallEl.value.clientWidth
    const parsed = Number.parseFloat(getComputedStyle(wallEl.value).columnGap)
    if (Number.isFinite(parsed) && parsed >= 0) columnGapPx.value = parsed
  }
}

onMounted(() => {
  updateWidth()
  window.addEventListener("resize", updateWidth, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth)
})

const columnCount = computed(() => masonryColumnCount(viewportWidth.value))

const columns = computed(() =>
  splitMasonryColumns(props.items, columnCount.value, props.itemHeight),
)

// 数据量变化会切换“图少于列数”的限宽（wallStyle），墙宽随之变化，需在渲染后重测
watch(
  () => [columns.value.length, props.items.length],
  async () => {
    await nextTick()
    updateWidth()
  },
)

/**
 * 变宽列：列宽按 (H − (张数−1)·ρ)/S_j 分配（S_j 为列高宽比总和，ρ 为间隙占自由宽比），
 * 所有列渲染高度（卡片和 + 列内间隙）恒等，底缘严格平齐且铺满容器，卡片保持原图比例。
 * 未提供 itemHeight（骨架屏）或尚未量到墙宽时不接管，回落 CSS 等宽。
 */
const flexGrow = computed<number[] | undefined>(() => {
  if (!props.itemHeight) return undefined
  const width = wallWidth.value
  if (!width) return undefined
  const cols = columns.value
  const n = cols.length
  const free = width - (n - 1) * columnGapPx.value
  if (free <= 0) return undefined
  return masonryColumnFlexGrow(
    masonryColumnHeights(cols, props.itemHeight),
    cols.map((c) => c.length),
    columnGapPx.value / free,
  )
})

const colStyle = (i: number) =>
  flexGrow.value ? { flex: `${flexGrow.value[i]} 1 0` } : undefined

/** 与 .wb-masonry 的 gap 一致（rem） */
const GAP_REM = 1

/** 图少于列数时按实际列数限宽（左对齐），卡片保持正常列宽而不是平分整行 */
const wallStyle = computed(() => {
  const cols = columnCount.value
  const n = columns.value.length
  if (n >= cols) return undefined
  return {
    maxWidth: `calc((100% - ${(cols - 1) * GAP_REM}rem) * ${n} / ${cols} + ${(n - 1) * GAP_REM}rem)`,
  }
})
</script>
