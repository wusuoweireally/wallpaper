import { Body, Controller, Logger, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * 前端全局异常上报载荷（与 web/src/utils/errorReporting.ts 的截断上限一致）
 */
export class ClientErrorDto {
  @IsString()
  @MaxLength(500)
  message: string;

  /** 出错页面 path+search */
  @IsString()
  @MaxLength(500)
  url: string;

  /** 脚本错误的行号/列号，其余来源为 null */
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  line?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  col?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  stack?: string;
}

@Controller("client-errors")
export class ClientErrorController {
  private readonly logger = new Logger(ClientErrorController.name);

  /**
   * 只把结构化 JSON 打成单行 CLIENT_ERROR 日志便于检索，不落数据库。
   * 全局限流(200/min)对错误上报太宽，收紧到 20/min 防客户端误刷。
   */
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  report(@Body() dto: ClientErrorDto) {
    // JSON.stringify 会转义换行，日志天然保持单行
    this.logger.error(`CLIENT_ERROR ${JSON.stringify(dto)}`);
    return { success: true };
  }
}
