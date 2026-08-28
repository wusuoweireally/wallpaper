import { isIP } from "node:net";
import type { Request } from "express";

const firstHeaderValue = (value: string | string[] | undefined): string => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return "";
  }
  return raw.split(",")[0]?.trim() ?? "";
};

/** 去掉 zone / 括号，并把 IPv4-mapped IPv6 收成 IPv4，避免同一客户端拆成两个去重键 */
export const normalizeClientIp = (ip: string): string => {
  let value = ip.trim().toLowerCase();
  if (value.startsWith("[") && value.endsWith("]")) {
    value = value.slice(1, -1);
  }
  const zone = value.indexOf("%");
  if (zone !== -1) {
    value = value.slice(0, zone);
  }
  if (value.startsWith("::ffff:") && isIP(value.slice(7)) === 4) {
    return value.slice(7);
  }
  return isIP(value) ? value : "";
};

/**
 * 游客去重用的客户端 IP。
 * 生产链路：Cloudflare → 宿主机 Nginx → web Nginx → server。
 * trust proxy hops 不准时 request.ip 会落在 Cloudflare 边缘（公网且会抖动）
 * 或 Docker 私网地址上，内存 Map 去重随之失效。
 *
 * 优先级：
 * 1. CF-Connecting-IP（Cloudflare 覆盖写入，访客真实 IP）
 * 2. True-Client-IP（CF Enterprise）
 * 3. X-Forwarded-For 最左侧（比边缘 IP 稳定）
 * 4. request.ip
 */
export const getClientIp = (request: Request): string => {
  const cf = normalizeClientIp(
    firstHeaderValue(request.headers["cf-connecting-ip"]),
  );
  if (cf) {
    return cf;
  }
  const trueClient = normalizeClientIp(
    firstHeaderValue(request.headers["true-client-ip"]),
  );
  if (trueClient) {
    return trueClient;
  }
  const xff = normalizeClientIp(
    firstHeaderValue(request.headers["x-forwarded-for"]),
  );
  if (xff) {
    return xff;
  }
  return normalizeClientIp(request.ip ?? "");
};
