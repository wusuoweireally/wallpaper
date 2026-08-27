import { NotFoundException } from "@nestjs/common";
import type { DataSource, Repository } from "typeorm";
import { PostBookmark } from "../entities/post-bookmark.entity";
import { PostLike } from "../entities/post-like.entity";
import { Post } from "../entities/post.entity";
import { PostService } from "./post.service";

describe("PostService bookmark visibility", () => {
  const createService = (
    postRepository: Partial<Repository<Post>> = {},
    bookmarkRepository: Partial<Repository<PostBookmark>> = {},
  ) =>
    new PostService(
      postRepository as Repository<Post>,
      {} as Repository<PostLike>,
      bookmarkRepository as Repository<PostBookmark>,
      {} as DataSource,
    );

  it("rejects bookmarking a missing or unpublished post", async () => {
    const execute = jest.fn();
    const insertQuery = {
      insert: jest.fn(),
      into: jest.fn(),
      values: jest.fn(),
      orIgnore: jest.fn(),
      execute,
    };
    Object.values(insertQuery).forEach((method) => {
      if (method !== execute) method.mockReturnValue(insertQuery);
    });
    const service = createService(
      { exists: jest.fn().mockResolvedValue(false) },
      { createQueryBuilder: jest.fn().mockReturnValue(insertQuery) },
    );

    await expect(service.bookmarkPost(7, 3)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects checking bookmark status for an unpublished post", async () => {
    const findOne = jest.fn();
    const service = createService(
      { exists: jest.fn().mockResolvedValue(false) },
      { findOne },
    );

    await expect(service.hasBookmarked(7, 3)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findOne).not.toHaveBeenCalled();
  });

  it("returns like and bookmark flags for published posts (detail contract)", async () => {
    const likeFindOne = jest.fn().mockResolvedValue({ id: 1 });
    const bookmarkFindOne = jest.fn().mockResolvedValue({ id: 2 });
    const service = new PostService(
      {
        exists: jest.fn().mockResolvedValue(true),
      } as unknown as Repository<Post>,
      { findOne: likeFindOne } as unknown as Repository<PostLike>,
      { findOne: bookmarkFindOne } as unknown as Repository<PostBookmark>,
      {} as DataSource,
    );

    await expect(service.hasLiked(1, 100001)).resolves.toBe(true);
    await expect(service.hasBookmarked(1, 100001)).resolves.toBe(true);
    expect(likeFindOne).toHaveBeenCalled();
    expect(bookmarkFindOne).toHaveBeenCalled();
  });

  it("rejects checking like status for an unpublished post", async () => {
    const findOne = jest.fn();
    const service = new PostService(
      {
        exists: jest.fn().mockResolvedValue(false),
      } as unknown as Repository<Post>,
      { findOne } as unknown as Repository<PostLike>,
      {} as Repository<PostBookmark>,
      {} as DataSource,
    );

    await expect(service.hasLiked(7, 3)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findOne).not.toHaveBeenCalled();
  });
});
