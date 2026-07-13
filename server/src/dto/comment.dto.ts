import { Transform, Type } from "class-transformer";
import type { TransformFnParams } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { PaginationQueryDto } from "./pagination.dto";

const trimString = ({ value }: TransformFnParams): unknown => {
  const input: unknown = value;
  return typeof input === "string" ? input.trim() : input;
};

export class CreateCommentDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  postId: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;
}

export class UpdateCommentDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

type CommentSortField = "createdAt" | "updatedAt" | "likeCount";
type SortOrder = "ASC" | "DESC";

export class CommentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(["createdAt", "updatedAt", "likeCount"])
  sortBy: CommentSortField = "createdAt";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder: SortOrder = "ASC";

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;
}
