import { BadRequestException } from "@nestjs/common";
import * as fs from "fs/promises";
import sharp from "sharp";
import { UploadService } from "./upload.service";

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

describe("UploadService wallpaper processing", () => {
  const createdPaths: string[] = [];
  let service: UploadService;

  beforeEach(() => {
    service = new UploadService();
  });

  afterEach(async () => {
    await Promise.all(
      createdPaths.splice(0).map((path) => fs.unlink(path).catch(() => {})),
    );
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

  it("stores parsed image metadata and creates both assets", async () => {
    const image = await sharp({
      create: { width: 1920, height: 1080, channels: 3, background: "#123456" },
    })
      .png()
      .toBuffer();

    const result = await service.processWallpaperUpload(createFile(image), 7);
    createdPaths.push(
      `${process.cwd()}${result.fileUrl}`,
      `${process.cwd()}${result.thumbnailUrl}`,
    );

    expect(result).toEqual(
      expect.objectContaining({
        width: 1920,
        height: 1080,
        format: "png",
        aspectRatio: 1.78,
      }),
    );
    await expect(fs.access(createdPaths[0])).resolves.toBeUndefined();
    await expect(fs.access(createdPaths[1])).resolves.toBeUndefined();
  });
});
