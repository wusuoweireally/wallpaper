<template>
  <nav
    v-if="totalPages > 1"
    class="flex flex-wrap items-center justify-center gap-1.5"
    aria-label="分页"
  >
    <button
      type="button"
      class="wb-btn h-9 w-9 px-0"
      :disabled="currentPage <= 1"
      aria-label="上一页"
      @click="go(currentPage - 1)"
    >
      <i class="i-[mdi--chevron-left]" aria-hidden="true"></i>
    </button>
    <template v-for="(page, index) in pageItems" :key="index">
      <span v-if="page === ELLIPSIS" class="select-none px-1 text-sm text-faint" aria-hidden="true"
        >…</span
      >
      <button
        v-else
        type="button"
        class="h-9 min-w-9 rounded-control px-2 text-sm font-medium transition-colors"
        :class="
          page === currentPage
            ? 'bg-primary-fill text-primary-content'
            : 'border border-line bg-surface text-muted hover:bg-subtle hover:text-fg'
        "
        :aria-current="page === currentPage ? 'page' : undefined"
        @click="go(page as number)"
      >
        {{ page }}
      </button>
    </template>
    <button
      type="button"
      class="wb-btn h-9 w-9 px-0"
      :disabled="currentPage >= totalPages"
      aria-label="下一页"
      @click="go(currentPage + 1)"
    >
      <i class="i-[mdi--chevron-right]" aria-hidden="true"></i>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue"

const ELLIPSIS = "…"

interface Props {
  currentPage: number
  totalPages: number
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  totalPages: 1,
})

const emit = defineEmits<{
  (e: "change", page: number): void
}>()

/** 页码窗口：1 … cur-1 cur cur+1 … total，页数少时全量展示 */
const pageItems = computed<(number | typeof ELLIPSIS)[]>(() => {
  const total = props.totalPages
  const cur = props.currentPage
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const items: (number | typeof ELLIPSIS)[] = [1]
  const lo = Math.max(2, cur - 1)
  const hi = Math.min(total - 1, cur + 1)
  if (lo > 2) items.push(ELLIPSIS)
  for (let i = lo; i <= hi; i += 1) items.push(i)
  if (hi < total - 1) items.push(ELLIPSIS)
  items.push(total)
  return items
})

const go = (page: number) => {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return
  emit("change", page)
}
</script>
