import api from "@/config/api";
import type { AxiosProgressEvent } from "axios";

/**
 * 壁纸查询参数接口
 */
export interface WallpaperQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  tags?: string[];
  tagKeyword?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
  category?: 'general' | 'anime' | 'people';
  format?: string;
  minFileSize?: number;
  maxFileSize?: number;
}

/**
 * 壁纸上传参数接口
 */
export interface UploadWallpaperParams {
  file: File;
  category: string;
  tags: string[];
  title?: string;
  description?: string;
}

/**
 * 标签接口
 */
export interface Tag {
  id: number;
  name: string;
  slug: string;
  usageCount: number;
  createdAt: string;
}

/**
 * 上传者接口
 */
export interface Uploader {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 壁纸数据接口
 */
export interface Wallpaper {
  id: number;
  fileUrl: string;
  title?: string;
  description?: string;
  category: 'general' | 'anime' | 'people';
  thumbnailUrl?: string;
  fileSize: number;
  format?: string;
  width: number;
  height: number;
  aspectRatio: number;
  uploaderId: number;
  uploader?: Uploader;
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
  status: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  isLiked?: boolean;
  isFavorited?: boolean;
}

/**
 * 壁纸列表响应接口
 */
export interface WallpaperListResponse {
  data: Wallpaper[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * 壁纸服务类
 */
class WallpaperService {
  /**
   * 上传壁纸
   */
  async uploadWallpaper(
    params: UploadWallpaperParams,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  ) {
    const formData = new FormData();
    formData.append("file", params.file);

    formData.append("category", params.category);

    if (params.title) {
      formData.append("title", params.title);
    }

    if (params.description) {
      formData.append("description", params.description);
    }

    if (params.tags && params.tags.length > 0) {
      // 后端期望tags是数组，但FormData不能直接传递数组
      // 需要将每个标签作为单独的字段传递
      params.tags.forEach((tag) => {
        formData.append("tags[]", tag);
      });
    }

    // 生成请求ID用于取消上传
    const requestId = `upload_${Date.now()}`;

    try {
      const response = await api.post("/wallpapers/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
      });

      return { response, requestId };
    } catch (error) {
      console.error("上传壁纸失败:", error);
      throw error;
    }
  }

  /**
   * 获取壁纸列表
   */
  async getWallpapers(params: WallpaperQueryParams = {}) {
    try {
      // 构建查询参数对象，确保数字类型参数正确传递
      const queryParams: Record<string, any> = {
        page: Math.max(1, params.page ?? 1),
        limit: Math.max(1, Math.min(100, params.limit ?? 20)),
      };

      if (params.search) queryParams.search = params.search;
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
      if (params.category) queryParams.category = params.category;
      if (params.aspectRatio) queryParams.aspectRatio = params.aspectRatio;
      if (params.minWidth) queryParams.minWidth = params.minWidth;
      if (params.maxWidth) queryParams.maxWidth = params.maxWidth;
      if (params.minHeight) queryParams.minHeight = params.minHeight;
      if (params.maxHeight) queryParams.maxHeight = params.maxHeight;
      if (params.format) queryParams.format = params.format;
      if (params.minFileSize) queryParams.minFileSize = params.minFileSize;
      if (params.maxFileSize) queryParams.maxFileSize = params.maxFileSize;

      if (params.tags && params.tags.length > 0) {
        queryParams.tags = params.tags;
      }

      if (params.tagKeyword) {
        queryParams.tagKeyword = params.tagKeyword;
      }

      const response = await api.get("/wallpapers", {
        params: queryParams,
        timeout: 10000 // 10秒超时
      });
      return response;
    } catch (error: any) {
      console.error("获取壁纸列表失败:", error);

      // 检查是否是请求被取消
      if (error.name === 'REQUEST_CANCELLED' || error.isCancelled) {
        // 请求被取消，静默处理，返回空结果但不抛出错误
        return {
          success: false,
          message: '请求已取消',
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            pages: 0
          }
        };
      }

      // 详细的错误分类和友好的错误信息
      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接或稍后重试');
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw new Error('网络连接失败，请检查网络设置');
      } else if (error.response?.status === 400) {
        throw new Error('请求参数错误，请检查筛选条件');
      } else if (error.response?.status === 404) {
        throw new Error('未找到相关壁纸，请尝试其他筛选条件');
      } else if (error.response?.status === 401) {
        throw new Error('身份验证失败，请重新登录');
      } else if (error.response?.status === 403) {
        throw new Error('权限不足，无法访问该内容');
      } else if (error.response?.status >= 500) {
        throw new Error('服务器暂时不可用，请稍后重试');
      } else if (error.response?.data?.message) {
        // 使用后端返回的具体错误信息
        throw new Error(error.response.data.message);
      } else {
        throw new Error('获取壁纸失败，请稍后重试');
      }
    }
  }

  /**
   * 获取壁纸详情
   */
  async getWallpaperDetail(id: number) {
    try {
      const response = await api.get(`/wallpapers/${id}`);
      return response;
    } catch (error) {
      console.error("获取壁纸详情失败:", error);
      throw error;
    }
  }

  /**
   * 更新壁纸信息
   */
  async updateWallpaper(id: number, updateData: Partial<Wallpaper>) {
    try {
      const response = await api.put(`/wallpapers/${id}`, updateData);
      return response;
    } catch (error) {
      console.error("更新壁纸失败:", error);
      throw error;
    }
  }

  /**
   * 删除壁纸
   */
  async deleteWallpaper(id: number) {
    try {
      const response = await api.delete(`/wallpapers/${id}`);
      return response;
    } catch (error) {
      console.error("删除壁纸失败:", error);
      throw error;
    }
  }

  /**
   * 点赞壁纸
   */
  async likeWallpaper(id: number) {
    try {
      const response = await api.post(`/wallpapers/${id}/like`);
      return response;
    } catch (error) {
      console.error("点赞壁纸失败:", error);
      throw error;
    }
  }

  /**
   * 取消点赞壁纸
   */
  async unlikeWallpaper(id: number) {
    try {
      const response = await api.post(`/wallpapers/${id}/unlike`);
      return response;
    } catch (error) {
      console.error("取消点赞壁纸失败:", error);
      throw error;
    }
  }

  /**
   * 收藏壁纸
   */
  async favoriteWallpaper(id: number) {
    try {
      const response = await api.post(`/wallpapers/${id}/favorite`);
      return response;
    } catch (error) {
      console.error("收藏壁纸失败:", error);
      throw error;
    }
  }

  /**
   * 取消收藏壁纸
   */
  async unfavoriteWallpaper(id: number) {
    try {
      const response = await api.post(`/wallpapers/${id}/unfavorite`);
      return response;
    } catch (error) {
      console.error("取消收藏壁纸失败:", error);
      throw error;
    }
  }

  /**
   * 获取热门壁纸
   */
  async getPopularWallpapers(limit: number = 10) {
    try {
      const response = await api.get(`/wallpapers/popular`, {
        params: { limit },
      });
      return response;
    } catch (error) {
      console.error("获取热门壁纸失败:", error);
      throw error;
    }
  }

  /**
   * 根据上传者获取壁纸
   */
  async getWallpapersByUploader(
    uploaderId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const response = await api.get(`/wallpapers/uploader/${uploaderId}`, {
        params: { page, limit },
      });
      return response;
    } catch (error) {
      console.error("获取上传者壁纸失败:", error);
      throw error;
    }
  }

  /**
   * 获取壁纸关联标签
   */
  async getWallpaperTags(id: number) {
    try {
      const response = await api.get(`/wallpapers/${id}/tags`);
      return response;
    } catch (error) {
      console.error("获取壁纸标签失败:", error);
      throw error;
    }
  }
}

// 导出单例实例
export const wallpaperService = new WallpaperService();

export default wallpaperService;
