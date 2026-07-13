import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  CreateReportDto,
  GetReportsDto,
  UpdateReportDto,
} from "../dto/report.dto";
import {
  Report,
  ReportReason,
  ReportStatus,
  ReportTargetSnapshot,
  ReportTargetType,
} from "../entities/report.entity";
import { Post, PostStatus } from "../entities/post.entity";
import { Comment } from "../entities/comment.entity";
import { User } from "../entities/user.entity";
import { normalizePagination } from "../common/pagination";

// TypeORM 查询结果类型

interface ReportStatsByReason {
  reason: string;
  count: number | string;
}

interface ReportStatsByType {
  targetType: string;
  count: number | string;
}

interface ReportUserSummary {
  id: number;
  username: string;
  avatarUrl: string | null;
}

interface ReportTargetSummary {
  id: number;
  type: ReportTargetType;
  title: string | null;
  content: string;
  authorId: number;
  postId: number;
}

export type SafeReport = Omit<
  Report,
  "user" | "reviewer" | "targetSnapshot"
> & {
  user: ReportUserSummary | null;
  reviewer: ReportUserSummary | null;
  target: ReportTargetSummary | null;
};

export interface UserReportSummary {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  resolution: { status: ReportStatus.RESOLVED | ReportStatus.DISMISSED } | null;
}

const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  [ReportStatus.PENDING]: [
    ReportStatus.REVIEWING,
    ReportStatus.RESOLVED,
    ReportStatus.DISMISSED,
  ],
  [ReportStatus.REVIEWING]: [ReportStatus.RESOLVED, ReportStatus.DISMISSED],
  [ReportStatus.RESOLVED]: [],
  [ReportStatus.DISMISSED]: [],
};

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  private toUserSummary(user?: User | null): ReportUserSummary | null {
    if (!user) return null;
    return {
      id: Number(user.id),
      username: user.username,
      avatarUrl: user.avatarUrl,
    };
  }

  private toSafeReports(reports: Report[]): SafeReport[] {
    return reports.map((report) => {
      const { user, reviewer, targetSnapshot, ...data } = report;
      return {
        ...data,
        user: this.toUserSummary(user),
        reviewer: this.toUserSummary(reviewer),
        target: targetSnapshot
          ? {
              id: Number(report.targetId),
              type: report.targetType,
              ...targetSnapshot,
            }
          : null,
      };
    });
  }

  private async findReportEntityById(id: number): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ["user", "reviewer"],
    });

    if (!report) {
      throw new NotFoundException("举报记录不存在");
    }

    return report;
  }

  private async getPublicTargetSnapshot(
    targetType: ReportTargetType,
    targetId: number,
  ): Promise<ReportTargetSnapshot> {
    if (targetType === ReportTargetType.POST) {
      const post = await this.postRepository.findOne({
        where: { id: targetId, status: PostStatus.PUBLISHED },
        select: ["id", "title", "content", "authorId"],
      });
      if (!post) throw new NotFoundException("举报目标不存在或不可见");
      return {
        title: post.title,
        content: post.content,
        authorId: Number(post.authorId),
        postId: Number(post.id),
      };
    }

    const comment = await this.commentRepository
      .createQueryBuilder("comment")
      .innerJoinAndSelect("comment.post", "post")
      .where("comment.id = :targetId", { targetId })
      .andWhere("post.status = :status", { status: PostStatus.PUBLISHED })
      .getOne();
    if (!comment) throw new NotFoundException("举报目标不存在或不可见");
    return {
      title: comment.post.title,
      content: comment.content,
      authorId: Number(comment.authorId),
      postId: Number(comment.postId),
    };
  }

  /**
   * 创建举报
   */
  async createReport(
    createReportDto: CreateReportDto,
    userId: number,
  ): Promise<Report> {
    const targetSnapshot = await this.getPublicTargetSnapshot(
      createReportDto.targetType,
      createReportDto.targetId,
    );

    // 检查是否已经举报过
    const existingReport = await this.reportRepository.findOne({
      where: {
        userId,
        targetType: createReportDto.targetType,
        targetId: createReportDto.targetId,
      },
    });

    if (existingReport) {
      throw new ConflictException("您已经举报过此内容");
    }

    const report = this.reportRepository.create({
      userId,
      ...createReportDto,
      targetSnapshot,
    });

    try {
      return await this.reportRepository.save(report);
    } catch (error: unknown) {
      const databaseError = error as { code?: string; errno?: number };
      if (
        databaseError.code === "ER_DUP_ENTRY" ||
        databaseError.errno === 1062
      ) {
        throw new ConflictException("您已经举报过此内容");
      }
      throw error;
    }
  }

  /**
   * 获取举报列表（管理员功能）
   */
  async getReports(getReportsDto: GetReportsDto): Promise<{
    data: SafeReport[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page: requestedPage = 1,
      limit: requestedLimit = 20,
      targetType,
      reason,
      status,
      userId,
      keyword,
    } = getReportsDto;
    const { page, limit } = normalizePagination(requestedPage, requestedLimit);
    const skip = (page - 1) * limit;

    const queryBuilder = this.reportRepository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.user", "user")
      .leftJoinAndSelect("report.reviewer", "reviewer")
      .select([
        "report.id",
        "report.userId",
        "report.targetType",
        "report.targetId",
        "report.reason",
        "report.description",
        "report.status",
        "report.reviewedBy",
        "report.createdAt",
        "report.updatedAt",
        "user.id",
        "user.username",
        "user.avatarUrl",
        "reviewer.id",
        "reviewer.username",
        "reviewer.avatarUrl",
      ])
      .orderBy("report.createdAt", "DESC")
      .addOrderBy("report.id", "DESC")
      .skip(skip)
      .take(limit);

    if (targetType) {
      queryBuilder.andWhere("report.targetType = :targetType", { targetType });
    }

    if (reason) {
      queryBuilder.andWhere("report.reason = :reason", { reason });
    }

    if (status) {
      queryBuilder.andWhere("report.status = :status", { status });
    }

    if (userId) {
      queryBuilder.andWhere("report.userId = :userId", { userId });
    }

    if (keyword && keyword.trim()) {
      queryBuilder.andWhere(
        "(report.description LIKE :keyword OR user.username LIKE :keyword)",
        { keyword: `%${keyword.trim()}%` },
      );
    }

    const [reports, total] = await queryBuilder.getManyAndCount();
    const data = this.toSafeReports(reports);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取单个举报详情
   */
  async getReportById(id: number): Promise<SafeReport> {
    const report = await this.findReportEntityById(id);
    return this.toSafeReports([report])[0];
  }

  /**
   * 更新举报状态（管理员功能）
   */
  async updateReportStatus(
    id: number,
    updateReportDto: UpdateReportDto,
    adminId: number,
  ): Promise<SafeReport> {
    const report = await this.findReportEntityById(id);

    if (!ALLOWED_TRANSITIONS[report.status].includes(updateReportDto.status)) {
      throw new ConflictException("举报状态已变更或不允许执行该操作");
    }

    const result = await this.reportRepository.update(
      { id, status: report.status },
      {
        status: updateReportDto.status,
        reviewedBy: adminId,
        reviewNote: updateReportDto.reviewNote,
        updatedAt: new Date(),
      },
    );
    if (result.affected !== 1) {
      throw new ConflictException("举报已被其他管理员处理，请刷新后重试");
    }

    return await this.getReportById(id);
  }

  /**
   * 获取用户的举报历史
   */
  async getUserReports(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: UserReportSummary[];
    total: number;
    page: number;
    limit: number;
  }> {
    ({ page, limit } = normalizePagination(page, limit));
    const skip = (page - 1) * limit;

    const [reports, total] = await this.reportRepository.findAndCount({
      where: { userId },
      select: [
        "id",
        "targetType",
        "targetId",
        "reason",
        "description",
        "status",
        "createdAt",
        "updatedAt",
      ],
      order: { createdAt: "DESC", id: "DESC" },
      skip,
      take: limit,
    });

    const data = reports.map((report) => ({
      id: Number(report.id),
      targetType: report.targetType,
      targetId: Number(report.targetId),
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      resolution:
        report.status === ReportStatus.RESOLVED ||
        report.status === ReportStatus.DISMISSED
          ? { status: report.status }
          : null,
    }));

    return { data, total, page, limit };
  }

  /**
   * 获取举报统计信息
   */
  async getReportStats(): Promise<{
    total: number;
    pending: number;
    reviewing: number;
    resolved: number;
    dismissed: number;
    totalReports: number;
    pendingReports: number;
    processingReports: number;
    resolvedReports: number;
    rejectedReports: number;
    statsByReason: Array<{ reason: string; count: number }>;
    statsByType: Array<{ targetType: string; count: number }>;
  }> {
    const [total, pending, reviewing, resolved, dismissed] = await Promise.all([
      this.reportRepository.count(),
      this.reportRepository.count({ where: { status: ReportStatus.PENDING } }),
      this.reportRepository.count({
        where: { status: ReportStatus.REVIEWING },
      }),
      this.reportRepository.count({ where: { status: ReportStatus.RESOLVED } }),
      this.reportRepository.count({
        where: { status: ReportStatus.DISMISSED },
      }),
    ]);

    // 按原因统计
    const rawStatsByReason = await this.reportRepository
      .createQueryBuilder("report")
      .select("report.reason", "reason")
      .addSelect("COUNT(*)", "count")
      .groupBy("report.reason")
      .getRawMany<ReportStatsByReason>();

    // 按类型统计
    const rawStatsByType = await this.reportRepository
      .createQueryBuilder("report")
      .select("report.targetType", "targetType")
      .addSelect("COUNT(*)", "count")
      .groupBy("report.targetType")
      .getRawMany<ReportStatsByType>();

    return {
      total,
      pending,
      reviewing,
      resolved,
      dismissed,
      totalReports: total,
      pendingReports: pending,
      processingReports: reviewing,
      resolvedReports: resolved,
      rejectedReports: dismissed,
      statsByReason: rawStatsByReason.map(({ reason, count }) => ({
        reason,
        count: Number(count),
      })),
      statsByType: rawStatsByType.map(({ targetType, count }) => ({
        targetType,
        count: Number(count),
      })),
    };
  }

  /**
   * 检查用户是否可以举报某个内容
   */
  async canReport(
    userId: number,
    targetType: ReportTargetType,
    targetId: number,
  ): Promise<boolean> {
    const existingReport = await this.reportRepository.findOne({
      where: {
        userId,
        targetType,
        targetId,
      },
    });

    return !existingReport;
  }

  /**
   * 检查是否可以举报（公开接口）
   */
  async checkCanReport(
    userId: number,
    targetType: ReportTargetType,
    targetId: number,
  ): Promise<{ canReport: boolean; reason?: string }> {
    try {
      await this.getPublicTargetSnapshot(targetType, targetId);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      return {
        canReport: false,
        reason: "举报目标不存在或不可见",
      };
    }

    const canReport = await this.canReport(userId, targetType, targetId);
    return {
      canReport,
      reason: canReport ? undefined : "您已经举报过此内容",
    };
  }

  /**
   * 获取举报原因选项
   */
  getReportReasons(): Array<{
    value: ReportReason;
    label: string;
    description: string;
  }> {
    return [
      {
        value: ReportReason.SPAM,
        label: "垃圾信息",
        description: "广告、灌水、重复内容等",
      },
      {
        value: ReportReason.INAPPROPRIATE,
        label: "不当内容",
        description: "不适当、冒犯性或令人不适的内容",
      },
      {
        value: ReportReason.HARASSMENT,
        label: "骚扰行为",
        description: "人身攻击、霸凌、骚扰等",
      },
      {
        value: ReportReason.VIOLENCE,
        label: "暴力内容",
        description: "暴力、血腥或危险行为相关内容",
      },
      {
        value: ReportReason.COPYRIGHT,
        label: "版权问题",
        description: "侵犯版权、盗用他人作品等",
      },
      {
        value: ReportReason.MISINFORMATION,
        label: "虚假信息",
        description: "虚假、误导性或错误的信息",
      },
      {
        value: ReportReason.OTHER,
        label: "其他问题",
        description: "其他违规或问题内容",
      },
    ];
  }
}
