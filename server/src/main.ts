import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { join } from "path";
import * as express from "express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 使用cookie解析器
  app.use(cookieParser());

  // 配置静态文件服务
  app.use(express.static(join(__dirname, "..", "public")));

  // 配置上传文件静态服务 - 统一管理
  app.use("/uploads", express.static(join(__dirname, "..", "uploads")));

  // 全局验证管道
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
  console.log(`🌍 环境: ${process.env.NODE_ENV}`);
  console.log(`📊 数据库: MySQL - wallpaper_site`);
}

bootstrap().catch((error) => {
  console.error("❌ 应用启动失败:", error);
  process.exit(1);
});
