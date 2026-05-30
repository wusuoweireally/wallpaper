import api, { type ApiResponse } from "@/config/api"

export interface CreateReportDto {
  targetType: "post" | "comment"
  targetId: number
  reason:
    | "spam"
    | "inappropriate"
    | "harassment"
    | "violence"
    | "copyright"
    | "misinformation"
    | "other"
  description?: string
}

export interface ReportReason {
  value: string
  label: string
  description: string
}

class ReportService {
  /**
   * 创建举报
   */
  async createReport(data: CreateReportDto) {
    return await api.post("/reports", data)
  }

  /**
   * 获取当前用户的举报历史
   */
  async getUserReports(page: number = 1, limit: number = 20) {
    return await api.get("/reports/user/my", { params: { page, limit } })
  }

  /**
   * 检查是否可以举报某个内容
   */
  async checkCanReport(targetType: string, targetId: number) {
    return await api.get(`/reports/check/${targetType}/${targetId}`)
  }

  /**
   * 获取举报原因选项
   */
  async getReportReasons(): Promise<ReportReason[]> {
    const response = (await api.get("/reports/reasons/options")) as ApiResponse<ReportReason[]>
    return response.data ?? []
  }
}

export const reportService = new ReportService()
export default reportService
