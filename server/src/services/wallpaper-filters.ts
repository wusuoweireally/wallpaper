/**
 * 壁纸列表筛选纯函数（查询参数解析 + 内存断言用）
 * SQL 侧与内存侧共用同一套语义，避免前后端/测试漂移。
 */

export type ColorBucket =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "purple"
  | "pink"
  | "brown"
  | "black"
  | "gray"
  | "white";

export const COLOR_BUCKETS: ColorBucket[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
  "brown",
  "black",
  "gray",
  "white",
];

/** topRange → 毫秒窗口（1d/3d/1w/1M/3M/6M/1y） */
const TOP_RANGE_MS: Record<string, number> = {
  "1d": 1 * 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  "3M": 90 * 24 * 60 * 60 * 1000,
  "6M": 180 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
};

export function isValidTopRange(value?: string): value is string {
  return !!value && Object.prototype.hasOwnProperty.call(TOP_RANGE_MS, value);
}

/** 将 topRange 转为 since 时间点；无效返回 undefined */
export function resolveTopRangeSince(
  topRange?: string,
  now: number = Date.now(),
): Date | undefined {
  if (!isValidTopRange(topRange)) return undefined;
  return new Date(now - TOP_RANGE_MS[topRange]);
}

/** 解析 "1920x1080" / "1920×1080" */
export function parseResolutionToken(
  token: string,
): { width: number; height: number } | null {
  const m = String(token)
    .trim()
    .toLowerCase()
    .match(/^(\d{3,5})\s*[x×]\s*(\d{3,5})$/i);
  if (!m) return null;
  const width = Number(m[1]);
  const height = Number(m[2]);
  if (!width || !height || width > 20000 || height > 20000) return null;
  return { width, height };
}

export function parseResolutionList(
  tokens?: string[],
): Array<{ width: number; height: number }> {
  if (!tokens?.length) return [];
  const out: Array<{ width: number; height: number }> = [];
  for (const t of tokens) {
    const p = parseResolutionToken(t);
    if (p) out.push(p);
  }
  return out;
}

/** 宽高比 ±tolerance 相对容差 */
export function aspectRatioBounds(
  aspectRatio: number,
  tolerance = 0.1,
): { min: number; max: number } {
  const t = Math.abs(aspectRatio) * tolerance;
  return { min: aspectRatio - t, max: aspectRatio + t };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** 粗粒度色相桶，便于筛选与测试确定性 */
export function rgbToColorBucket(r: number, g: number, b: number): ColorBucket {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (l < 0.12) return "black";
  if (l > 0.9 && s < 0.15) return "white";
  if (s < 0.12) return "gray";

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  // 棕色：低饱和偏橙黄且偏暗
  if (h >= 15 && h < 50 && l < 0.45 && s < 0.55) return "brown";

  if (h < 15 || h >= 345) return "red";
  if (h < 40) return "orange";
  if (h < 70) return "yellow";
  if (h < 160) return "green";
  if (h < 200) return "cyan";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  return "pink";
}

export function hexToColorBucket(hex: string): ColorBucket | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return rgbToColorBucket((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

/** 规范化 color 查询：支持 bucket 名或 #hex */
export function normalizeColorFilter(color?: string): string | undefined {
  if (!color?.trim()) return undefined;
  const c = color.trim().toLowerCase();
  if ((COLOR_BUCKETS as string[]).includes(c)) return c;
  const fromHex = hexToColorBucket(c.startsWith("#") ? c : `#${c}`);
  return fromHex ?? undefined;
}

export interface WallpaperFilterRecord {
  width: number;
  height: number;
  aspectRatio?: number | null;
  category?: string;
  colorBucket?: string | null;
  dominantColor?: string | null;
  createdAt?: Date | string;
  tagNames?: string[];
  status?: number;
}

export interface WallpaperFilterCriteria {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
  category?: string;
  color?: string;
  resolutions?: string[];
  topRange?: string;
  tags?: string[]; // AND：须全部命中
  now?: number;
}

/** 内存侧断言：fixture 是否满足与列表 API 一致的筛选语义 */
export function matchesWallpaperFilters(
  wp: WallpaperFilterRecord,
  criteria: WallpaperFilterCriteria,
): boolean {
  if (wp.status !== undefined && wp.status !== 1) return false;

  if (criteria.minWidth && wp.width < criteria.minWidth) return false;
  if (criteria.maxWidth && wp.width > criteria.maxWidth) return false;
  if (criteria.minHeight && wp.height < criteria.minHeight) return false;
  if (criteria.maxHeight && wp.height > criteria.maxHeight) return false;

  if (criteria.aspectRatio) {
    const ratio =
      wp.aspectRatio ??
      (wp.height ? Number((wp.width / wp.height).toFixed(2)) : 0);
    const { min, max } = aspectRatioBounds(criteria.aspectRatio);
    if (ratio < min || ratio > max) return false;
  }

  if (criteria.category && wp.category !== criteria.category) return false;

  const color = normalizeColorFilter(criteria.color);
  if (color) {
    const bucket =
      wp.colorBucket ||
      (wp.dominantColor ? hexToColorBucket(wp.dominantColor) : null);
    if (bucket !== color) return false;
  }

  const exact = parseResolutionList(criteria.resolutions);
  if (exact.length > 0) {
    const hit = exact.some(
      (r) => r.width === wp.width && r.height === wp.height,
    );
    if (!hit) return false;
  }

  const since = resolveTopRangeSince(criteria.topRange, criteria.now);
  if (since && wp.createdAt) {
    const t = new Date(wp.createdAt).getTime();
    if (t < since.getTime()) return false;
  }

  if (criteria.tags?.length) {
    const names = new Set(
      (wp.tagNames || []).map((n) => n.toLowerCase().trim()),
    );
    for (const tag of criteria.tags) {
      if (!names.has(tag.toLowerCase().trim())) return false;
    }
  }

  return true;
}
