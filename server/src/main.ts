import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import * as express from "express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./filters/http-exception.filter";

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // 启用CORS - 生产环境限制域名，开发环境允许所有
    const allowedOrigins =
      process.env.NODE_ENV === "production"
        ? [process.env.FRONTEND_URL || "https://yourdomain.com"]
        : true;

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });

    app.useGlobalFilters(new HttpExceptionFilter());

    // 使用cookie解析器
    app.use(cookieParser());

    // 配置静态文件服务
    app.use(express.static(join(__dirname, "..", "public")));

    // 配置上传文件静态服务 - 统一管理
    app.use("/uploads", express.static(join(__dirname, "..", "uploads")));

    // 全局验证管道
    // 信任反向代理的 X-Forwarded-For 头（Docker Compose 架构: 宿主机 Nginx → web 容器 Nginx → server）
    // 不设置会导致全局限流器所有用户共享同一个 IP，限流失效
    app.set("trust proxy", 2);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const port = process.env.PORT || 3000;

    await app.listen(port);

    console.log(`🚀 应用启动成功！`);
    console.log(`📍 服务器地址: http://localhost:${port}`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `📊 数据库: MySQL - ${process.env.DB_DATABASE || "wallpaper_site"}`,
    );
    console.log(
      `🔒 TypeORM synchronize: 已强制关闭（使用迁移文件管理 schema）`,
    );
  } catch (error) {
    // 增强启动错误诊断，特别是 TypeORM / synchronize 相关问题
    console.error("\n❌ 应用启动失败！");

    if (error instanceof Error) {
      console.error("错误信息:", error.message);

      // 针对 synchronize / schema 同步的常见问题给出明确提示
      if (
        error.message.includes("synchronize") ||
        error.message.includes("ALTER") ||
        error.message.includes("migration") ||
        error.message.includes("Connection") ||
        error.message.includes("ECONNREFUSED")
      ) {
        console.error(`
⚠️  可能原因与解决建议：
   1. 当前已强制禁用 synchronize: true，请使用 TypeORM 迁移管理数据库变更。
   2. 如果数据库 schema 与实体定义不一致，请执行：
      cd server
      npx typeorm migration:generate src/migrations/YourMigrationName -d src/config/data-source.ts
      npx typeorm migration:run -d src/config/data-source.ts
   3. 检查 .env 中的 DB_* 配置是否正确。
   4. 生产环境请永远不要开启 TYPEORM_SYNCHRONIZE=true。
`);
      }
    } else {
      console.error("未知错误:", error);
    }

    console.error("\n堆栈信息（开发调试用）：", error);
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
