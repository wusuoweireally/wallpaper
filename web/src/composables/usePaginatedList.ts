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

  /**
   * 就地移除条目并收缩分页（取消收藏、删除自己的帖子等）。
   * 当前页被删空且不在首页时返回应回退到的页码，供调用方重新拉取；否则返回 null。
   * 按谓词而不是 id：列表项不一定带 id（如浏览记录的键是 wallpaper.id）。
   */
  const removeItem = (match: (item: T) => boolean): number | null => {
    items.value = items.value.filter((item) => !match(item))
    pagination.value.totalCount = Math.max(0, pagination.value.totalCount - 1)
    const remainingPages = Math.max(
      1,
      Math.ceil(pagination.value.totalCount / pagination.value.pageSize),
    )
    pagination.value.totalPages = remainingPages

    if (items.value.length === 0 && pagination.value.currentPage > 1) {
      const targetPage = Math.min(
        pagination.value.currentPage - 1,
        remainingPages,
      )
      pagination.value.currentPage = targetPage
      return targetPage
    }
    return null
  }

  if (options.immediate !== false) {
    onMounted(() => void fetchData())
  }

  return {
    items,
    loading,
    error,
    pagination,
    fetchData,
    handlePageChange,
    removeItem,
  }
}
