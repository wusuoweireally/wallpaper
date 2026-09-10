/**
 * 前端分页统一模型：后端返回 {page,limit,total,pages}，组件要的是
 * {currentPage,totalPages,totalCount,pageSize}，在 services 层一次性归一化，
 * 组件不再各自转换。
 */
export interface PaginationData {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
}

/** 空态（首屏未返回前、或接口没带分页信息时的兜底） */
export const EMPTY_PAGINATION: PaginationData = {
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  pageSize: 20,
}

/** 将后端分页格式转为前端 PaginationData */
export const toPagination = (p?: {
  page?: number
  limit?: number
  total?: number
  pages?: number
}): PaginationData => ({
  currentPage: p?.page || 1,
  totalPages: p?.pages || 0,
  totalCount: p?.total || 0,
  pageSize: p?.limit || 20,
})
