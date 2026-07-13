import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../guards/roles.guard";
import { Roles } from "../../decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import { AdminDashboardService } from "../../services/admin-dashboard.service";
import { normalizeLimit } from "../../common/pagination";

@Controller("admin/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get("stats")
  async getStats() {
    const stats = await this.dashboardService.getDashboardStats();
    return {
      success: true,
      message: "获取仪表盘统计成功",
      data: stats,
    };
  }

  @Get("activity")
  async getRecentActivity(@Query("limit") limit?: string) {
    const take = normalizeLimit(Number(limit), 8, 20);
    const activity = await this.dashboardService.getRecentActivity(take);
    return {
      success: true,
      message: "获取最新活动成功",
      data: activity,
    };
  }
}
