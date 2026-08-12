import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import sharp from "sharp";
import { UploadService } from "./upload.service";
import type { CosService } from "./cos.service";

const createFile = (
  buffer: Buffer,
  mimetype = "image/png",
): Express.Multer.File =>
  ({
    buffer,
    mimetype,
    size: buffer.length,
    originalname: "wallpaper.png",
  }) as Express.Multer.File;

const createCosMock = () => {
  const mock = {
    putObject: jest.fn(),
    auditImage: jest.fn(),
    setPublicRead: jest.fn(),
    deleteObject: jest.fn(),
    publicUrl: jest.fn((key: string) => `https://cos.test/${key}`),
    keyFromUrl: jest.fn((url: string) =>
      url.replace(/^https:\/\/cos\.test\//, ""),
    ),
  };
  mock.putObject.mockResolvedValue(undefined);
  mock.auditImage.mockResolvedValue({
    passed: true,
    label: "Normal",
    score: 0,
  });
  mock.setPublicRead.mockResolvedValue(undefined);
  mock.deleteObject.mockResolvedValue(undefined);
  return mock;
};

describe("UploadService wallpaper processing", () => {
  let service: UploadService;
  let cos: ReturnType<typeof createCosMock>;

  beforeEach(() => {
    cos = createCosMock();
    service = new UploadService(cos as unknown as CosService);
  });

  it("rejects a declared MIME type that does not match the image content", async () => {
    const jpeg = await sharp({
      create: { width: 16, height: 9, channels: 3, background: "#123456" },
    })
      .jpeg()
      .toBuffer();

    await expect(
      service.processWallpaperUpload(createFile(jpeg, "image/png"), 7),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("uploads original + thumbnail to COS and returns public URLs", async () => {
    const image = await sharp({
      create: { width: 1920, height: 1080, channels: 3, background: "#123456" },
    })
      .png()
      .toBuffer();

    const result = await service.processWallpaperUpload(createFile(image), 7);

    expect(result).toEqual(
      expect.objectContaining({
        width: 1920,
        height: 1080,
        format: "png",
        aspectRatio: 1.78,
      }),
    );
    expect(cos.putObject).toHaveBeenCalledTimes(2); // 原图 + 缩略图
    expect(cos.auditImage).toHaveBeenCalledTimes(1); // 只审原图
    expect(cos.setPublicRead).toHaveBeenCalledTimes(2);
    expect(result.fileUrl).toMatch(/^https:\/\/cos\.test\/wallpapers\//);
    expect(result.thumbnailUrl).toMatch(/^https:\/\/cos\.test\/thumbnails\//);
  });

  it("rejects and cleans up when the image violates content policy", async () => {
    cos.auditImage.mockResolvedValueOnce({
      passed: false,
      label: "Porn",
      score: 99,
    });
    const image = await sharp({
      create: { width: 64, height: 64, channels: 3, background: "#000" },
    })
      .png()
      .toBuffer();

    await expect(
      service.processWallpaperUpload(createFile(image), 7),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(cos.deleteObject).toHaveBeenCalledTimes(1); // 删除原图
    expect(cos.setPublicRead).not.toHaveBeenCalled(); // 违规对象不公开
  });

  it("cleans up both objects when publishing fails", async () => {
    cos.setPublicRead.mockRejectedValueOnce(new Error("acl failed"));
    const image = await sharp({
      create: { width: 64, height: 64, channels: 3, background: "#000" },
    })
      .png()
      .toBuffer();

    await expect(
      service.processWallpaperUpload(createFile(image), 7),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(cos.deleteObject).toHaveBeenCalledTimes(2); // 原图 + 缩略图
  });
});
