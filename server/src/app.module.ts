import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { ScheduleModule } from "@nestjs/schedule";

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
      envFilePath: ".env",
    }),
    // 使用异步配置,确保环境变量先加载
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get<string>("DB_HOST") || "localhost",
        port: configService.get<number>("DB_PORT") || 3306,
        username: configService.get<string>("DB_USERNAME") || "root",
        password: configService.get<string>("DB_PASSWORD"),
        database: configService.get<string>("DB_DATABASE") || "wallpaper_site",
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: true,
        logging: true,
        charset: "utf8mb4",
        timezone: "+08:00",
      }),
    }),
    HttpModule,
    ScheduleModule.forRoot(),
    UserModule,
    WallpaperModule,
    TagModule,
    ForumModule,
    AdminModule,
  ],
})
export class AppModule {}
