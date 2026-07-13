import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { Request, Response } from "express";
import { UploadAssetController } from "./upload-asset.controller";
import { WallpaperService } from "../services/wallpaper.service";

describe("UploadAssetController", () => {
  let findVisibleByAssetUrl: jest.Mock;
  let controller: UploadAssetController;

  beforeEach(() => {
    findVisibleByAssetUrl = jest.fn();
    controller = new UploadAssetController({
      findVisibleByAssetUrl,
    } as unknown as WallpaperService);
  });

  it("rejects an unsupported upload directory", async () => {
    await expect(
      controller.getWallpaperAsset(
        "profile-pictures",
        "avatar.webp",
        {} as Request,
        {} as Response,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(findVisibleByAssetUrl).not.toHaveBeenCalled();
  });

  it("rejects a file name containing path segments", async () => {
    await expect(
      controller.getWallpaperAsset(
        "wallpapers",
        "../secret.webp",
        {} as Request,
        {} as Response,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findVisibleByAssetUrl).not.toHaveBeenCalled();
  });
});
