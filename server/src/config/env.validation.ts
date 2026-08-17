const PLACEHOLDER_SECRETS = new Set([
  "your-secret-key",
  "your_jwt_secret_here",
  "your_admin_password",
  "change_me",
  "changeme",
  "replace_me",
]);

function readString(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  return typeof value === "string" ? value.trim() : "";
}

function assertSecret(
  name: string,
  value: string,
  minimumLength: number,
): void {
  if (!value || PLACEHOLDER_SECRETS.has(value.toLowerCase())) {
    throw new Error(`${name} 未配置或仍为示例占位值`);
  }
  if (value.length < minimumLength) {
    throw new Error(`${name} 长度不能少于 ${minimumLength} 个字符`);
  }
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const isProduction = readString(config, "NODE_ENV") === "production";
  const jwtSecret = readString(config, "JWT_SECRET");

  assertSecret("JWT_SECRET", jwtSecret, isProduction ? 32 : 16);

  if (readString(config, "COOKIE_SAMESITE").toLowerCase() === "none") {
    throw new Error(
      "当前认证接口不支持 COOKIE_SAMESITE=none，请使用同站点部署",
    );
  }

  if (isProduction) {
    for (const key of [
      "DB_HOST",
      "DB_USERNAME",
      "DB_PASSWORD",
      "DB_DATABASE",
      "FRONTEND_URL",
      "COS_BUCKET",
      "COS_REGION",
      "COS_PUBLIC_BASE",
    ]) {
      if (!readString(config, key)) {
        throw new Error(`生产环境必须配置 ${key}`);
      }
    }
    assertSecret("COS_SECRET_ID", readString(config, "COS_SECRET_ID"), 10);
    assertSecret("COS_SECRET_KEY", readString(config, "COS_SECRET_KEY"), 16);

    const frontendUrl = new URL(readString(config, "FRONTEND_URL"));
    if (frontendUrl.protocol !== "https:") {
      throw new Error("生产环境 FRONTEND_URL 必须使用 HTTPS");
    }
    if (readString(config, "COOKIE_SECURE").toLowerCase() !== "true") {
      throw new Error("生产环境 COOKIE_SECURE 必须为 true");
    }
  }

  const adminId = readString(config, "ADMIN_USER_ID");
  const adminPassword = readString(config, "ADMIN_USER_PASSWORD");
  if (adminId || adminPassword) {
    if (!adminId || !/^\d+$/.test(adminId) || Number(adminId) <= 0) {
      throw new Error("ADMIN_USER_ID 必须是正整数");
    }
    assertSecret("ADMIN_USER_PASSWORD", adminPassword, isProduction ? 12 : 8);
  }

  return config;
}
