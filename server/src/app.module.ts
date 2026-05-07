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
        const dbConfig = {
          type: "mysql" as const,
          host: configService.get<string>("DB_HOST") || "127.0.0.1",
          port: configService.get<number>("DB_PORT") || 3306,
          username: configService.get<string>("DB_USERNAME") || "root",
          password: configService.get<string>("DB_PASSWORD") || "12345678",
          database:
            configService.get<string>("DB_DATABASE") || "wallpaper_site",
          entities: [join(__dirname, "**", "*.entity{.ts,.js}")],
          synchronize: true,
          logging: true,
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
