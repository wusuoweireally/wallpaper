import { IsIn, IsString, IsOptional, Length } from "class-validator";
import { PaginationQueryDto } from "./pagination.dto";

export class CreateTagDto {
  @IsString({ message: "标签名称必须是字符串" })
  @Length(1, 50, { message: "标签名称长度必须在1-50个字符之间" })
  name: string;
}

export class SearchTagsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: "搜索关键词必须是字符串" })
  keyword?: string;

  @IsOptional()
  @IsIn(["usageCount", "name", "createdAt"])
  sortBy?: "usageCount" | "name" | "createdAt";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC";
}

export class UpdateTagDto {
  @IsString({ message: "标签名称必须是字符串" })
  @Length(1, 50, { message: "标签名称长度必须在1-50个字符之间" })
  name: string;
}
