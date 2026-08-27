import {
  IsArray,
  ArrayNotEmpty,
  ArrayMaxSize,
  ArrayUnique,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsEmail,
  Length,
  Max,
  Min,
  ValidateIf,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { UserRole } from "../entities/user.entity";
import { CreateUserDto, UserUpdatableDto } from "./user.dto";

export class AdminUserQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  keyword?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class AdminCreateUserDto extends CreateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class AdminUpdateUserDto extends UserUpdatableDto {
  /** 管理端保留传 null=清空邮箱的能力；字符串须为合法邮箱 */
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString({ message: "邮箱格式不正确" })
  @IsEmail({}, { message: "邮箱格式不正确" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  email?: string | null;

  @IsOptional()
  @IsString()
  @Length(8, 64, { message: "密码长度必须在8-64个字符之间" })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;
}

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(1)
  status: number;
}

export class AdminWallpaperQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  uploaderId?: number;

  @IsOptional()
  @IsString()
  category?: "general" | "anime" | "people";
}

export class AdminUpdateWallpaperTagsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Length(1, 50, { each: true })
  tags?: string[];
}

export class AdminWallpaperIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[];
}

export class AdminBatchFeaturedDto extends AdminWallpaperIdsDto {
  @IsBoolean()
  isFeatured: boolean;
}
