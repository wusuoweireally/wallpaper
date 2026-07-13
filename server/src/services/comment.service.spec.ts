import { NotFoundException } from "@nestjs/common";
import type { DataSource, EntityManager, Repository } from "typeorm";
import { Comment } from "../entities/comment.entity";
import { CommentLike } from "../entities/comment-like.entity";
import { Post, PostStatus } from "../entities/post.entity";
import { CommentService } from "./comment.service";

describe("CommentService post visibility", () => {
  const createQuery = (result: Comment | null = null) => {
    const query = {
      innerJoin: jest.fn(),
      leftJoin: jest.fn(),
      addSelect: jest.fn(),
      setLock: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      getOne: jest.fn().mockResolvedValue(result),
    };
    Object.values(query).forEach((method) => {
      if (method !== query.getOne) method.mockReturnValue(query);
    });
    return query;
  };

  const createService = (
    commentRepository: Partial<Repository<Comment>> = {},
    postRepository: Partial<Repository<Post>> = {},
    dataSource: Partial<DataSource> = {},
  ) =>
    new CommentService(
      commentRepository as Repository<Comment>,
      postRepository as Repository<Post>,
      {} as Repository<CommentLike>,
      dataSource as DataSource,
    );

  it("hides a comment unless its post is published", async () => {
    const query = createQuery();
    const service = createService({
      createQueryBuilder: jest.fn().mockReturnValue(query),
    });

    await expect(service.findById(1)).rejects.toBeInstanceOf(NotFoundException);
    expect(query.innerJoin).toHaveBeenCalledWith(
      "comment.post",
      "post",
      "post.status = :publishedStatus",
      { publishedStatus: PostStatus.PUBLISHED },
    );
  });

  it("rejects creating a comment on an unpublished post", async () => {
    const postQuery = createQuery();
    const postRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(postQuery),
    } as unknown as Repository<Post>;
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === Post ? postRepository : ({} as Repository<Comment>),
      ),
    } as unknown as EntityManager;
    const transaction = jest.fn(
      (callback: (transactionManager: EntityManager) => Promise<unknown>) =>
        callback(manager),
    );
    const dataSource = { transaction } as unknown as DataSource;
    const service = createService({}, {}, dataSource);

    await expect(
      service.create({ postId: 7, content: "test" }, 3),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(postQuery.where).toHaveBeenCalledWith("post.id = :postId", {
      postId: 7,
    });
    expect(postQuery.andWhere).toHaveBeenCalledWith("post.status = :status", {
      status: PostStatus.PUBLISHED,
    });
  });
});
