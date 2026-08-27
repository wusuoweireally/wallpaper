import { NotFoundException } from "@nestjs/common";
import type { DataSource, Repository } from "typeorm";
import { PostBookmark } from "../entities/post-bookmark.entity";
import { PostLike } from "../entities/post-like.entity";
import { Post, PostStatus } from "../entities/post.entity";
import { PostService } from "./post.service";

describe("PostService force-like semantics", () => {
  const post = Object.assign(new Post(), {
    id: 42,
    status: PostStatus.PUBLISHED,
    likeCount: 5,
  });

  const createLockedPostQuery = (entity: Post | null = post) => {
    const query = {
      setLock: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(entity),
    };
    Object.values(query).forEach((method) => {
      if (method !== query.getOne) method.mockReturnValue(query);
    });
    return query;
  };

  const createService = (
    likeRepo: Record<string, jest.Mock>,
    managerDelete = jest.fn().mockResolvedValue({ affected: 0 }),
    lockedPost: Post | null = post,
  ) => {
    const lockedQuery = createLockedPostQuery(lockedPost);
    const postRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(lockedQuery),
      increment: jest.fn(),
    };
    const getRepository = jest.fn((target: unknown) =>
      target === Post ? postRepository : likeRepo,
    );
    const manager = {
      getRepository,
      delete: managerDelete,
    };
    const dataSource = {
      transaction: jest.fn(
        (callback: (transactionManager: typeof manager) => unknown) =>
          callback(manager),
      ),
    };

    return {
      service: new PostService(
        {} as Repository<Post>,
        likeRepo as unknown as Repository<PostLike>,
        {} as Repository<PostBookmark>,
        dataSource as unknown as DataSource,
      ),
      postRepository,
    };
  };

  it("addLike is idempotent when like already exists", async () => {
    const likes = {
      findOne: jest.fn().mockResolvedValue({ id: 9, postId: 42, userId: 7 }),
      create: jest.fn(),
      save: jest.fn(),
    };
    const { service, postRepository } = createService(likes);

    await expect(service.addLike(42, 7)).resolves.toEqual({
      isLiked: true,
      likeCount: 5,
    });
    expect(likes.save).not.toHaveBeenCalled();
    expect(postRepository.increment).not.toHaveBeenCalled();
  });

  it("addLike creates like and increments count when absent", async () => {
    const likes = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue({ postId: 42, userId: 7 }),
      save: jest.fn().mockResolvedValue({ id: 1 }),
    };
    const { service, postRepository } = createService(likes);

    await expect(service.addLike(42, 7)).resolves.toEqual({
      isLiked: true,
      likeCount: 6,
    });
    expect(likes.create).toHaveBeenCalledWith({ postId: 42, userId: 7 });
    expect(likes.save).toHaveBeenCalled();
    expect(postRepository.increment).toHaveBeenCalledWith(
      { id: 42 },
      "likeCount",
      1,
    );
  });

  it("removeLike is idempotent when like is absent", async () => {
    const likes = {
      findOne: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
    };
    const { service } = createService(likes);

    await expect(service.removeLike(42, 7)).resolves.toEqual({
      isLiked: false,
      likeCount: 5,
    });
    expect(likes.delete).not.toHaveBeenCalled();
  });

  it("removeLike decrements count when like existed", async () => {
    const updateExecute = jest.fn().mockResolvedValue({ affected: 1 });
    const updateQuery = {
      update: jest.fn(),
      set: jest.fn(),
      where: jest.fn(),
      execute: updateExecute,
    };
    Object.values(updateQuery).forEach((method) => {
      if (method !== updateExecute) method.mockReturnValue(updateQuery);
    });

    const likes = {
      findOne: jest.fn().mockResolvedValue({ id: 9, postId: 42, userId: 7 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const lockedQuery = createLockedPostQuery(post);
    const postRepository = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(lockedQuery)
        .mockReturnValueOnce(updateQuery),
      increment: jest.fn(),
    };
    const getRepository = jest.fn((target: unknown) =>
      target === Post ? postRepository : likes,
    );
    const manager = { getRepository };
    const dataSource = {
      transaction: jest.fn(
        (callback: (transactionManager: typeof manager) => unknown) =>
          callback(manager),
      ),
    };
    const service = new PostService(
      {} as Repository<Post>,
      likes as unknown as Repository<PostLike>,
      {} as Repository<PostBookmark>,
      dataSource as unknown as DataSource,
    );

    await expect(service.removeLike(42, 7)).resolves.toEqual({
      isLiked: false,
      likeCount: 4,
    });
    expect(likes.delete).toHaveBeenCalledWith({ postId: 42, userId: 7 });
  });

  it("addLike rejects unpublished posts", async () => {
    const { service } = createService({}, jest.fn(), null);

    await expect(service.addLike(42, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
