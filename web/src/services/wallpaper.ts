import api from "@/config/api"
import type { AxiosProgressEvent } from "axios"

/**
 * 壁纸查询参数接口
 */
export interface WallpaperQueryParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  tags?: string[]
  tagKeyword?: string
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  aspectRatio?: number
  orientation?: string
  category?: "general" | "anime" | "people"
  subCategory?: string
  format?: string
  minFileSize?: number
  maxFileSize?: number
}

export interface UploadWallpaperParams {
  file: File
  category: string
  tags: string[]
  title?: string
  description?: string
}

export interface Tag {
  id: number
  name: string
  slug: string
  usageCount: number
  createdAt: string
}

export interface Wallpaper {
  id: number
  fileUrl: string
  category: "general" | "anime" | "people"
  subCategory?: string
  thumbnailUrl?: string
  fileSize: number
  format?: string
  width: number
  height: number
  aspectRatio: number
  uploaderId: number
  viewCount: number
  likeCount: number
  favoriteCount: number
  downloadCount: number
  status: number
  isFeatured: boolean
  title?: string
  description?: string
  createdAt: string
  updatedAt: string
  tags?: Tag[]
  isLiked?: boolean
  isFavorited?: boolean
  uploader?: {
    id: number; username: string; email: string
    avatarUrl?: string; bio?: string; status: number
    createdAt: string; updatedAt: string
  }
}

/** 构建查询参数，过滤 undefined 值 */
function buildQuery(params: Record<string, unknown>) {
  const q: Record<string, string | number | string[]> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) q[k] = v as string | number | string[]
  }
  return q
}

class WallpaperService {
  async uploadWallpaper(
    params: UploadWallpaperParams,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  ) {
    const formData = new FormData()
    formData.append("file", params.file)
    formData.append("category", params.category)
    if (params.title) formData.append("title", params.title)
    if (params.description) formData.append("description", params.description)
    params.tags?.forEach((tag) => formData.append("tags[]", tag))

    const response = await api.post("/wallpapers/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    })
    return { response, requestId: `upload_${Date.now()}` }
  }

  async getWallpapers(params: WallpaperQueryParams = {}) {
    try {
      const queryParams = buildQuery({
        page: Math.max(1, params.page ?? 1),
        limit: Math.max(1, Math.min(100, params.limit ?? 20)),
        search: params.search, sortBy: params.sortBy, sortOrder: params.sortOrder,
        category: params.category, orientation: params.orientation,
        minWidth: params.minWidth, maxWidth: params.maxWidth,
        minHeight: params.minHeight, maxHeight: params.maxHeight,
        aspectRatio: params.aspectRatio, format: params.format,
        minFileSize: params.minFileSize, maxFileSize: params.maxFileSize,
        tags: params.tags, tagKeyword: params.tagKeyword,
      })
      return await api.get<Wallpaper[]>("/wallpapers", { params: queryParams, timeout: 10000 })
    } catch (error: unknown) {
      const err = error as Error & Record<string, unknown>
      if (err.name === "REQUEST_CANCELLED" || (err as { isCancelled?: boolean }).isCancelled) {
        return { success: false, message: "请求已取消", data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }
      }
      const status = (err as { response?: { status: number; data?: { message?: string } } }).response?.status
      if (err.code === "ECONNABORTED") throw new Error("请求超时，请检查网络连接或稍后重试")
      if (err.code === "NETWORK_ERROR" || (err.message || "").includes("Network Error")) throw new Error("网络连接失败，请检查网络设置")
      if (status === 400) throw new Error("请求参数错误，请检查筛选条件")
      if (status === 404) throw new Error("未找到相关壁纸，请尝试其他筛选条件")
      if (status === 401) throw new Error("身份验证失败，请重新登录")
      if (status === 403) throw new Error("权限不足，无法访问该内容")
      if (status && status >= 500) throw new Error("服务器暂时不可用，请稍后重试")
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      if (msg) throw new Error(msg)
      throw new Error("获取壁纸失败，请稍后重试")
    }
  }

  async getWallpaperDetail(id: number) {
    return await api.get<Wallpaper>(`/wallpapers/${id}`)
  }

  async updateWallpaper(id: number, updateData: Partial<Wallpaper>) {
    return await api.put<Wallpaper>(`/wallpapers/${id}`, updateData)
  }

  async deleteWallpaper(id: number) {
    return await api.delete(`/wallpapers/${id}`)
  }

  async likeWallpaper(id: number) {
    return await api.post(`/wallpapers/${id}/like`)
  }

  async unlikeWallpaper(id: number) {
    return this.likeWallpaper(id) // like 端点已是 toggle
  }

  async favoriteWallpaper(id: number) {
    return await api.post(`/wallpapers/${id}/favorite`)
  }

  async unfavoriteWallpaper(id: number) {
    return this.favoriteWallpaper(id) // favorite 端点已是 toggle
  }

  async getRelatedWallpapers(id: number, limit = 8) {
    return await api.get<Wallpaper[]>(`/wallpapers/${id}/related`, { params: { limit } })
  }

  async getTrendingWallpapers(days = 7, limit = 10) {
    return await api.get<Wallpaper[]>(`/wallpapers/trending`, { params: { days, limit } })
  }

  async getPopularWallpapers(limit = 10) {
    return await api.get<Wallpaper[]>(`/wallpapers/popular`, { params: { limit } })
  }

  async getWallpapersByUploader(uploaderId: number, page = 1, limit = 20) {
    return await api.get<Wallpaper[]>(`/wallpapers/uploader/${uploaderId}`, { params: { page, limit } })
  }

  async recordDownload(id: number) {
    return await api.post(`/wallpapers/${id}/download`)
  }

  async getWallpaperTags(id: number) {
    return await api.get<import("./tag").Tag[]>(`/wallpapers/${id}/tags`)
  }
}

export const wallpaperService = new WallpaperService()
export default wallpaperService
