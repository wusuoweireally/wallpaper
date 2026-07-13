import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ViewHistory } from "../entities/view-history.entity";
import { CreateViewHistoryDto } from "../dto/view-history.dto";
import { sanitizeUser } from "../utils/sanitize";
import { normalizePagination } from "../common/pagination";

@Injectable()
export class ViewHistoryService {
  constructor(
    @InjectRepository(ViewHistory)
    private readonly viewHistoryRepository: Repository<ViewHistory>,
  ) {}

  /**
   * 创建浏览记录
   */
  async createViewHistory(
    createViewHistoryDto: CreateViewHistoryDto,
  ): Promise<ViewHistory> {
    const { userId, wallpaperId } = createViewHistoryDto;

    await this.viewHistoryRepository.upsert(
      {
        userId,
        wallpaperId,
        viewedAt: new Date(),
      },
      {
        conflictPaths: ["userId", "wallpaperId"],
        skipUpdateIfNoValuesChanged: false,
      },
    );

    return this.viewHistoryRepository.findOneOrFail({
      where: { userId, wallpaperId },
    });
  }

  /**
   * 获取用户最近30天的浏览记录（支持分页）
   */
  async getUserViewHistory(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ViewHistory[]; total: number }> {
    ({ page, limit } = normalizePagination(page, limit));
    const skip = (page - 1) * limit;

    const [data, total] = await this.viewHistoryRepository.findAndCount({
      where: {
        userId,
        wallpaper: { status: 1 },
      },
      relations: ["wallpaper", "wallpaper.uploader"],
      order: { viewedAt: "DESC" },
      skip,
      take: limit,
    });

    return {
      data: data.map((history) => {
        if (!history.wallpaper?.uploader) return history;

        return {
          ...history,
          wallpaper: {
            ...history.wallpaper,
            uploader: sanitizeUser(
              history.wallpaper.uploader as unknown as Record<string, unknown>,
            ) as unknown as typeof history.wallpaper.uploader,
          },
        };
      }),
      total,
    };
  }

  /**
   * 清理30天前的浏览记录
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldViewHistory(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.viewHistoryRepository.delete({
      viewedAt: LessThan(thirtyDaysAgo),
    });
  }
}
