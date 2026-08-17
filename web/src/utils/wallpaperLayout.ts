/**
 * 图墙展示：画质档、标题、瀑布流比例、去重拼墙
 * 纯函数，卡片 / 首页 / 单测共用
 */

const CATEGORY_LABELS: Record<string, string> = {
  general: "综合",
  anime: "动漫",
  people: "人物",
}

/** 首屏图墙条数：铺满第一屏，避免搜索英雄占位 */
export const HOME_FOLD_SIZE = 24

/** 画质分档：按长边像素，竖屏图也准确 */
export function qualityLabel(width: number, height: number): string {
  const w = Number(width)
  const h = Number(height)
  const longEdge = Math.max(Number.isFinite(w) ? w : 0, Number.isFinite(h) ? h : 0)
  if (longEdge >= 7000) return "8K"
  if (longEdge >= 3800) return "4K"
  if (longEdge >= 2500) return "2K"
  if (longEdge >= 1900) return "1080P"
  return "HD"
}

/** 展示名：壁纸无标题字段，用首个标签，回退分类名 */
export function wallpaperDisplayTitle(
  tags?: Array<{ name?: string }> | null,
  category?: string,
): string {
  const name = tags?.find((t) => t?.name?.trim())?.name?.trim()
  if (name) return name
  return CATEGORY_LABELS[category || ""] || "壁纸"
}

/** 瀑布流卡片宽高比；非法尺寸回退 16/10 */
export function masonryAspectRatio(width: number, height: number): string {
  const w = Number(width)
  const h = Number(height)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return "16/10"
  }
  return `${Math.round(w)}/${Math.round(h)}`
}

/** 断点列数：与 .wb-masonry 视觉密度对齐 */
export function masonryColumnCount(width: number): number {
  const w = Number(width)
  if (!Number.isFinite(w) || w < 640) return 2
  if (w < 900) return 3
  if (w < 1200) return 4
  if (w < 1536) return 5
  if (w < 1800) return 6
  return 7
}

/**
 * 最短列优先分栏（横铺，避免 CSS column-fill 把少量图堆成单列）
 * itemHeight 缺省时按 1，等价于从左到右轮询
 */
export function splitMasonryColumns<T>(
  items: T[],
  columnCount: number,
  itemHeight?: (item: T) => number,
): T[][] {
  const requested = Math.max(1, Math.floor(Number(columnCount)) || 1)
  if (!Array.isArray(items) || items.length === 0) {
    return Array.from({ length: requested }, () => [])
  }
  const n = Math.min(requested, items.length)
  const cols: T[][] = Array.from({ length: n }, () => [])
  const heights = Array(n).fill(0)
  for (const item of items) {
    let idx = 0
    for (let i = 1; i < n; i++) {
      if (heights[i] < heights[idx]) idx = i
    }
    cols[idx].push(item)
    const h = itemHeight ? itemHeight(item) : 1
    heights[idx] += Number.isFinite(h) && h > 0 ? h : 1
  }
  return cols
}

/** 相对高度：高/宽，非法回退 0.625（16:10） */
export function masonryItemWeight(width: number, height: number): number {
  const w = Number(width)
  const h = Number(height)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 0.625
  return h / w
}

/** 按 id 去重拼接多组壁纸，截到 limit（精选墙不够时用热门/最新补） */
export function mergeUniqueById<T extends { id: number }>(groups: T[][], limit: number): T[] {
  const cap = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0
  if (cap <= 0) return []
  const seen = new Set<number>()
  const out: T[] = []
  for (const group of groups) {
    if (!Array.isArray(group)) continue
    for (const item of group) {
      if (!item || typeof item.id !== "number" || seen.has(item.id)) continue
      seen.add(item.id)
      out.push(item)
      if (out.length >= cap) return out
    }
  }
  return out
}
