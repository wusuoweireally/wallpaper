import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { User } from "../entities/user.entity";
import { UserService } from "../services/user.service";
import { AuthService } from "../services/auth.service";
import { GitHubAuthService } from "../services/github-auth.service";
import { AdminSeedService } from "../services/admin-seed.service";
import { UserController } from "../controllers/user.controller";
import { AuthController } from "../controllers/auth.controller";
import { JwtStrategy } from "../auth/jwt.strategy";
import { GitHubStrategy } from "../auth/github.strategy";
import { WallpaperModule } from "./wallpaper.module";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { GitHubAuthGuard } from "../auth/github-auth.guard";
import { parseDurationSeconds } from "../utils/duration";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>("JWT_SECRET");
        if (!secret) {
          throw new Error("JWT_SECRET 未配置");
        }
        const expiresIn = parseDurationSeconds(
          configService.get<string>("JWT_EXPIRES_IN") ?? "30d",
        );
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
    WallpaperModule,
  ],
  controllers: [UserController, AuthController],
  providers: [
    UserService,
    AuthService,
    GitHubAuthService,
    AdminSeedService,
    JwtStrategy,
    GitHubStrategy,
    GitHubAuthGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [UserService, AuthService, GitHubAuthService],
})
export class UserModule {}
