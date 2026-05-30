import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumberString,
  Length,
} from "class-validator";
import { Transform } from "class-transformer";

/**
 * 将 FormData/multipart 中的单值或数组值归一化为 string[]。
 *
 * Multer (busboy) 在 multipart/form-data 中遇到多个同名 key（如 tags）时
 * 会拼成数组，但仅一个值时直接返回字符串，导致 @IsArray() 验证失败。
 * readAsArray 统一处理三种情况：undefined | string | string[]
 */
const readAsArray = ({ value }: { value: unknown }): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") return [value];
  return undefined;
};

export class CreateWallpaperDto {
  @IsEnum(["general", "anime", "people"])
  @IsOptional()
  category?: "general" | "anime" | "people";

  @IsString()
  @IsOptional()
  subCategory?: string;

  @IsString()
  @IsOptional()
  @Length(0, 200)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Transform(readAsArray)
  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class UpdateWallpaperDto {
  @IsEnum(["general", "anime", "people"])
  @IsOptional()
  category?: "general" | "anime" | "people";

  @IsString()
  @IsOptional()
  subCategory?: string;

  @IsString()
  @IsOptional()
  @Length(0, 200)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class WallpaperQueryDto {
  @IsNumberString()
  @IsOptional()
  page?: string = "1";

  @IsNumberString()
  @IsOptional()
  limit?: string = "20";

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: string = "createdAt";

  @IsString()
  @IsOptional()
  sortOrder?: "ASC" | "DESC" = "DESC";

  @Transform(readAsArray)
  @IsArray()
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
