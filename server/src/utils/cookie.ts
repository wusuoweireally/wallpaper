/**
 * 获取 Cookie 的 secure 设置
 * HTTP 环境返回 false,HTTPS 环境返回 true
 */
export const getCookieSecure = (): boolean => {
  const envValue = process.env.COOKIE_SECURE;
  if (envValue === "true") {
    return true;
  }
  if (envValue === "false") {
    return false;
  }
  return process.env.NODE_ENV === "production";
};

/**
 * 获取 Cookie 的 domain 设置
 * 对于 localhost 和 IP 地址,不设置 domain
 * 对于域名,设置为根域名 (例如 .example.com)
 *
 * @returns string | undefined - 返回 domain 值,对于 localhost/IP 返回 undefined
 */
export const getCookieDomain = (): string | undefined => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:1234";

  try {
    const url = new URL(frontendUrl);
    const hostname = url.hostname;

    // 对于 localhost 或 IP 地址,不设置 domain
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
    ) {
      return undefined;
    }

    // 对于域名,返回根域名 (例如 example.com -> .example.com)
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join(".")}`;
    }

    return undefined;
  } catch (error) {
    console.warn("无法解析 FRONTEND_URL,不设置 Cookie domain:", error);
    return undefined;
  }
};
