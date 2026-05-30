import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Tag } from "../entities/tag.entity";
import { WallpaperTag } from "../entities/wallpaper-tag.entity";
import { CreateTagDto } from "../dto/tag.dto";

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
    const { name } = createTagDto;
    const normalizedName = name.trim();
    const slug = this.generateSlug(normalizedName);

    // 检查标签是否已存在
    const existingTag = await this.tagRepository.findOne({
      where: { slug },
    });

    if (existingTag) {
      return existingTag;
    }

    const tag = this.tagRepository.create({
      name: normalizedName,
      slug,
      usageCount: 0,
    });

    return this.tagRepository.save(tag);
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
      page = 1,
      limit = 20,
      keyword,
      sortBy = "usageCount",
      sortOrder = "DESC",
    } = query;

    const qb = this.tagRepository.createQueryBuilder("tag");

    if (keyword && keyword.trim()) {
      qb.where("(tag.name LIKE :keyword OR tag.slug LIKE :keyword)", {
        keyword: `%${keyword.trim()}%`,
      });
    }

    const validSort = ["usageCount", "name", "createdAt"];
    const orderField = validSort.includes(sortBy) ? sortBy : "usageCount";
    const orderDirection = sortOrder === "ASC" ? "ASC" : "DESC";

    const take = Math.min(Math.max(limit, 1), 100);
    const currentPage = Math.max(page, 1);

    const [data, total] = await qb
      .orderBy(`tag.${orderField}`, orderDirection)
      .skip((currentPage - 1) * take)
      .take(take)
      .getManyAndCount();

    return {
      data,
      total,
      page: currentPage,
      limit: take,
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
    tag.name = normalizedName;
    tag.slug = this.generateSlug(normalizedName);

    return this.tagRepository.save(tag);
  }

  async deleteTag(id: number): Promise<void> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException("标签不存在");
    }

    await this.tagRepository.delete(id);
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
    await this.tagRepository.decrement({ id: tagId }, "usageCount", 1);
  }

  /**
   * 根据 slug 查找已存在的标签
   */
  private async findTagByName(name: string): Promise<Tag | null> {
    const slug = this.generateSlug(name.trim());
    return this.tagRepository.findOne({ where: { slug } });
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
    if (!tagNames || tagNames.length === 0) return;

    const normalizedNames = Array.from(
      new Set(tagNames.map((t) => t.trim()).filter(Boolean)),
    );
    if (normalizedNames.length === 0) return;

    // 批量查询已存在的标签（避免 N+1）
    const slugs = normalizedNames.map((n) => this.generateSlug(n));
    const existingTags = await this.tagRepository.find({
      where: slugs.map((s) => ({ slug: s })),
    });
    const existingBySlug = new Map(existingTags.map((t) => [t.slug, t]));

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

    const tags: Tag[] = [];
    for (const name of normalizedNames) {
      const slug = this.generateSlug(name);
      let tag = existingBySlug.get(slug);
      if (!tag) {
        if (!allowCreate) continue;
        tag = await this.createTag({ name });
      }
      tags.push(tag);
    }

    if (tags.length === 0) return;

    // 批量检查已有关联
    const existingAssociations = await this.wallpaperTagRepository.find({
      where: { wallpaperId },
    });
    const associatedTagIds = new Set(existingAssociations.map((a) => a.tagId));

    const newTags = tags.filter((t) => !associatedTagIds.has(t.id));
    for (const tag of newTags) {
      await this.wallpaperTagRepository.save(
        this.wallpaperTagRepository.create({ wallpaperId, tagId: tag.id }),
      );
      await this.incrementUsageCount(tag.id);
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

      const currentTags = await wallpaperTagRepo.find({
        where: { wallpaperId },
        relations: ["tag"],
      });

      if (currentTags.length > 0) {
        await wallpaperTagRepo.delete({ wallpaperId });
        for (const relation of currentTags) {
          if (relation.tag && relation.tag.usageCount > 0) {
            await tagRepo.decrement({ id: relation.tagId }, "usageCount", 1);
          }
        }
      }

      if (uniqueNames.length === 0) {
        return [];
      }

      const tags: Tag[] = [];
      for (const name of uniqueNames) {
        const slug = this.generateSlug(name);
        let tag = await tagRepo.findOne({ where: { slug } });

        if (!tag) {
          tag = tagRepo.create({ name, slug, usageCount: 0 });
          await tagRepo.save(tag);
        }

        tags.push(tag);
        await wallpaperTagRepo.save(
          wallpaperTagRepo.create({ wallpaperId, tagId: tag.id }),
        );
        await tagRepo.increment({ id: tag.id }, "usageCount", 1);
      }

      return tags;
    });
  }
}
