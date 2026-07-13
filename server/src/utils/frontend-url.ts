import type { ConfigService } from "@nestjs/config";

export const getSafeFrontendUrl = (config: ConfigService): string => {
  const fallback = "http://localhost:1234";
  const configured = config.get<string>("FRONTEND_URL", fallback);

  try {
    const parsed = new URL(configured);
    if (!["http:", "https:"].includes(parsed.protocol)) return fallback;

    const allowedOrigins = config
      .get<string>("ALLOWED_FRONTEND_ORIGINS", "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    if (allowedOrigins.length > 0 && !allowedOrigins.includes(parsed.origin)) {
      return fallback;
    }

    return configured.replace(/\/$/, "");
  } catch {
    return fallback;
  }
};
