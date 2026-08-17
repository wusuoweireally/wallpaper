import api, { type ApiResponse } from "@/config/api"

export interface CreateReportDto {
  targetType: "post" | "comment"
  targetId: number
  reason:
    "spam" | "inappropriate" | "harassment" | "violence" | "copyright" | "misinformation" | "other"
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
   * 获取举报原因选项
   */
  async getReportReasons(): Promise<ReportReason[]> {
    const response = (await api.get("/reports/reasons/options")) as ApiResponse<ReportReason[]>
    return response.data ?? []
  }
}

export const reportService = new ReportService()
export default reportService
