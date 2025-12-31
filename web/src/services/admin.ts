import api from '@/config/api'
import type { ApiResponse } from '@/config/api'
import type { UserRole } from '@/services/user'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export type ApiResponseWithPagination<T> = ApiResponse<T> & {
  pagination: PaginationMeta
}

export interface AdminUser {
  id: number
  username: string
  email: string | null
  role: UserRole
  status: number
  avatarUrl?: string | null
  bio?: string | null
  createdAt: string
  updatedAt?: string
}

export interface AdminUserQuery {
  page?: number
  limit?: number
  keyword?: string
  status?: number
  role?: UserRole
}

export interface CreateAdminUser {
  id: number
  username: string
  email?: string
  password: string
  role?: UserRole
  bio?: string
}

export interface UpdateAdminUser {
  username?: string
  email?: string | null
  role?: UserRole
  status?: number
  bio?: string | null
  avatarUrl?: string | null
}

export interface UpdateUserStatus {
  status: number
}

export interface AdminWallpaperTag {
  id?: number
  name?: string
  slug?: string
}

export interface AdminWallpaper {
  id: number
  title: string
  description?: string | null
  fileUrl: string
  thumbnailUrl?: string | null
  category: 'general' | 'anime' | 'people'
  status?: number
  width: number
  height: number
  fileSize: number
  viewCount: number
  likeCount: number
  favoriteCount: number
  createdAt: string
  updatedAt?: string
  tags?: (string | AdminWallpaperTag)[]
  uploader?: {
    id: number
    username: string
    avatarUrl?: string | null
  }
}

export interface AdminWallpaperQuery {
  page?: number
  limit?: number
  search?: string
  status?: number
  category?: 'general' | 'anime' | 'people'
  uploaderId?: number
}

export interface UpdateAdminWallpaper {
  title?: string
  description?: string
  category?: 'general' | 'anime' | 'people'
}

export interface UpdateWallpaperTags {
  tags?: string[]
}

export type ReportStatusValue = 'pending' | 'reviewing' | 'resolved' | 'dismissed'
export type ReportReasonValue =
  | 'spam'
  | 'inappropriate'
  | 'harassment'
  | 'violence'
  | 'copyright'
  | 'misinformation'
  | 'other'

export interface Report {
  id: number
  reason: ReportReasonValue
  description?: string | null
  status: ReportStatusValue
  user?: {
    id: number
    username: string
  }
  targetType?: 'post' | 'comment'
  targetId?: number
  createdAt: string
  updatedAt?: string
  reviewNote?: string | null
}

export interface GetReportsQuery {
  page?: number
  limit?: number
  status?: ReportStatusValue
  reason?: ReportReasonValue
  keyword?: string
}

export interface UpdateReportStatus {
  status?: ReportStatusValue
  reviewNote?: string
}

export interface ReportStats {
  totalReports: number
  pendingReports: number
  processingReports: number
  resolvedReports: number
  rejectedReports: number
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalWallpapers: number
  newWallpapersThisMonth: number
  totalPosts: number
  newPostsThisMonth: number
  totalReports: number
  pendingReports: number
}

export interface RecentActivityItem {
  id: number
  reason: ReportReasonValue
  status: ReportStatusValue
  createdAt: string
  reporterId: number
  reporterUsername?: string
}

class AdminService {
  // 用户管理
  async adminGetUsers(query: AdminUserQuery) {
    return api.get('/admin/users', { params: query }) as Promise<ApiResponseWithPagination<AdminUser[]>>
  }

  async adminGetUserById(id: number) {
    return api.get(`/admin/users/${id}`) as Promise<ApiResponse<AdminUser>>
  }

  async adminCreateUser(data: CreateAdminUser) {
    return api.post('/admin/users', data)
  }

  async adminUpdateUser(id: number, data: UpdateAdminUser) {
    return api.patch(`/admin/users/${id}`, data)
  }

  async adminUpdateUserStatus(id: number, data: UpdateUserStatus) {
    return api.patch(`/admin/users/${id}/status`, data)
  }

  async adminDeleteUser(id: number) {
    return api.delete(`/admin/users/${id}`)
  }

  // 壁纸管理
  async adminGetWallpapers(query: AdminWallpaperQuery) {
    return api.get('/admin/wallpapers', { params: query }) as Promise<ApiResponseWithPagination<AdminWallpaper[]>>
  }

  async adminGetWallpaperDetail(id: number) {
    return api.get(`/admin/wallpapers/${id}`) as Promise<ApiResponse<AdminWallpaper>>
  }

  async adminUpdateWallpaper(id: number, data: UpdateAdminWallpaper) {
    return api.patch(`/admin/wallpapers/${id}`, data)
  }

  async adminUpdateWallpaperTags(id: number, data: UpdateWallpaperTags) {
    return api.patch(`/admin/wallpapers/${id}/tags`, data)
  }

  async adminDeleteWallpaper(id: number) {
    return api.delete(`/admin/wallpapers/${id}`)
  }

  // 举报管理
  async getReports(query: GetReportsQuery) {
    return api.get('/admin/reports', { params: query }) as Promise<ApiResponseWithPagination<Report[]>>
  }

  async getReportById(id: number) {
    return api.get(`/admin/reports/${id}`) as Promise<ApiResponse<Report>>
  }

  async getReportStats() {
    return api.get('/admin/reports/stats/overview') as Promise<ApiResponse<ReportStats>>
  }

  async updateReportStatus(id: number, data: UpdateReportStatus) {
    return api.put(`/admin/reports/${id}/status`, data)
  }

  // 仪表盘
  async getDashboardStats() {
    return api.get('/admin/dashboard/stats') as Promise<ApiResponse<DashboardStats>>
  }

  async getRecentActivity(limit = 8) {
    return api.get('/admin/dashboard/activity', { params: { limit } }) as Promise<ApiResponse<RecentActivityItem[]>>
  }
}

export default new AdminService()
