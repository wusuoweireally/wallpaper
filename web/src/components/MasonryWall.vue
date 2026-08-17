<template>
  <div class="wb-masonry" data-gallery="masonry" :style="wallStyle">
    <div v-for="(col, i) in columns" :key="i" class="wb-masonry-col">
      <slot :items="col" :tail-cut="tailCuts[i]" />
    </div>
  </div>
</template>

<script lang="ts" setup generic="T">
import { computed, onMounted, onUnmounted, ref } from "vue"
import { masonryColumnCount, splitMasonryColumns } from "@/utils/wallpaperLayout"

const props = defineProps<{
  items: T[]
  itemHeight?: (item: T) => number
}>()

const viewportWidth = ref(typeof window === "undefined" ? 1200 : window.innerWidth)

const updateWidth = () => {
  viewportWidth.value = window.innerWidth
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

/** 剩余尾差小于一张卡片 10% 高时视为已齐平，放弃裁切 */
const CUT_TOLERANCE = 0.1

/**
 * 尾部裁切线（相对列宽的比例）：以最矮列为基准，更高的列把最后一张裁到基准线。
 * 高度 ≤ 基准（该列即最矮或尾差过小）时为 undefined，卡片按原比例完整展示。
 * 返回数组与 columns 一一对应，供卡片换算 max-height。
 */
const tailCuts = computed<(number | undefined)[]>(() => {
  const cols = columns.value
  if (cols.length < 2 || !props.itemHeight) return cols.map(() => undefined)
  const heights = cols.map((col) => col.reduce((s, it) => s + props.itemHeight!(it), 0))
  const base = Math.min(...heights)
  return cols.map((col, i) => {
    const over = heights[i] - base
    if (over <= CUT_TOLERANCE) return undefined
    const last = col[col.length - 1]
    const cutRatio = props.itemHeight!(last) - over
    // 裁切后不足半张高失去可读性，不裁（保留尾差）
    if (cutRatio < 0.5) return undefined
    return Math.min(cutRatio, props.itemHeight!(last))
  })
})

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
