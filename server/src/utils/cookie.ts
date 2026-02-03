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

const isIpOrLocalhost = (hostname: string): boolean => {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  );
};

const getRootDomain = (hostname: string): string | undefined => {
  if (isIpOrLocalhost(hostname)) {
    return hostname;
  }

  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }

  return undefined;
};

const isSameSiteHost = (frontendHost: string, backendHost: string): boolean => {
  if (isIpOrLocalhost(frontendHost) || isIpOrLocalhost(backendHost)) {
    return frontendHost === backendHost;
  }

  const frontendRoot = getRootDomain(frontendHost);
  const backendRoot = getRootDomain(backendHost);
  if (!frontendRoot || !backendRoot) {
    return true;
  }

  return frontendRoot === backendRoot;
};

/**
 * 获取 Cookie 的 secure 设置
 * 优先读取环境变量,否则根据请求协议或环境判断
 */
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

/**
 * 获取 Cookie 的 domain 设置
 * 优先读取 COOKIE_DOMAIN,否则从 FRONTEND_URL 推导
 *
 * @returns string | undefined - 返回 domain 值,对于 localhost/IP 返回 undefined
 */
export const getCookieDomain = (): string | undefined => {
  const envDomain = process.env.COOKIE_DOMAIN;
  if (envDomain) {
    return envDomain.startsWith(".") ? envDomain : `.${envDomain}`;
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:1234";

  try {
    const url = new URL(frontendUrl);
    const hostname = url.hostname;

    // 对于 localhost 或 IP 地址,不设置 domain
    if (isIpOrLocalhost(hostname)) {
      return undefined;
    }

    const rootDomain = getRootDomain(hostname);
    return rootDomain ? `.${rootDomain}` : undefined;
  } catch (error) {
    console.warn("无法解析 FRONTEND_URL,不设置 Cookie domain:", error);
    return undefined;
  }
};

/**
 * 获取 Cookie 的 SameSite 设置
 * 支持环境变量覆盖,否则根据前后端是否同站点自动判断
 */
export const getCookieSameSite = (request?: Request): SameSiteOption => {
  const envValue = process.env.COOKIE_SAMESITE;
  if (envValue) {
    return normalizeSameSite(envValue);
  }

  if (!request) {
    return "lax";
  }

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    return "lax";
  }

  try {
    const frontendHost = new URL(frontendUrl).hostname;
    const backendHost = (request.headers.host || "").split(":")[0];
    if (!backendHost) {
      return "lax";
    }

    const sameSite = isSameSiteHost(frontendHost, backendHost);
    return sameSite ? "lax" : "none";
  } catch (error) {
    console.warn("无法解析 FRONTEND_URL,使用默认 SameSite:", error);
    return "lax";
  }
};

/**
 * 统一生成认证 Cookie 配置
 */
export const getAuthCookieOptions = (
  request?: Request,
  overrides: CookieOptions = {},
): CookieOptions => {
  const secure = getCookieSecure(request);
  let sameSite = getCookieSameSite(request);

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
