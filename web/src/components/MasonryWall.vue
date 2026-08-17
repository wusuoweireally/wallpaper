<template>
  <div class="wb-masonry" data-gallery="masonry" :style="wallStyle">
    <div v-for="(col, i) in columns" :key="i" class="wb-masonry-col">
      <slot :items="col" />
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
