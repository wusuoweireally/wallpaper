import api from "@/config/api"
import type { AxiosProgressEvent } from "axios"

/**
 * 壁纸查询参数接口
 */
export interface WallpaperQueryParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  tags?: string[]
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
  /** toplist 时间窗 1d/1w/1M… */
  topRange?: string
  /** 主色桶或 hex */
  color?: string
  /** 精确分辨率 1920x1080 */
  resolutions?: string[]
  /** 随机排序种子：翻页传同一 seed 保证顺序稳定 */
  seed?: number
  /** 关键词搜索（按标签名模糊匹配） */
  search?: string
}

export interface UploadWallpaperParams {
  file: File
  /** 第一步可不传，第二步 publish 再写 */
  category?: "general" | "anime" | "people"
  subCategory?: string
  tags?: string[]
}

export interface PublishWallpaperItem {
  id: number
  category: "general" | "anime" | "people"
  tags: string[]
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
  previewUrl?: string
  fileSize: number
  format?: string
  width: number
  height: number
  aspectRatio: number
  uploaderId: number
  viewCount: number
  favoriteCount: number
  status: number
  isFeatured: boolean
  dominantColor?: string | null
  colorBucket?: string | null
  createdAt: string
  updatedAt: string
  tags?: Tag[]
  isFavorited?: boolean
  uploader?: {
    id: number
    username: string
    email: string
    avatarUrl?: string
    bio?: string
    status: number
    createdAt: string
    updatedAt: string
  }
}

export interface Collection {
  id: number
  userId: number
  name: string
  itemCount?: number
  createdAt?: string
  updatedAt?: string
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
    signal?: AbortSignal,
  ) {
    const formData = new FormData()
    formData.append("file", params.file)
    if (params.category) formData.append("category", params.category)
    if (params.subCategory) formData.append("subCategory", params.subCategory)
    params.tags?.forEach((tag) => formData.append("tags", tag))

    const response = await api.post<Wallpaper>("/wallpapers/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
      signal,
      skipGlobalErrorToast: true,
      timeout: 0,
    })
    return { response }
  }

  /** 按 sha256 查重（选图阶段用，提前发现重复） */
  async checkDuplicate(contentHash: string) {
    return await api.get<{ exists: boolean; id: number | null }>("/wallpapers/check-hash", {
      params: { hash: contentHash },
      skipGlobalErrorToast: true,
    })
  }

  /** 第二步：发布草稿（分类 + 标签） */
  async publishWallpapers(items: PublishWallpaperItem[]) {
    return await api.post<Wallpaper[]>("/wallpapers/publish", { items })
  }

  /** 更新壁纸信息（本人）；status: 0=不公开(下架) 1=公开 */
  async updateWallpaper(
    id: number,
    data: Partial<Pick<Wallpaper, "category" | "subCategory" | "status">>,
  ) {
    return await api.put<Wallpaper>(`/wallpapers/${id}`, data, {
      skipGlobalErrorToast: true,
    })
  }

  /** 删除壁纸（本人，同时删除 COS 文件） */
  async deleteWallpaper(id: number) {
    return await api.delete<unknown>(`/wallpapers/${id}`, {
      skipGlobalErrorToast: true,
    })
  }

  async getWallpapers(params: WallpaperQueryParams = {}) {
    const queryParams = buildQuery({
      page: Math.max(1, params.page ?? 1),
      limit: Math.max(1, Math.min(100, params.limit ?? 20)),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      category: params.category,
      orientation: params.orientation,
      minWidth: params.minWidth,
      maxWidth: params.maxWidth,
      minHeight: params.minHeight,
      maxHeight: params.maxHeight,
      aspectRatio: params.aspectRatio,
      format: params.format,
      subCategory: params.subCategory,
      minFileSize: params.minFileSize,
      maxFileSize: params.maxFileSize,
      tags: params.tags,
      topRange: params.topRange,
      color: params.color,
      resolutions: params.resolutions,
      seed: params.seed,
      search: params.search,
    })
    try {
      return await api.get<Wallpaper[]>("/wallpapers", {
        params: queryParams,
        timeout: 10000,
      })
    } catch (error: unknown) {
      // 取消的请求返回空集（调用方按"无新数据"处理）；其余错误由拦截器统一映射后上抛
      const err = error as Error & { isCancelled?: boolean }
      if (err.name === "REQUEST_CANCELLED" || err.isCancelled) {
        return {
          success: false,
          message: "请求已取消",
          data: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        }
      }
      throw error
    }
  }

  /** 游客防刷：单 key 存已浏览时间戳，超容量裁最旧（避免每个壁纸一个 key 无限膨胀） */
  private viewWindowMark(id: number): boolean {
    const KEY = "wallbay-viewed"
    const MAX = 500
    let map: Record<string, number> = {}
    try {
      map = JSON.parse(localStorage.getItem(KEY) || "{}")
    } catch {
      map = {} // 数据损坏则重置
    }
    const now = Date.now()
    if (now - Number(map[id] || 0) < 3_600_000) return false // 窗口内：本次不计数
    map[id] = now

    const entries = Object.entries(map)
    if (entries.length > MAX) {
      entries.sort((a, b) => a[1] - b[1])
      for (const [k] of entries.slice(0, entries.length - MAX)) delete map[k]
    }
    localStorage.setItem(KEY, JSON.stringify(map))

    // 一次性清掉旧版按壁纸散落的 key
    if (!localStorage.getItem("wallbay-viewed-migrated")) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k?.startsWith("wallbay-viewed-")) localStorage.removeItem(k)
      }
      localStorage.setItem("wallbay-viewed-migrated", "1")
    }
    return true
  }

  async getWallpaperDetail(id: number) {
    return await api.get<Wallpaper>(`/wallpapers/${id}`, {
      params: this.viewWindowMark(id) ? {} : { trackView: "0" },
      deduplicate: true, // 双击/连点进详情只发一次请求（配合后端防刷）
    })
  }

  async favoriteWallpaper(id: number) {
    return await api.post(`/wallpapers/${id}/favorite`, undefined, {
      skipGlobalErrorToast: true,
    })
  }

  async unfavoriteWallpaper(id: number) {
    return await api.delete(`/wallpapers/${id}/favorite`, {
      skipGlobalErrorToast: true,
    })
  }

  async getRelatedWallpapers(id: number, limit = 8) {
    return await api.get<Wallpaper[]>(`/wallpapers/${id}/related`, { params: { limit } })
  }

  async getPopularWallpapers(limit = 10) {
    return await api.get<Wallpaper[]>(`/wallpapers/popular`, { params: { limit } })
  }

  /** 编辑精选壁纸（isFeatured） */
  async getFeaturedWallpapers(limit = 10) {
    return await api.get<Wallpaper[]>(`/wallpapers/featured`, { params: { limit } })
  }

  // —— 合集 ——
  /** 带 wallpaperId 时，返回体附 containingIds（已包含该壁纸的合集 ID） */
  async listCollections(wallpaperId?: number) {
    const res = await api.get<Collection[]>("/collections", {
      params: wallpaperId ? { wallpaperId } : undefined,
    })
    return res as unknown as {
      success: boolean
      data?: Collection[]
      containingIds?: number[]
    }
  }

  async createCollection(name: string) {
    return await api.post<Collection>("/collections", { name })
  }

  async renameCollection(id: number, name: string) {
    return await api.patch<Collection>(`/collections/${id}`, { name })
  }

  async deleteCollection(id: number) {
    return await api.delete(`/collections/${id}`)
  }

  async listCollectionWallpapers(id: number, page = 1, limit = 20) {
    return await api.get<Wallpaper[]>(`/collections/${id}/wallpapers`, {
      params: { page, limit },
    })
  }

  async addToCollection(collectionId: number, wallpaperId: number) {
    return await api.post(`/collections/${collectionId}/wallpapers`, {
      wallpaperId,
    })
  }

  async removeFromCollection(collectionId: number, wallpaperId: number) {
    return await api.delete(`/collections/${collectionId}/wallpapers/${wallpaperId}`)
  }

  // —— 公开用户页 ——
  async getPublicUser(userId: number) {
    return await api.get<{
      id: number
      username: string
      avatarUrl?: string
      bio?: string
      createdAt?: string
    }>(`/users/${userId}`)
  }

  async getPublicUserUploads(userId: number, page = 1, limit = 20) {
    return await api.get<Wallpaper[]>(`/users/${userId}/uploads`, {
      params: { page, limit },
    })
  }
}

export const wallpaperService = new WallpaperService()
export default wallpaperService
