/**
 * 通用类型定义文件
 * 用于解决项目中的 any 类型警告
 */

import type { AxiosRequestConfig } from "axios"

/**
 * 通用 API 响应类型
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T | null
  pagination?: PaginationMeta
}

/**
 * 分页元数据
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

/**
 * 导航项类型
 */
export interface NavItem {
  name: string
  to: string
  sortValue?: string
}

/**
 * 举报原因项类型
 */
export interface ReportReasonItem {
  value: string
  label: string
  description?: string
}

/**
 * 扩展的 Axios 请求配置
 */
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  requestId?: string
  skipAuthExpiredHandler?: boolean
}

/**
 * 错误对象扩展
 */
export interface EnhancedError extends Error {
  userMessage?: string
  timestamp?: string
  isCancelled?: boolean
  response?: {
    status: number
    data?: {
      message?: string
    }
  }
  code?: string
  config?: CustomAxiosRequestConfig
  request?: unknown
}

/**
 * 缓存数据类型
 */
export type CacheData = Record<string, ApiResponse<unknown>>

/**
 * 扩展全局 Error 类型
 */
declare global {
  interface Error {
    isCancelled?: boolean
  }
}
