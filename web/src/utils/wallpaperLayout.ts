/**
 * 图墙展示：画质档、标题、瀑布流比例、去重拼墙
 * 纯函数，卡片 / 首页 / 单测共用
 */

const CATEGORY_LABELS: Record<string, string> = {
  general: "综合",
  anime: "动漫",
  people: "真人",
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
  const weight = (item: T) => {
    const h = itemHeight ? itemHeight(item) : 1
    return Number.isFinite(h) && h > 0 ? h : 1
  }
  for (const item of items) {
    let idx = 0
    for (let i = 1; i < n; i++) {
      if (heights[i] < heights[idx]) idx = i
    }
    cols[idx].push(item)
    heights[idx] += weight(item)
  }
  swapTails(cols, heights, weight)
  return cols
}

/**
 * 末位交换收敛尾差：反复枚举所有列对的「最后一张」交换，
 * 取能让全体列高极差严格减小最多的一对执行，直到无改进。
 * 只换末位保证阅读顺序基本不变（同列内顺序不动，仅结尾互换）。
 */
function swapTails<T>(cols: T[][], heights: number[], weight: (item: T) => number): void {
  const n = cols.length
  if (n < 2) return
  const spread = () => Math.max(...heights) - Math.min(...heights)
  // 防御性上限：正常几轮就收敛，避免极端权重构造死循环
  for (let round = 0; round < n * n + 8; round++) {
    const before = spread()
    if (before <= Number.EPSILON) return
    let bestI = -1
    let bestJ = -1
    let bestSpread = before
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const wI = weight(cols[i][cols[i].length - 1])
        const wJ = weight(cols[j][cols[j].length - 1])
        heights[i] += wJ - wI
        heights[j] += wI - wJ
        const after = spread()
        heights[i] -= wJ - wI
        heights[j] -= wI - wJ
        if (after < bestSpread - Number.EPSILON) {
          bestSpread = after
          bestI = i
          bestJ = j
        }
      }
    }
    if (bestI < 0) return
    const tmp = cols[bestI][cols[bestI].length - 1]
    const wI = weight(tmp)
    const wJ = weight(cols[bestJ][cols[bestJ].length - 1])
    cols[bestI][cols[bestI].length - 1] = cols[bestJ][cols[bestJ].length - 1]
    cols[bestJ][cols[bestJ].length - 1] = tmp
    heights[bestI] += wJ - wI
    heights[bestJ] += wI - wJ
  }
}

/** 瀑布流列的最大累计权重；用于变宽列求解 */
export function masonryColumnHeights<T>(
  columns: T[][],
  itemHeight: (item: T) => number,
): number[] {
  return columns.map((col) =>
    col.reduce((sum, item) => {
      const h = itemHeight(item)
      return sum + (Number.isFinite(h) && h > 0 ? h : 1)
    }, 0),
  )
}

/**
 * 变宽列求解：列高 = 列宽×S_j + (张数−1)×间隙（S_j 为该列高宽比总和）。
 * 取列宽 ∝ (H − (张数−1)·ρ) / S_j（ρ 为单个间隙占自由宽的无量纲比），
 * 可解出唯一的 H 使所有列渲染高度相等且铺满容器，底缘严格平齐。
 * gapRatio 缺省按 0 处理（退化为宽度 ∝ 1/S_j）。
 * 返回归一化 flex-grow（均值 ≈ 1）；输入为空或含非法值时回退等宽（全 1）。
 */
export function masonryColumnFlexGrow(
  columnHeights: number[],
  cardCounts?: number[],
  gapRatio = 0,
): number[] {
  const n = Array.isArray(columnHeights) ? columnHeights.length : 0
  if (n === 0 || !columnHeights.every((h) => Number.isFinite(h) && h > 0)) {
    return Array.from({ length: n }, () => 1)
  }
  const counts =
    Array.isArray(cardCounts) &&
    cardCounts.length === n &&
    cardCounts.every((c) => Number.isFinite(c) && c >= 1)
      ? cardCounts
      : Array.from({ length: n }, () => 1)
  const inv = columnHeights.map((h) => 1 / h)
  const invSum = inv.reduce((sum, v) => sum + v, 0)
  const rho = Number.isFinite(gapRatio) && gapRatio > 0 ? gapRatio : 0
  if (rho === 0) {
    return inv.map((v) => (v / invSum) * n)
  }
  // W_free 归一为 1：Σ宽 = 1 且各列等高 H ⇒ H = (1 + ρ·Σ((张数−1)/S_j)) / Σ(1/S_j)
  const corr = columnHeights.reduce((sum, s, j) => sum + (counts[j] - 1) / s, 0)
  const H = (1 + rho * corr) / invSum
  const x = columnHeights.map((s, j) => Math.max((H - rho * (counts[j] - 1)) / s, 1e-4))
  const xSum = x.reduce((sum, v) => sum + v, 0)
  return x.map((v) => (v / xSum) * n)
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
