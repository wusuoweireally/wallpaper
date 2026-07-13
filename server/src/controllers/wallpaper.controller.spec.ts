import { InternalServerErrorException } from "@nestjs/common";
import { UserRole } from "../entities/user.entity";
import { WallpaperStatus } from "../entities/wallpaper.entity";
import { UploadService } from "../services/upload.service";
import { WallpaperService } from "../services/wallpaper.service";
import { TagService } from "../services/tag.service";
import { ViewHistoryService } from "../services/view-history.service";
import { WallpaperController } from "./wallpaper.controller";

describe("WallpaperController upload", () => {
  const file = { buffer: Buffer.from("image") } as Express.Multer.File;
  const fileInfo = {
    fileUrl: "/uploads/wallpapers/example.png",
    thumbnailUrl: "/uploads/thumbnails/example.webp",
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
      {} as TagService,
      {} as ViewHistoryService,
    );
  });

  it("stores a regular user's upload as pending review", async () => {
    create.mockImplementation((data: Record<string, unknown>) =>
      Promise.resolve({ id: 1, ...data }),
    );

    const result = await controller.uploadWallpaper(
      file,
      { category: "general", tags: ["风景"] },
      { userId: 7, username: "creator", role: UserRole.USER },
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ status: WallpaperStatus.PENDING }),
      7,
      true,
    );
    expect(result.message).toBe("壁纸已提交审核");
  });

  it("publishes an administrator's upload immediately", async () => {
    create.mockImplementation((data: Record<string, unknown>) =>
      Promise.resolve({ id: 1, ...data }),
    );

    const result = await controller.uploadWallpaper(
      file,
      { category: "general", tags: ["风景"] },
      { userId: 8, username: "admin", role: UserRole.ADMIN },
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ status: WallpaperStatus.APPROVED }),
      8,
      true,
    );
    expect(result.message).toBe("壁纸上传成功");
  });

  it("removes both files when the database transaction fails", async () => {
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
    );
  });
});
