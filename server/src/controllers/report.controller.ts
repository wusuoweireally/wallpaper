import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  CurrentUser,
  type CurrentUserType,
} from "../decorators/current-user.decorator";
import { CreateReportDto } from "../dto/report.dto";
import { ReportService } from "../services/report.service";

@Controller("reports")
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * 获取举报原因选项（公开接口）
   */
  @Get("reasons/options")
  getReportReasons() {
    const reasons = this.reportService.getReportReasons();
    return {
      success: true,
      message: "获取举报原因选项成功",
      data: reasons,
    };
  }

  /**
   * 创建举报
   * 全局限流(200/min)对灌水举报队列太宽，收紧到每小时个位数
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  async createReport(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const report = await this.reportService.createReport(
      createReportDto,
      user.userId,
    );
    return {
      success: true,
      message: "举报提交成功，我们会尽快处理",
      data: report,
    };
  }
}
