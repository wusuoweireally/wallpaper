import { ConflictException, NotFoundException } from "@nestjs/common";
import type { Repository } from "typeorm";
import {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "../entities/report.entity";
import type { Report } from "../entities/report.entity";
import { Post, PostStatus } from "../entities/post.entity";
import type { Comment } from "../entities/comment.entity";
import { ReportService } from "./report.service";

describe("ReportService", () => {
  let reportRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    findAndCount: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let postRepository: { findOne: jest.Mock };
  let commentQuery: {
    innerJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getOne: jest.Mock;
  };
  let commentRepository: { createQueryBuilder: jest.Mock };
  let service: ReportService;

  const createDto = {
    targetType: ReportTargetType.POST,
    targetId: 9,
    reason: ReportReason.SPAM,
    description: "测试举报",
  };

  beforeEach(() => {
    reportRepository = {
      findOne: jest.fn(),
      create: jest.fn((data: unknown) => data),
      save: jest.fn((data: Record<string, unknown>) =>
        Promise.resolve({ id: 1, ...data }),
      ),
      update: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    postRepository = { findOne: jest.fn() };
    commentQuery = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    commentRepository = {
      createQueryBuilder: jest.fn(() => commentQuery),
    };
    service = new ReportService(
      reportRepository as unknown as Repository<Report>,
      postRepository as unknown as Repository<Post>,
      commentRepository as unknown as Repository<Comment>,
    );
  });

  it("stores an immutable snapshot of a public post", async () => {
    postRepository.findOne.mockResolvedValue({
      id: 9,
      title: "原始标题",
      content: "原始正文",
      authorId: 7,
    });
    reportRepository.findOne.mockResolvedValue(null);

    await service.createReport(createDto, 3);

    expect(postRepository.findOne).toHaveBeenCalledWith({
      where: { id: 9, status: PostStatus.PUBLISHED },
      select: ["id", "title", "content", "authorId"],
    });
    expect(reportRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetSnapshot: {
          title: "原始标题",
          content: "原始正文",
          authorId: 7,
          postId: 9,
        },
      }),
    );
  });

  it("rejects a post that is not publicly visible", async () => {
    postRepository.findOne.mockResolvedValue(null);

    await expect(service.createReport(createDto, 3)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(reportRepository.save).not.toHaveBeenCalled();
  });

  it("updates status only when the previously read status still matches", async () => {
    reportRepository.findOne
      .mockResolvedValueOnce({ id: 1, status: ReportStatus.PENDING })
      .mockResolvedValueOnce({
        id: 1,
        status: ReportStatus.RESOLVED,
        user: null,
        reviewer: null,
        targetSnapshot: null,
      });
    reportRepository.update.mockResolvedValue({ affected: 1 });

    await service.updateReportStatus(1, { status: ReportStatus.RESOLVED }, 5);

    expect(reportRepository.update).toHaveBeenCalledWith(
      { id: 1, status: ReportStatus.PENDING },
      expect.objectContaining({
        status: ReportStatus.RESOLVED,
        reviewedBy: 5,
      }),
    );
  });

  it("rejects an invalid backward transition", async () => {
    reportRepository.findOne.mockResolvedValue({
      id: 1,
      status: ReportStatus.REVIEWING,
    });

    await expect(
      service.updateReportStatus(1, { status: ReportStatus.PENDING }, 5),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(reportRepository.update).not.toHaveBeenCalled();
  });

  it("detects a concurrent terminal update", async () => {
    reportRepository.findOne.mockResolvedValue({
      id: 1,
      status: ReportStatus.PENDING,
    });
    reportRepository.update.mockResolvedValue({ affected: 0 });

    await expect(
      service.updateReportStatus(1, { status: ReportStatus.DISMISSED }, 5),
    ).rejects.toThrow("其他管理员");
  });
});
