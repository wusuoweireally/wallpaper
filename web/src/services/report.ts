import api, { type ApiResponse } from '@/config/api';
import type { User } from '@/services/user';
import type { Post } from '@/stores/forum';
import type { Comment } from '@/stores/forum';

export interface CreateReportDto {
  targetType: 'post' | 'comment';
  targetId: number;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'violence' | 'copyright' | 'misinformation' | 'other';
  description?: string;
}

export interface UpdateReportDto {
  reviewNote?: string;
}

export interface GetReportsDto {
  page?: number;
  limit?: number;
  targetType?: 'post' | 'comment';
  reason?: string;
  status?: string;
  userId?: number;
}

export interface Report {
  id: number;
  userId: number;
  targetType: 'post' | 'comment';
  targetId: number;
  reason: string;
  description?: string;
  status: string;
  reviewedBy?: number;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  post?: Post;
  comment?: Comment;
  reviewer?: User;
}

export interface ReportStats {
  total: number;
  pending: number;
  reviewing: number;
  resolved: number;
  dismissed: number;
  statsByReason: Array<{ reason: string; count: number }>;
  statsByType: Array<{ targetType: string; count: number }>;
}

export interface ReportReason {
  value: string;
  label: string;
  description: string;
}

class ReportService {
  /**
   * 创建举报
   */
  async createReport(data: CreateReportDto) {
    return await api.post('/reports', data);
  }

  /**
   * 获取举报列表（管理员）
   */
  async getReports(params: GetReportsDto = {}) {
    return await api.get('/reports', { params });
  }

  /**
   * 获取单个举报详情
   */
  async getReportById(id: number) {
    return await api.get(`/reports/${id}`);
  }

  /**
   * 更新举报状态（管理员）
   */
  async updateReportStatus(id: number, data: UpdateReportDto) {
    return await api.put(`/reports/${id}/status`, data);
  }

  /**
   * 获取当前用户的举报历史
   */
  async getUserReports(page: number = 1, limit: number = 20) {
    return await api.get('/reports/user/my', { params: { page, limit } });
  }

  /**
   * 获取举报统计信息（管理员）
   */
  async getReportStats() {
    return await api.get('/reports/stats/overview');
  }

  /**
   * 检查是否可以举报某个内容
   */
  async checkCanReport(targetType: string, targetId: number) {
    return await api.get(`/reports/check/${targetType}/${targetId}`);
  }

  /**
   * 获取举报原因选项
   */
  async getReportReasons(): Promise<ReportReason[]> {
    const response = (await api.get(
      "/reports/reasons/options",
    )) as ApiResponse<ReportReason[]>;
    return response.data ?? [];
  }
}

export const reportService = new ReportService();
export default reportService;
