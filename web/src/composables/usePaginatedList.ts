import { onMounted, ref, type Ref } from "vue"
import { createFetchGeneration } from "@/utils/fetchGeneration"
import { EMPTY_PAGINATION, type PaginationData } from "@/utils/pagination"

export interface PageResult<T> {
  data: T[]
  pagination: PaginationData
}

/**
 * 用户中心列表的公共骨架：分页状态 / 加载态 / 错误态 / 过期响应丢弃。
 * fetcher 只负责「取第 page 页」，组件专注渲染与各自的交互。
 * 需要就地增删条目时（如取消收藏）直接改 items，再按需 fetchData。
 */
export function usePaginatedList<T>(
  fetcher: (page: number, pageSize: number) => Promise<PageResult<T>>,
  options: { errorMessage?: string; immediate?: boolean } = {},
) {
  // 泛型 ref 会被 Vue 的 UnwrapRef 递归推导，这里按原始类型断言
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref("")
  const pagination = ref<PaginationData>({ ...EMPTY_PAGINATION })
  const generation = createFetchGeneration()

  const fetchData = async (page = pagination.value.currentPage) => {
    const gen = generation.next()
    loading.value = true
    error.value = ""
    try {
      const result = await fetcher(page, pagination.value.pageSize)
      if (!generation.isCurrent(gen)) return
      items.value = result?.data ?? []
      pagination.value = result?.pagination ?? {
        ...EMPTY_PAGINATION,
        currentPage: page,
      }
    } catch (err) {
      if (!generation.isCurrent(gen)) return
      error.value =
        err instanceof Error ? err.message : (options.errorMessage ?? "获取数据失败")
    } finally {
      if (generation.isCurrent(gen)) loading.value = false
    }
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.value.totalPages) return
    void fetchData(page)
  }

  if (options.immediate !== false) {
    onMounted(() => void fetchData())
  }

  return { items, loading, error, pagination, fetchData, handlePageChange }
}
