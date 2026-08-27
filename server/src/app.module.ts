import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { join } from "path";
import { validateEnvironment } from "./config/env.validation";
import {
  getDatabaseConnectionOptions,
  getEnvFilePaths,
} from "./config/database";

//用户自定义的模块
import { UserModule } from "./modules/user.module";
import { WallpaperModule } from "./modules/wallpaper.module";
import { TagModule } from "./modules/tag.module";
import { ForumModule } from "./modules/forum.module";
import { AdminModule } from "./modules/admin.module";
import { DiagnosticsModule } from "./modules/diagnostics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      envFilePath: getEnvFilePaths(),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDev =
          (configService.get<string>("NODE_ENV") || "development") !==
          "production";

        const dbConfig = {
          ...getDatabaseConnectionOptions(),
          entities: [join(__dirname, "**", "*.entity{.ts,.js}")],
          // 强制关闭自动同步，改用迁移文件
          synchronize: false,
          // Docker/生产环境可通过 TYPEORM_MIGRATIONS_RUN=true 在启动时执行迁移
          migrationsRun:
            configService.get<string>("TYPEORM_MIGRATIONS_RUN") === "true",
          migrations: [join(__dirname, "migrations", "*{.ts,.js}")],
          logging:
            configService.get<string>("TYPEORM_LOGGING") === "true" || isDev,
          retryAttempts: 10,
          retryDelay: 3000,
          keepConnectionAlive: true,
          connectorPackage: "mysql2" as const,
        };
        return dbConfig;
      },
    }),
    // 只注册 default；多 name 会套全站。登录/上传用 @Throttle 覆盖本路由
    ThrottlerModule.forRoot([{ name: "default", ttl: 60000, limit: 200 }]),
    ScheduleModule.forRoot(),
    UserModule,
    WallpaperModule,
    TagModule,
    ForumModule,
    AdminModule,
    DiagnosticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
