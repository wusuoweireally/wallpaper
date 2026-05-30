import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { join } from "path";

//用户自定义的模块
import { UserModule } from "./modules/user.module";
import { WallpaperModule } from "./modules/wallpaper.module";
import { TagModule } from "./modules/tag.module";
import { ForumModule } from "./modules/forum.module";
import { AdminModule } from "./modules/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: (() => {
        const nodeEnv = process.env.NODE_ENV || "development";
        const envSuffix = nodeEnv === "dev" ? "dev" : nodeEnv;
        return [`.env.${envSuffix}`, ".env"];
      })(),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // ⚠️ 重要安全配置：synchronize 仅允许在开发环境显式开启，生产环境严禁使用！
        // 使用 synchronize: true 会导致启动时执行大量 DDL，极易引发进程崩溃、数据不一致和迁移冲突。
        // 正确做法：始终使用迁移文件管理 schema。
        const isDev =
          (configService.get<string>("NODE_ENV") || "development") !==
          "production";
        const allowSync =
          configService.get<string>("TYPEORM_SYNCHRONIZE") === "true";

        const synchronize = isDev && allowSync;

        if (synchronize) {
          console.warn(
            "\n⚠️  [TypeORM] synchronize 模式已启用（仅限开发环境）。\n" +
              "   强烈建议尽快迁移到正式的数据库迁移流程！\n" +
              "   生产环境请确保 TYPEORM_SYNCHRONIZE 永远不要设置为 true。\n",
          );
        }

        const dbConfig = {
          type: "mysql" as const,
          host: configService.get<string>("DB_HOST") || "127.0.0.1",
          port: configService.get<number>("DB_PORT") || 3306,
          username: configService.get<string>("DB_USERNAME") || "root",
          password: configService.get<string>("DB_PASSWORD") || "12345678",
          database:
            configService.get<string>("DB_DATABASE") || "wallpaper_site",
          entities: [join(__dirname, "**", "*.entity{.ts,.js}")],
          // 强制关闭自动同步，改用迁移文件
          synchronize: false,
          // Docker/生产环境可通过 TYPEORM_MIGRATIONS_RUN=true 在启动时执行迁移
          migrationsRun:
            configService.get<string>("TYPEORM_MIGRATIONS_RUN") === "true",
          migrations: [join(__dirname, "migrations", "*{.ts,.js}")],
          logging:
            configService.get<string>("TYPEORM_LOGGING") === "true" || isDev,
          charset: "utf8mb4",
          timezone: "+08:00",
          retryAttempts: 10,
          retryDelay: 3000,
          keepConnectionAlive: true,
          connectorPackage: "mysql2" as const,
        };
        return dbConfig;
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60000,
        limit: 100,
      },
      {
        name: "auth",
        ttl: 300000,
        limit: 10,
      },
      {
        name: "upload",
        ttl: 3600000,
        limit: 50,
      },
    ]),
    HttpModule,
    ScheduleModule.forRoot(),
    UserModule,
    WallpaperModule,
    TagModule,
    ForumModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
