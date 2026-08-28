import { InternalServerErrorException } from "@nestjs/common";
import type { Request } from "express";
import { UserRole } from "../entities/user.entity";
import { WallpaperStatus } from "../entities/wallpaper.entity";
import { UploadService } from "../services/upload.service";
import { WallpaperService } from "../services/wallpaper.service";
import { ViewHistoryService } from "../services/view-history.service";
import { WallpaperController } from "./wallpaper.controller";

describe("WallpaperController upload", () => {
  const file = { buffer: Buffer.from("image") } as Express.Multer.File;
  const fileInfo = {
    fileUrl: "/uploads/wallpapers/example.png",
    thumbnailUrl: "/uploads/thumbnails/example.webp",
    previewUrl: "/uploads/previews/example.webp",
    fileSize: 100,
    width: 1920,
    height: 1080,
    format: "png",
    aspectRatio: 1.78,
  };

  let processWallpaperUpload: jest.Mock;
  let deleteUploadedFiles: jest.Mock;
  let create: jest.Mock;
  let controller: WallpaperController;

  beforeEach(() => {
    processWallpaperUpload = jest.fn().mockResolvedValue(fileInfo);
    deleteUploadedFiles = jest.fn().mockResolvedValue(undefined);
    create = jest.fn();
    controller = new WallpaperController(
      { create } as unknown as WallpaperService,
      {
        processWallpaperUpload,
        deleteUploadedFiles,
      } as unknown as UploadService,
      {} as ViewHistoryService,
    );
  });

  it("stores upload as PENDING draft (finalize later)", async () => {
    create.mockImplementation((data: Record<string, unknown>) =>
      Promise.resolve({ id: 1, ...data }),
    );

    const result = await controller.uploadWallpaper(
      file,
      {},
      { userId: 7, username: "creator", role: UserRole.USER },
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ status: WallpaperStatus.PENDING }),
      7,
    );
    expect(result.message).toContain("完善分类");
  });

  it("also drafts admin uploads as PENDING", async () => {
    create.mockImplementation((data: Record<string, unknown>) =>
      Promise.resolve({ id: 1, ...data }),
    );

    const result = await controller.uploadWallpaper(
      file,
      {},
      { userId: 8, username: "admin", role: UserRole.ADMIN },
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ status: WallpaperStatus.PENDING }),
      8,
    );
    expect(result.success).toBe(true);
  });

  it("removes all three files when the database transaction fails", async () => {
    create.mockRejectedValue(new Error("internal database details"));

    await expect(
      controller.uploadWallpaper(
        file,
        { category: "general", tags: ["风景"] },
        { userId: 7, username: "creator", role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(deleteUploadedFiles).toHaveBeenCalledWith(
      fileInfo.fileUrl,
      fileInfo.thumbnailUrl,
      fileInfo.previewUrl,
    );
  });
});

describe("WallpaperController getWallpaper viewCount", () => {
  const wallpaperId = 98;
  const wallpaper = {
    id: wallpaperId,
    status: WallpaperStatus.APPROVED,
    viewCount: 5,
    uploader: { username: "bay", avatarUrl: null },
  };

  let findVisibleById: jest.Mock;
  let incrementViewCount: jest.Mock;
  let getUserFavoriteStatus: jest.Mock;
  let recordView: jest.Mock;
  let recordGuestView: jest.Mock;
  let controller: WallpaperController;

  beforeEach(() => {
    findVisibleById = jest.fn().mockResolvedValue({ ...wallpaper });
    incrementViewCount = jest.fn().mockResolvedValue(undefined);
    getUserFavoriteStatus = jest.fn().mockResolvedValue(false);
    recordView = jest.fn();
    recordGuestView = jest.fn();
    controller = new WallpaperController(
      {
        findVisibleById,
        incrementViewCount,
        getUserFavoriteStatus,
      } as unknown as WallpaperService,
      {} as UploadService,
      { recordView, recordGuestView } as unknown as ViewHistoryService,
    );
  });

  const guestRequest = (
    headers: Record<string, string> = {},
    ip = "10.0.0.8",
  ): Request => ({ ip, headers, user: undefined }) as unknown as Request;

  it("guest first view increments and returns old+1", async () => {
    recordGuestView.mockReturnValue(true);

    const result = await controller.getWallpaper(
      String(wallpaperId),
      guestRequest({ "cf-connecting-ip": "203.0.113.10" }),
    );

    expect(recordGuestView).toHaveBeenCalledWith("203.0.113.10", wallpaperId);
    expect(incrementViewCount).toHaveBeenCalledWith(wallpaperId);
    expect(recordView).not.toHaveBeenCalled();
    expect(result.data.viewCount).toBe(6);
  });

  it("guest repeat within the window does not increment", async () => {
    recordGuestView.mockReturnValue(false);

    const result = await controller.getWallpaper(
      String(wallpaperId),
      guestRequest({ "cf-connecting-ip": "203.0.113.10" }),
    );

    expect(incrementViewCount).not.toHaveBeenCalled();
    expect(result.data.viewCount).toBe(5);
  });

  it("logged-in user goes through recordView and returns old+1 when counted", async () => {
    recordView.mockResolvedValue(true);
    const request = {
      ip: "10.0.0.8",
      headers: {},
      user: { userId: 7, username: "alice", role: UserRole.USER },
    } as unknown as Request;

    const result = await controller.getWallpaper(String(wallpaperId), request);

    expect(recordView).toHaveBeenCalledWith(7, wallpaperId);
    expect(recordGuestView).not.toHaveBeenCalled();
    expect(incrementViewCount).not.toHaveBeenCalled();
    expect(getUserFavoriteStatus).toHaveBeenCalledWith(wallpaperId, 7);
    expect(result.data.viewCount).toBe(6);
  });

  it("logged-in repeat within the window keeps the current count", async () => {
    recordView.mockResolvedValue(false);
    const request = {
      ip: "10.0.0.8",
      headers: {},
      user: { userId: 7, username: "alice", role: UserRole.USER },
    } as unknown as Request;

    const result = await controller.getWallpaper(String(wallpaperId), request);

    expect(result.data.viewCount).toBe(5);
  });

  it("coerces a string viewCount so the first increment is not shown as 0", async () => {
    findVisibleById.mockResolvedValue({ ...wallpaper, viewCount: "0" });
    recordGuestView.mockReturnValue(true);

    const result = await controller.getWallpaper(
      String(wallpaperId),
      guestRequest({ "cf-connecting-ip": "203.0.113.10" }),
    );

    expect(result.data.viewCount).toBe(1);
  });

  it("does not count a pending draft", async () => {
    findVisibleById.mockResolvedValue({
      ...wallpaper,
      status: WallpaperStatus.PENDING,
      viewCount: 0,
    });

    const result = await controller.getWallpaper(
      String(wallpaperId),
      guestRequest(),
    );

    expect(recordGuestView).not.toHaveBeenCalled();
    expect(recordView).not.toHaveBeenCalled();
    expect(incrementViewCount).not.toHaveBeenCalled();
    expect(result.data.viewCount).toBe(0);
  });
});
