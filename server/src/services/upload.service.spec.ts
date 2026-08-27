import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import sharp from "sharp";
import type { Repository } from "typeorm";
import { UploadService } from "./upload.service";
import type { CosService } from "./cos.service";
import type { Wallpaper } from "../entities/wallpaper.entity";
import {
  WALLPAPER_MIN_HEIGHT,
  WALLPAPER_MIN_WIDTH,
} from "./wallpaper-upload.constants";

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
  let findOne: jest.Mock;

  beforeEach(() => {
    cos = createCosMock();
    findOne = jest.fn().mockResolvedValue(null);
    service = new UploadService(
      cos as unknown as CosService,
      { findOne } as unknown as Repository<Wallpaper>,
    );
  });

  it("rejects a declared MIME type that does not match the image content", async () => {
    const jpeg = await sharp({
      create: {
        width: WALLPAPER_MIN_WIDTH,
        height: WALLPAPER_MIN_HEIGHT,
        channels: 3,
        background: "#123456",
      },
    })
      .jpeg()
      .toBuffer();

    await expect(
      service.processWallpaperUpload(createFile(jpeg, "image/png"), 7),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects images below min resolution before COS upload", async () => {
    const image = await sharp({
      create: { width: 492, height: 460, channels: 3, background: "#000" },
    })
      .png()
      .toBuffer();

    await expect(
      service.processWallpaperUpload(createFile(image), 7),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(cos.putObject).not.toHaveBeenCalled();
  });

  it("rejects exact content duplicates", async () => {
    findOne.mockResolvedValueOnce({ id: 88 });
    const image = await sharp({
      create: {
        width: WALLPAPER_MIN_WIDTH,
        height: WALLPAPER_MIN_HEIGHT,
        channels: 3,
        background: "#112233",
      },
    })
      .png()
      .toBuffer();

    await expect(
      service.processWallpaperUpload(createFile(image), 7),
    ).rejects.toThrow(/重复壁纸.*#88/);
    expect(cos.putObject).not.toHaveBeenCalled();
  });

  it("uploads original + thumbnail to COS and returns public URLs + color + hash", async () => {
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
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.dominantColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(typeof result.colorBucket).toBe("string");
    expect(result.colorBucket.length).toBeGreaterThan(0);
    expect(result.palette.length).toBeGreaterThan(0);
    expect(result.palette[0]).toBe(result.dominantColor);
    expect(cos.putObject).toHaveBeenCalledTimes(3);
    expect(cos.auditImage).toHaveBeenCalledTimes(1);
    expect(cos.setPublicRead).toHaveBeenCalledTimes(3);
    expect(result.fileUrl).toMatch(/^https:\/\/cos\.test\/wallpapers\//);
    expect(result.thumbnailUrl).toMatch(/^https:\/\/cos\.test\/thumbnails\//);
    expect(result.previewUrl).toMatch(/^https:\/\/cos\.test\/previews\//);
  });

  it("rejects and cleans up when the image violates content policy", async () => {
    cos.auditImage.mockResolvedValueOnce({
      passed: false,
      label: "Porn",
      score: 99,
    });
    const image = await sharp({
      create: {
        width: WALLPAPER_MIN_WIDTH,
        height: WALLPAPER_MIN_HEIGHT,
        channels: 3,
        background: "#000",
      },
    })
      .png()
      .toBuffer();

    await expect(
      service.processWallpaperUpload(createFile(image), 7),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(cos.deleteObject).toHaveBeenCalledTimes(1);
    expect(cos.setPublicRead).not.toHaveBeenCalled();
  });

  it("cleans up all objects when publishing fails", async () => {
    cos.setPublicRead.mockRejectedValueOnce(new Error("acl failed"));
    const image = await sharp({
      create: {
        width: WALLPAPER_MIN_WIDTH,
        height: WALLPAPER_MIN_HEIGHT,
        channels: 3,
        background: "#000",
      },
    })
      .png()
      .toBuffer();

    await expect(
      service.processWallpaperUpload(createFile(image), 7),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(cos.deleteObject).toHaveBeenCalledTimes(3);
  });
});
