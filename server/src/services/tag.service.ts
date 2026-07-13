import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, In, Repository } from "typeorm";
import { Tag } from "../entities/tag.entity";
import { Wallpaper, WallpaperStatus } from "../entities/wallpaper.entity";
import { WallpaperTag } from "../entities/wallpaper-tag.entity";
import { CreateTagDto } from "../dto/tag.dto";
import { normalizeLimit, normalizePagination } from "../common/pagination";

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(WallpaperTag)
    private wallpaperTagRepository: Repository<WallpaperTag>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private generateSlug(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, "-");
  }

  /**
   * 搜索标签
   * @param keyword 搜索关键词
   * @param limit 返回数量限制
   */
  async searchTags(keyword?: string, limit: number = 10): Promise<Tag[]> {
    limit = normalizeLimit(limit, 10, 50);
    const queryBuilder = this.tagRepository.createQueryBuilder("tag");

    if (keyword) {
      queryBuilder.where("tag.name LIKE :keyword", { keyword: `%${keyword}%` });
    }

    queryBuilder.orderBy("tag.usageCount", "DESC").take(limit);

    return queryBuilder.getMany();
  }

  /**
   * 创建新标签
   * @param createTagDto 创建标签数据
   */
  async createTag(createTagDto: CreateTagDto): Promise<Tag> {
    return this.findOrCreateTag(this.tagRepository, createTagDto.name);
  }

  private async findOrCreateTag(
    repository: Repository<Tag>,
    name: string,
  ): Promise<Tag> {
    const normalizedName = name.trim();
    const slug = this.generateSlug(normalizedName);

    // 先按 slug 加锁，避免并发创建同一标签时 RR 快照读不到对方已提交行
    const locked = await repository
      .createQueryBuilder("tag")
      .setLock("pessimistic_write")
      .where("tag.slug = :slug", { slug })
      .getOne();
    if (locked) return locked;

    await repository
      .createQueryBuilder()
      .insert()
      .into(Tag)
      .values({ name: normalizedName, slug, usageCount: 0 })
      .orIgnore()
      .execute();

    const created = await repository
      .createQueryBuilder("tag")
      .setLock("pessimistic_write")
      .where("tag.slug = :slug", { slug })
      .getOne();
    if (created) return created;

    return repository.findOneOrFail({ where: { slug } });
  }

  /** 按 id 升序锁标签行，保证并发挂标签/改 usageCount 时加锁顺序一致，避免死锁 */
  private async lockTagsByIds(
    tagRepo: Repository<Tag>,
    tagIds: number[],
  ): Promise<void> {
    if (tagIds.length === 0) return;
    const ids = [...new Set(tagIds.map(Number))].sort((a, b) => a - b);
    await tagRepo
      .createQueryBuilder("tag")
      .setLock("pessimistic_write")
      .where("tag.id IN (:...ids)", { ids })
      .orderBy("tag.id", "ASC")
      .getMany();
  }

  /**
   * 获取标签分页列表
   */
  async getTagsWithPagination(query: {
    page?: number;
    limit?: number;
    keyword?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<{ data: Tag[]; total: number; page: number; limit: number }> {
    const {
      page: requestedPage = 1,
      limit: requestedLimit = 20,
      keyword,
      sortBy = "usageCount",
      sortOrder = "DESC",
    } = query;

    const { page, limit } = normalizePagination(requestedPage, requestedLimit);

    const qb = this.tagRepository.createQueryBuilder("tag");

    if (keyword && keyword.trim()) {
      qb.where("(tag.name LIKE :keyword OR tag.slug LIKE :keyword)", {
        keyword: `%${keyword.trim()}%`,
      });
    }

    const validSort = ["usageCount", "name", "createdAt"];
    const orderField = validSort.includes(sortBy) ? sortBy : "usageCount";
    const orderDirection = sortOrder === "ASC" ? "ASC" : "DESC";

    const [data, total] = await qb
      .orderBy(`tag.${orderField}`, orderDirection)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * 根据壁纸ID获取关联标签
   * @param wallpaperId 壁纸ID
   */
  async getTagsByWallpaperId(wallpaperId: number): Promise<Tag[]> {
    const wallpaperTags = await this.wallpaperTagRepository.find({
      where: { wallpaperId },
      relations: ["tag"],
    });

    return wallpaperTags.map((wt) => wt.tag);
  }

  /**
   * 根据ID获取标签
   * @param id 标签ID
   */
  async getTagById(id: number): Promise<Tag | null> {
    return this.tagRepository.findOne({ where: { id } });
  }

  async updateTag(id: number, name: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException("标签不存在");
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new BadRequestException("标签名称不能为空");
    }
    const slug = this.generateSlug(normalizedName);
    const duplicate = await this.tagRepository.findOne({ where: { slug } });
    if (duplicate && duplicate.id !== id) {
      throw new BadRequestException("标签名称已存在");
    }
    tag.name = normalizedName;
    tag.slug = slug;

    return this.tagRepository.save(tag);
  }

  async deleteTag(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const tag = await manager
        .getRepository(Tag)
        .createQueryBuilder("tag")
        .setLock("pessimistic_write")
        .where("tag.id = :id", { id })
        .getOne();
      if (!tag) {
        throw new NotFoundException("标签不存在");
      }
      await manager.delete(WallpaperTag, { tagId: id });
      await manager.delete(Tag, id);
    });
  }

  /**
   * 增加标签使用次数
   * @param tagId 标签ID
   */

  async incrementUsageCount(tagId: number): Promise<void> {
    await this.tagRepository.increment({ id: tagId }, "usageCount", 1);
  }

  /**
   * 减少标签使用次数
   * @param tagId 标签ID
   */
  async decrementUsageCount(tagId: number): Promise<void> {
    await this.tagRepository
      .createQueryBuilder()
      .update(Tag)
      .set({ usageCount: () => "GREATEST(usage_count - 1, 0)" })
      .where("id = :tagId", { tagId })
      .execute();
  }

  /**
   * 处理壁纸标签关联
   * @param wallpaperId 壁纸ID
   * @param tagNames 标签名称数组
   * @param allowCreate 是否允许创建新标签。
   *   普通用户上传时为 false：仅能关联已存在标签，忽略新标签，
   *   避免绕过 “创建标签需管理员” 的限制而污染标签库。
   */
  async processWallpaperTags(
    wallpaperId: number,
    tagNames: string[],
    allowCreate = false,
  ): Promise<void> {
    await this.dataSource.transaction((manager) =>
      this.attachWallpaperTags(manager, wallpaperId, tagNames, allowCreate),
    );
  }

  async attachWallpaperTags(
    manager: EntityManager,
    wallpaperId: number,
    tagNames: string[],
    allowCreate = false,
  ): Promise<void> {
    if (!tagNames || tagNames.length === 0) return;

    const normalizedNames = Array.from(
      new Set(tagNames.map((t) => t.trim()).filter(Boolean)),
    );
    if (normalizedNames.length === 0) return;

    const tagRepo = manager.getRepository(Tag);
    const wallpaperTagRepo = manager.getRepository(WallpaperTag);
    const wallpaper = await manager
      .getRepository(Wallpaper)
      .createQueryBuilder("wallpaper")
      .setLock("pessimistic_write")
      .where("wallpaper.id = :wallpaperId", { wallpaperId })
      .getOne();
    if (!wallpaper) {
      throw new NotFoundException("壁纸不存在");
    }
    const slugs = normalizedNames.map((name) => this.generateSlug(name));
    const existingTags = await tagRepo.find({ where: { slug: In(slugs) } });
    const existingBySlug = new Map(existingTags.map((tag) => [tag.slug, tag]));

    if (!allowCreate) {
      const missingTags = normalizedNames.filter(
        (name) => !existingBySlug.has(this.generateSlug(name)),
      );
      if (missingTags.length > 0) {
        throw new BadRequestException(
          `标签不存在或不可用：${missingTags.join("、")}`,
        );
      }
    }

    const tags = [...existingTags];
    if (allowCreate) {
      for (const name of normalizedNames) {
        const slug = this.generateSlug(name);
        if (existingBySlug.has(slug)) continue;
        const tag = await this.findOrCreateTag(tagRepo, name);
        existingBySlug.set(slug, tag);
        tags.push(tag);
      }
    }

    const existingAssociations = await wallpaperTagRepo.find({
      where: { wallpaperId },
    });
    const associatedTagIds = new Set(
      existingAssociations.map((association) => association.tagId),
    );
    const newTags = tags
      .filter((tag) => !associatedTagIds.has(tag.id))
      .sort((a, b) => a.id - b.id);
    if (newTags.length === 0) return;

    // 先锁标签再写关联/计数，避免并发管理员上传对同一 tag 死锁
    await this.lockTagsByIds(
      tagRepo,
      newTags.map((tag) => tag.id),
    );

    await wallpaperTagRepo.insert(
      newTags.map((tag) => ({ wallpaperId, tagId: tag.id })),
    );
    if (wallpaper.status === WallpaperStatus.APPROVED) {
      await tagRepo.increment(
        { id: In(newTags.map((tag) => tag.id)) },
        "usageCount",
        1,
      );
    }
  }

  /**
   * 替换指定壁纸的标签
   */
  async replaceWallpaperTags(
    wallpaperId: number,
    tagNames: string[],
  ): Promise<Tag[]> {
    const uniqueNames = Array.from(
      new Set(
        (tagNames || [])
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      ),
    );

    // 事务内：删除旧关联 + 创建新关联 + 更新 usageCount 原子执行
    return await this.dataSource.transaction(async (manager) => {
      const tagRepo = manager.getRepository(Tag);
      const wallpaperTagRepo = manager.getRepository(WallpaperTag);

      const wallpaper = await manager
        .getRepository(Wallpaper)
        .createQueryBuilder("wallpaper")
        .setLock("pessimistic_write")
        .where("wallpaper.id = :wallpaperId", { wallpaperId })
        .getOne();
      if (!wallpaper) {
        throw new NotFoundException("壁纸不存在");
      }

      const currentTags = await wallpaperTagRepo.find({
        where: { wallpaperId },
      });

      const tags: Tag[] = [];
      for (const name of uniqueNames) {
        const slug = this.generateSlug(name);
        let tag = await tagRepo.findOne({ where: { slug } });

        if (!tag) {
          tag = await this.findOrCreateTag(tagRepo, name);
        }

        tags.push(tag);
      }

      const currentTagIds = new Set(
        currentTags.map((relation) => relation.tagId),
      );
      const nextTagIds = new Set(tags.map((tag) => tag.id));
      const removedIds = [...currentTagIds]
        .filter((id) => !nextTagIds.has(id))
        .sort((a, b) => a - b);
      const addedTags = tags
        .filter((tag) => !currentTagIds.has(tag.id))
        .sort((a, b) => a.id - b.id);

      await this.lockTagsByIds(tagRepo, [
        ...removedIds,
        ...addedTags.map((tag) => tag.id),
      ]);

      if (removedIds.length > 0) {
        await wallpaperTagRepo.delete({
          wallpaperId,
          tagId: In(removedIds),
        });
        if (wallpaper.status === WallpaperStatus.APPROVED) {
          await tagRepo
            .createQueryBuilder()
            .update(Tag)
            .set({ usageCount: () => "GREATEST(usage_count - 1, 0)" })
            .where("id IN (:...removedIds)", { removedIds })
            .execute();
        }
      }

      if (addedTags.length > 0) {
        await wallpaperTagRepo.insert(
          addedTags.map((tag) => ({ wallpaperId, tagId: tag.id })),
        );
        if (wallpaper.status === WallpaperStatus.APPROVED) {
          await tagRepo.increment(
            { id: In(addedTags.map((tag) => tag.id)) },
            "usageCount",
            1,
          );
        }
      }

      return tags;
    });
  }
}
