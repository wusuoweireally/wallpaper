import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "../entities/report.entity";

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  @IsNotEmpty({ message: "举报目标类型不能为空" })
  targetType: ReportTargetType;

  @Type(() => Number)
  @IsInt({ message: "举报目标ID必须是整数" })
  @Min(1, { message: "举报目标ID必须大于0" })
  targetId: number;

  @IsEnum(ReportReason)
  @IsNotEmpty({ message: "举报原因不能为空" })
  reason: ReportReason;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: "举报描述不能超过500个字符" })
  description?: string;
}

export class UpdateReportDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: "处理说明不能超过500个字符" })
  reviewNote?: string;

  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;
}

export class GetReportsDto {
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;

  @IsEnum(ReportTargetType)
  @IsOptional()
  targetType?: ReportTargetType;

  @IsEnum(ReportReason)
  @IsOptional()
  reason?: ReportReason;

  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @IsOptional()
  userId?: number;

  @IsOptional()
  @IsString()
  keyword?: string;
}
