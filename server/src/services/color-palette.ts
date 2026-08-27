import sharp from "sharp";
import { rgbToHex } from "./wallpaper-filters";

/** 详情色板最多展示的主色数 */
export const PALETTE_MAX = 5;

/** 已选色之间的最小 RGB 欧氏距离，避免 5 块都是相近蓝 */
const MIN_DIST = 52;

/** 次要色至少占采样像素的比例，过滤噪点 */
const MIN_SHARE = 0.02;

const HEX_RE = /^#[0-9a-f]{6}$/i;

/** 直方图量化 + 贪心去重，按像素占比降序取出主色 */
export function extractColorPalette(
  rgb: Uint8Array,
  maxColors = PALETTE_MAX,
): string[] {
  const bins = new Map<
    number,
    { r: number; g: number; b: number; n: number }
  >();
  const step = 3;
  const limit = rgb.length - (rgb.length % step);
  for (let i = 0; i < limit; i += step) {
    const r = rgb[i];
    const g = rgb[i + 1];
    const b = rgb[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    let bin = bins.get(key);
    if (!bin) {
      bin = { r: 0, g: 0, b: 0, n: 0 };
      bins.set(key, bin);
    }
    bin.r += r;
    bin.g += g;
    bin.b += b;
    bin.n += 1;
  }

  if (!bins.size) return ["#808080"];

  const ranked = [...bins.values()]
    .map((bin) => ({
      r: bin.r / bin.n,
      g: bin.g / bin.n,
      b: bin.b / bin.n,
      n: bin.n,
    }))
    .sort((a, b) => b.n - a.n);

  const total = ranked.reduce((sum, c) => sum + c.n, 0);
  const minCount = total * MIN_SHARE;
  const minDistSq = MIN_DIST * MIN_DIST;
  const picked: typeof ranked = [];

  for (const color of ranked) {
    if (picked.length >= maxColors) break;
    if (picked.length > 0 && color.n < minCount) continue;
    const far = picked.every((p) => {
      const dr = color.r - p.r;
      const dg = color.g - p.g;
      const db = color.b - p.b;
      return dr * dr + dg * dg + db * db >= minDistSq;
    });
    if (far) picked.push(color);
  }

  return picked.map((c) => rgbToHex(c.r, c.g, c.b));
}

/** 缩到 64px 再量化，上传与旧数据回填共用 */
export async function samplePaletteFromImage(
  buffer: Buffer,
): Promise<string[]> {
  const raw = await sharp(buffer, { limitInputPixels: 100_000_000 })
    .rotate()
    .resize(64, 64, { fit: "inside" })
    // 透明壁纸必须先把透明区合成到白底再丢 alpha：libvips 缩放后 a=0 像素的
    // RGB 全部归零，直接 removeAlpha 会让不可见像素（纯黑）主导直方图
    .flatten({ background: "#ffffff" })
    .raw()
    .toBuffer();
  return extractColorPalette(raw);
}

export function isHexPalette(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((c) => typeof c === "string" && HEX_RE.test(c))
  );
}
