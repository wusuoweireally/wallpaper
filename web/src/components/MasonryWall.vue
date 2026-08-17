<template>
  <div class="wb-masonry" data-gallery="masonry">
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
</script>
