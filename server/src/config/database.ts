import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

export function getEnvFilePaths(): string[] {
  const nodeEnv = process.env.NODE_ENV || "development";
  const suffix = nodeEnv === "dev" ? "dev" : nodeEnv;
  return [`.env.${suffix}`, ".env"];
}

export function loadDatabaseEnvironment(): void {
  for (const path of getEnvFilePaths()) {
    if (existsSync(path)) loadEnvFile(path);
  }
}

export function getDatabaseConnectionOptions() {
  if (process.env.NODE_ENV === "production") {
    for (const key of [
      "DB_HOST",
      "DB_USERNAME",
      "DB_PASSWORD",
      "DB_DATABASE",
    ]) {
      if (!process.env[key]?.trim()) {
        throw new Error(`生产环境必须配置 ${key}`);
      }
    }
  }

  return {
    type: "mysql" as const,
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "wallpaper_site",
    charset: "utf8mb4",
    timezone: "+08:00",
    supportBigNumbers: true,
    bigNumberStrings: false,
  };
}
