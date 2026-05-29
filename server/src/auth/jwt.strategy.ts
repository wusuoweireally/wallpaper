import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "../entities/user.entity";

interface JwtPayload {
  sub: number | string; // sub 可能是数字或字符串
  username: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const cookieExtractor = (request: Request) => {
      const cookies = request?.cookies as Record<string, string>;
      const token = cookies?.Authentication || null;
      return token;
    };

    const secretOrKey = configService.get<string>("JWT_SECRET");

    // 强制要求设置 JWT_SECRET，不允许使用默认值
    if (!secretOrKey || secretOrKey === "your-secret-key") {
      throw new Error(
        "JWT_SECRET must be set in environment variables and cannot be the default value",
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false, // 确保过期token被拒绝
      secretOrKey: secretOrKey, // 使用环境变量
    });
  }

  /**
   * 校验 JWT 并返回当前用户信息。
   *
   * 关键安全设计：role 与 status 一律从数据库实时读取，**不信任 token 内嵌的值**。
   * 这样可保证：
   * 1. 用户被降级（如 ADMIN→USER）后，旧 token 立即失去管理权限；
   * 2. 用户被禁用（status=0）或删除后，旧 token 立即失效；
   * 无需等待 token 过期，也无需额外的黑名单机制。
   */
  async validate(payload: JwtPayload) {
    // 验证payload的有效性
    if (!payload) {
      throw new UnauthorizedException("JWT token无效 - payload为空");
    }
    if (!payload.sub) {
      throw new UnauthorizedException("JWT token无效 - 缺少用户ID");
    }
    if (!payload.username) {
      throw new UnauthorizedException("JWT token无效 - 缺少用户名");
    }

    // 将 sub 转换为数字（兼容字符串和数字类型）
    const userId =
      typeof payload.sub === "string" ? parseInt(payload.sub, 10) : payload.sub;

    // 验证用户ID的有效性
    if (isNaN(userId) || userId <= 0) {
      throw new UnauthorizedException("用户ID无效");
    }

    // 实时查库：以数据库为准获取最新的角色与状态
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ["id", "username", "role", "status"],
    });

    if (!user) {
      throw new UnauthorizedException("用户不存在或已被删除");
    }
    if (user.status !== 1) {
      throw new UnauthorizedException("账号已被禁用");
    }

    const result = {
      userId: user.id,
      username: user.username,
      role: user.role || UserRole.USER,
    };

    // 仅在开发环境输出日志，且不包含敏感信息
    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ JWT validation successful for user: ${result.username} (ID: ${result.userId})`,
      );
    }

    return result;
  }
}
