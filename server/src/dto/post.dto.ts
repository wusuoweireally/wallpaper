import { PartialType } from "@nestjs/mapped-types";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { PostCategory } from "../entities/post.entity";
import { PaginationQueryDto } from "./pagination.dto";

const parseTags = (value: unknown): unknown[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  let values: unknown[];
  if (Array.isArray(value)) {
    values = value;
  } else if (typeof value === "string") {
    values = value.split(",");
  } else {
    values = [value];
  }

  return values
    .map((tag) => (typeof tag === "string" ? tag.trim() : tag))
    .filter((tag) => tag !== "");
};

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  @IsEnum(PostCategory)
  category: PostCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;

  @IsOptional()
  @Transform(({ value }) => parseTags(value), { toClassOnly: true })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

type SortOrder = "ASC" | "DESC";
type PostSortField =
  | "createdAt"
  | "updatedAt"
  | "viewCount"
  | "likeCount"
  | "commentCount"
  | "popular";

export class PostListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([
    "createdAt",
    "updatedAt",
    "viewCount",
    "likeCount",
    "commentCount",
    "popular",
  ])
  sortBy: PostSortField = "createdAt";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder: SortOrder = "DESC";

  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  authorId?: number;

  @IsOptional()
  @Transform(({ value }) => parseTags(value), { toClassOnly: true })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];
}
