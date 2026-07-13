import type { CookieOptions, Request } from "express";

type SameSiteOption = "lax" | "strict" | "none";

const normalizeSameSite = (value?: string): SameSiteOption => {
  const normalized = (value || "").trim().toLowerCase();
  if (
    normalized === "none" ||
    normalized === "strict" ||
    normalized === "lax"
  ) {
    return normalized;
  }
  return "lax";
};

export const getCookieSecure = (request?: Request): boolean => {
  const envValue = process.env.COOKIE_SECURE;
  if (envValue === "true") {
    return true;
  }
  if (envValue === "false") {
    return false;
  }

  if (request) {
    const forwardedProto = request.headers["x-forwarded-proto"];
    const proto = Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : forwardedProto;
    if (proto) {
      return proto === "https";
    }
    if (typeof request.secure === "boolean") {
      return request.secure;
    }
  }

  return process.env.NODE_ENV === "production";
};

export const getCookieDomain = (): string | undefined => {
  const domain = process.env.COOKIE_DOMAIN?.trim();
  return domain || undefined;
};

export const getCookieSameSite = (): SameSiteOption => {
  return normalizeSameSite(process.env.COOKIE_SAMESITE);
};

/**
 * 统一生成认证 Cookie 配置
 */
export const getAuthCookieOptions = (
  request?: Request,
  overrides: CookieOptions = {},
): CookieOptions => {
  const secure = getCookieSecure(request);
  let sameSite = getCookieSameSite();

  // SameSite=None 必须配合 Secure,否则浏览器会拒绝
  if (sameSite === "none" && !secure) {
    console.warn("SameSite=None 需要 HTTPS (Secure),已自动降级为 SameSite=Lax");
    sameSite = "lax";
  }

  const options: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    ...overrides,
  };

  const cookieDomain = getCookieDomain();
  if (cookieDomain) {
    options.domain = cookieDomain;
  }

  return options;
};
