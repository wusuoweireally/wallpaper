import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateWallpaperDto, PublishWallpapersDto } from "./wallpaper.dto";

describe("CreateWallpaperDto (draft upload — category/tags optional)", () => {
  const validateDto = async (plain: Record<string, unknown>) => {
    const dto = plainToInstance(CreateWallpaperDto, plain);
    return validate(dto);
  };

  it("accepts empty body for file-only first step", async () => {
    const errors = await validateDto({});
    expect(errors).toHaveLength(0);
  });

  it("accepts category without tags", async () => {
    const errors = await validateDto({ category: "anime" });
    expect(errors).toHaveLength(0);
  });

  it("accepts valid category + tags", async () => {
    const errors = await validateDto({
      category: "people",
      tags: ["portrait"],
    });
    expect(errors).toHaveLength(0);
  });

  it("normalizes single tag string from multipart into array", async () => {
    const dto = plainToInstance(CreateWallpaperDto, {
      category: "general",
      tags: "nature",
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.tags).toEqual(["nature"]);
  });
});

describe("PublishWallpapersDto (finalize step)", () => {
  it("rejects empty tags on publish item", async () => {
    const dto = plainToInstance(PublishWallpapersDto, {
      items: [{ id: 1, category: "general", tags: [] }],
    });
    const errors = await validate(dto);
    // nested validation
    expect(errors.length).toBeGreaterThan(0);
  });

  it("accepts valid publish payload", async () => {
    const dto = plainToInstance(PublishWallpapersDto, {
      items: [{ id: 1, category: "general", tags: ["sky", "ocean"] }],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
