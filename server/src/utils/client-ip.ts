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

/** 回环 / 私网：trust proxy hops 不准时 request.ip 常落在这些地址上 */
const isUnreliableIp = (ip: string): boolean => {
  if (!ip) {
    return true;
  }
  if (ip === "127.0.0.1" || ip === "0.0.0.0" || ip === "::1" || ip === "::") {
    return true;
  }
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) {
    return true;
  }
  if (ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) {
    return true;
  }
  return false;
};

/**
 * 游客去重用的客户端 IP。
 * 生产链路：Cloudflare → 宿主机 Nginx → web Nginx → server。
 * Express request.ip 依赖 trust proxy hops；hops 不准时会落到某一跳代理
 * （含 Cloudflare 边缘 IP，同会话可能变化），内存去重随之失效。
 *
 * 优先级：
 * 1. CF-Connecting-IP（Cloudflare 原始客户端）
 * 2. 可靠的 request.ip（非空且非私网/回环）
 * 3. X-Forwarded-For 最左侧客户端 IP
 * 4. 退化到 request.ip（可能为空）
 */
export const getClientIp = (request: Request): string => {
  const cf = normalizeClientIp(
    firstHeaderValue(request.headers["cf-connecting-ip"]),
  );
  if (cf) {
    return cf;
  }

  const reqIp = normalizeClientIp(request.ip ?? "");
  if (reqIp && !isUnreliableIp(reqIp)) {
    return reqIp;
  }

  const xff = normalizeClientIp(
    firstHeaderValue(request.headers["x-forwarded-for"]),
  );
  if (xff) {
    return xff;
  }

  return reqIp;
};
