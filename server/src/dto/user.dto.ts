import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  Length,
  ValidateIf,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: "用户名不能为空" })
  @Length(2, 50, { message: "用户名长度必须在2-50个字符之间" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  username: string;

  @IsOptional()
  @IsEmail({}, { message: "邮箱格式不正确" })
  email?: string;

  @IsString()
  @IsNotEmpty({ message: "密码不能为空" })
  @Length(8, 64, { message: "密码长度必须在8-64个字符之间" })
  password: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: "个人简介长度不能超过500个字符" })
  bio?: string;
}

/** 用户名与简介：自助与管理端更新共用基座（email 各路径 null 语义不同，由子类各自建模） */
export class UserUpdatableDto {
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: "用户名长度必须在1-50个字符之间" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  username?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: "个人简介长度不能超过500个字符" })
  bio?: string;
}

export class UpdateUserDto extends UserUpdatableDto {
  /** 自助端禁止 null 清空邮箱：只接受合规字符串或不出示该字段 */
  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: "邮箱格式不正确" })
  @IsEmail({}, { message: "邮箱格式不正确" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  email?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: "当前密码不能为空" })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: "新密码不能为空" })
  @Length(8, 64, { message: "新密码长度必须在8-64个字符之间" })
  newPassword: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: "请输入用户名或邮箱" })
  @Length(2, 100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  account: string;

  @IsString()
  @IsNotEmpty({ message: "密码不能为空" })
  password: string;
}
