import {
  ArrayMaxSize,
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

export class CreateWallpaperDto {
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
  search?: string;

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

  @IsString()
  @IsOptional()
  tagKeyword?: string;
}
