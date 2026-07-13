import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "../entities/user.entity";

interface JwtPayload {
  sub: number | string;
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
    const cookieExtractor = (request?: Request): string | null => {
      const cookies = request?.cookies as Record<string, string> | undefined;
      return cookies?.Authentication ?? null;
    };

    const secretOrKey = configService.get<string>("JWT_SECRET");

    if (
      !secretOrKey ||
      ["your-secret-key", "your_jwt_secret_here"].includes(
        secretOrKey.toLowerCase(),
      )
    ) {
      throw new Error(
        "JWT_SECRET must be set in environment variables and cannot be the default value",
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException("JWT token无效 - 缺少用户ID");
    }
    if (!payload.username) {
      throw new UnauthorizedException("JWT token无效 - 缺少用户名");
    }

    const userId =
      typeof payload.sub === "string" ? Number(payload.sub) : payload.sub;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new UnauthorizedException("用户ID无效");
    }

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

    return {
      userId: Number(user.id),
      username: user.username,
      role: user.role || UserRole.USER,
    };
  }
}
