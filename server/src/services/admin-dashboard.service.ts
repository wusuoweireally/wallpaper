import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { Wallpaper } from "../entities/wallpaper.entity";
import { Post, PostStatus } from "../entities/post.entity";
import { Report, ReportStatus } from "../entities/report.entity";

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalWallpapers: number;
  newWallpapersThisMonth: number;
  totalPosts: number;
  newPostsThisMonth: number;
  totalReports: number;
  pendingReports: number;
}

export interface RecentActivityItem {
  id: number;
  reason: Report["reason"];
  status: ReportStatus;
  createdAt: Date;
  reporterId: number;
  reporterUsername?: string;
}

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepository: Repository<Wallpaper>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  private getCurrentMonthRange(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const { start, end } = this.getCurrentMonthRange();

    // 合并同类 Count 查询：相同表的多条件计数用 CASE WHEN 一次扫描完成
    const [
      usersRow,
      wallpapersRow,
      postsRow,
      reportsRow,
    ] = await Promise.all([
      this.userRepository
        .createQueryBuilder("u")
        .select("COUNT(*)", "totalUsers")
        .addSelect("SUM(CASE WHEN u.status = 1 THEN 1 ELSE 0 END)", "activeUsers")
        .getRawOne<{ totalUsers: string; activeUsers: string }>(),
      this.wallpaperRepository
        .createQueryBuilder("w")
        .select("COUNT(*)", "totalWallpapers")
        .addSelect(
          "SUM(CASE WHEN w.status = 1 AND w.createdAt BETWEEN :start AND :end THEN 1 ELSE 0 END)",
          "newWallpapersThisMonth",
        )
        .setParameters({ start, end })
        .getRawOne<{ totalWallpapers: string; newWallpapersThisMonth: string }>(),
      this.postRepository
        .createQueryBuilder("p")
        .select("COUNT(*)", "totalPosts")
        .addSelect(
          "SUM(CASE WHEN p.status = :published AND p.createdAt BETWEEN :start AND :end THEN 1 ELSE 0 END)",
          "newPostsThisMonth",
        )
        .setParameters({ start, end, published: PostStatus.PUBLISHED })
        .getRawOne<{ totalPosts: string; newPostsThisMonth: string }>(),
      this.reportRepository
        .createQueryBuilder("r")
        .select("COUNT(*)", "totalReports")
        .addSelect(
          "SUM(CASE WHEN r.status = :pending THEN 1 ELSE 0 END)",
          "pendingReports",
        )
        .setParameters({ pending: ReportStatus.PENDING })
        .getRawOne<{ totalReports: string; pendingReports: string }>(),
    ]);

    const totalUsers = Number(usersRow?.totalUsers ?? 0);
    const activeUsers = Number(usersRow?.activeUsers ?? 0);
    const totalWallpapers = Number(wallpapersRow?.totalWallpapers ?? 0);
    const newWallpapersThisMonth = Number(wallpapersRow?.newWallpapersThisMonth ?? 0);
    const totalPosts = Number(postsRow?.totalPosts ?? 0);
    const newPostsThisMonth = Number(postsRow?.newPostsThisMonth ?? 0);
    const totalReports = Number(reportsRow?.totalReports ?? 0);
    const pendingReports = Number(reportsRow?.pendingReports ?? 0);

    return {
      totalUsers: Number(totalUsers),
      activeUsers: Number(activeUsers),
      totalWallpapers: Number(totalWallpapers),
      newWallpapersThisMonth: Number(newWallpapersThisMonth),
      totalPosts: Number(totalPosts),
      newPostsThisMonth: Number(newPostsThisMonth),
      totalReports: Number(totalReports),
      pendingReports: Number(pendingReports),
    };
  }

  async getRecentActivity(limit = 8): Promise<RecentActivityItem[]> {
    const reports = await this.reportRepository.find({
      relations: ["user"],
      order: { createdAt: "DESC" },
      take: limit,
    });

    return reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt,
      reporterId: report.userId,
      reporterUsername: report.user?.username,
    }));
  }
}
