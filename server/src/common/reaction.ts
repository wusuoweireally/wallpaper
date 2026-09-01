import { EntityTarget, EntityManager, ObjectLiteral } from "typeorm";
import { NotFoundException } from "@nestjs/common";

/**
 * 点赞/收藏通用事务骨架（须在事务内调用）：
 * 锁父行 → 判重 → 插入/删除关联 → 计数增减。
 *
 * 壁纸收藏(wallpaper.service)、帖子点赞(post.service)、评论点赞(comment.service)
 * 曾是三份逐字拷贝；计数防漂移类修复现在只需要改这一处。
 * 先锁父行再做增删决策，保证同一资源的并发点赞串行化。
 */
export interface ReactionConfig {
  /** 父实体（Wallpaper/Post/Comment），用于锁行与计数 */
  parentEntity: EntityTarget<ObjectLiteral>;
  /** 锁定父行的条件，可带状态过滤，如 { id, status: 1 } */
  parentWhere: Record<string, unknown>;
  /** 关联表实体（UserFavorite/PostLike/CommentLike） */
  relationEntity: EntityTarget<ObjectLiteral>;
  /** 关联唯一键，如 { wallpaperId, userId } */
  relationWhere: Record<string, unknown>;
  /** 父实体上的计数字段（TypeORM 属性名） */
  countField: string;
  /** 计数列的数据库列名（GREATEST 递减用） */
  countColumn: string;
  /** 父行不存在时的对外文案 */
  notFoundMessage: string;
  /** add=仅确保存在；remove=仅移除；toggle=按当前状态翻转 */
  mode: "add" | "remove" | "toggle";
}

export interface ReactionResult {
  /** 操作后关联是否存在（即点赞/收藏是否处于生效态） */
  active: boolean;
  /** 操作后的父行计数 */
  count: number;
}

export async function applyReaction(
  tx: EntityManager,
  config: ReactionConfig,
): Promise<ReactionResult> {
  const parentRepo = tx.getRepository(config.parentEntity);
  const relationRepo = tx.getRepository(config.relationEntity);

  const keys = Object.keys(config.parentWhere);
  const clause = keys.map((key) => `parent.${key} = :${key}`).join(" AND ");
  const parent = await parentRepo
    .createQueryBuilder("parent")
    .setLock("pessimistic_write")
    .where(clause, config.parentWhere)
    .getOne();
  if (!parent) {
    throw new NotFoundException(config.notFoundMessage);
  }
  // ObjectLiteral 索引签名为 any,主键统一收敛为 number
  const parentId = Number(parent.id);

  const existing = await relationRepo.findOne({
    where: config.relationWhere,
  });

  if (!existing && config.mode === "remove") {
    return { active: false, count: Number(parent[config.countField]) };
  }
  if (existing && config.mode === "add") {
    return { active: true, count: Number(parent[config.countField]) };
  }

  if (existing) {
    await relationRepo.delete(config.relationWhere);
    await parentRepo
      .createQueryBuilder()
      .update(config.parentEntity)
      .set({
        [config.countField]: () => `GREATEST(${config.countColumn} - 1, 0)`,
      })
      .where("id = :id", { id: parentId })
      .execute();
    return {
      active: false,
      count: Math.max(0, Number(parent[config.countField]) - 1),
    };
  }

  await relationRepo.save(relationRepo.create(config.relationWhere));
  await parentRepo.increment({ id: parentId }, config.countField, 1);
  return { active: true, count: Number(parent[config.countField]) + 1 };
}
