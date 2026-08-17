import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  Length,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import type { TransformFnParams } from "class-transformer";

/**
 * 将 FormData/multipart 中的单值或数组值归一化为 string[]。
 *
 * Multer (busboy) 在 multipart/form-data 中遇到多个同名 key（如 tags）时
 * 会拼成数组，但仅一个值时直接返回字符串，导致 @IsArray() 验证失败。
 * readAsArray 统一处理三种情况：undefined | string | string[]
 */
const isUnknownArray = (value: unknown): value is unknown[] =>
  Array.isArray(value);

const readAsArray = ({ value }: TransformFnParams): unknown[] | undefined => {
  const input: unknown = value;
  if (input === undefined || input === null) return undefined;
  if (isUnknownArray(input)) return input;
  return [input];
};

/**
 * 第一步「仅传文件」：分类/标签可选（草稿 PENDING）
 * 第二步 publish 再强制分类 + 标签
 */
export class CreateWallpaperDto {
  @IsEnum(["general", "anime", "people"], {
    message: "分类无效",
  })
  @IsOptional()
  category?: "general" | "anime" | "people";

  @IsString()
  @IsIn([
    "nature",
    "city",
    "abstract",
    "minimal",
    "dark",
    "landscape",
    "character",
    "cute",
    "cyberpunk",
    "game",
    "portrait",
    "fashion",
    "movie",
    "other",
  ])
  @IsOptional()
  subCategory?: string;

  @Transform((params: TransformFnParams) =>
    readAsArray(params)?.map((value) =>
      typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value,
    ),
  )
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 30, { each: true })
  @IsOptional()
  tags?: string[];
}

/** 发布草稿：分类 + 至少 1 个标签 */
export class PublishWallpaperItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @IsEnum(["general", "anime", "people"], {
    message: "请选择分类（综合 / 动漫 / 人物）",
  })
  category: "general" | "anime" | "people";

  @Transform((params: TransformFnParams) =>
    readAsArray(params)?.map((value) =>
      typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value,
    ),
  )
  @IsArray({ message: "请至少添加一个标签" })
  @ArrayMinSize(1, { message: "请至少添加一个标签" })
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 30, { each: true })
  tags: string[];
}

export class PublishWallpapersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PublishWallpaperItemDto)
  items: PublishWallpaperItemDto[];
}

export class UpdateWallpaperDto {
  @IsEnum(["general", "anime", "people"])
  @IsOptional()
  category?: "general" | "anime" | "people";

  @IsString()
  @IsIn([
    "nature",
    "city",
    "abstract",
    "minimal",
    "dark",
    "landscape",
    "character",
    "cute",
    "cyberpunk",
    "game",
    "portrait",
    "fashion",
    "movie",
    "other",
  ])
  @IsOptional()
  subCategory?: string;

  /** 公开状态：0=不公开(草稿/下架)，1=公开（本人切换用） */
  @IsIn([0, 1])
  @IsOptional()
  status?: number;
}

export class WallpaperQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  sortBy?: string = "createdAt";

  @IsIn(["ASC", "DESC"])
  @IsOptional()
  sortOrder?: "ASC" | "DESC" = "DESC";

  @Transform(readAsArray)
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @IsOptional()
  tags?: string[];

  @IsNumberString()
  @IsOptional()
  minWidth?: string;

  @IsNumberString()
  @IsOptional()
  maxWidth?: string;

  @IsNumberString()
  @IsOptional()
  minHeight?: string;

  @IsNumberString()
  @IsOptional()
  maxHeight?: string;

  @IsNumberString()
  @IsOptional()
  aspectRatio?: string;

  @IsString()
  @IsOptional()
  orientation?: string;

  @IsString()
  @IsOptional()
  category?: "general" | "anime" | "people";

  @IsString()
  @IsOptional()
  subCategory?: string;

  @IsString()
  @IsOptional()
  format?: string;

  @IsNumberString()
  @IsOptional()
  minFileSize?: string;

  @IsNumberString()
  @IsOptional()
  maxFileSize?: string;

  /** toplist 时间窗：1d/3d/1w/1M/3M/6M/1y */
  @IsIn(["1d", "3d", "1w", "1M", "3M", "6M", "1y"])
  @IsOptional()
  topRange?: string;

  /** 主色：bucket 名或 hex */
  @IsString()
  @MaxLength(32)
  @IsOptional()
  color?: string;

  /** 精确分辨率列表，如 1920x1080 */
  @Transform(readAsArray)
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  @IsOptional()
  resolutions?: string[];

  /** 随机排序种子：翻页时传同一 seed 保证顺序稳定（不重复） */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  @IsOptional()
  seed?: number;

  /** 关键词搜索（按标签名模糊匹配） */
  @IsString()
  @MaxLength(50)
  @IsOptional()
  search?: string;
}

export class CreateCollectionDto {
  @IsString()
  @Length(1, 80)
  name: string;
}

export class UpdateCollectionDto {
  @IsString()
  @Length(1, 80)
  name: string;
}

export class CollectionWallpaperDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  wallpaperId: number;
}
