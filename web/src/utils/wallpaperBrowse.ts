/**
 * 壁纸浏览：筛选模型 / URL / 列表 API / 场景标题
 * 纯函数，便于单测与列表页共用
 */

export type BrowseSortBy = "latest" | "popular" | "toplist" | "random" | "views" | "favorites"

export type SortOrder = "ASC" | "DESC"

/** 分辨率模式：至少 / 精确 / 自定义 */
export type ResolutionMode = "atLeast" | "exact" | "custom"

export interface BrowseFilters {
  sortBy: BrowseSortBy
  sortOrder: SortOrder
  category: string
  subCategory: string
  /** 至少档位：4k / 1080p … */
  resolution: string
  /** 精确 1920x1080 */
  exactResolution: string
  resolutionMode: ResolutionMode
  /** 自定义至少宽高 */
  customWidth: string
  customHeight: string
  ratio: string
  orientation: string
  format: string
  topRange: string
  color: string
  tags: string
  /** 关键词搜索（按标签名模糊匹配） */
  search: string
}

export interface SceneHero {
  title: string
  subtitle: string
  kind: "latest" | "hot" | "toplist" | "random" | "views" | "favorites"
}

export const RESOLUTION_TIERS: Record<string, { minW: number; minH: number; label: string }> = {
  "5k": { minW: 4800, minH: 2700, label: "5K+" },
  "4k": { minW: 3000, minH: 1600, label: "4K" },
  "2k": { minW: 2200, minH: 1200, label: "2K" },
  "1080p": { minW: 1600, minH: 900, label: "1080p" },
  "720p": { minW: 1000, minH: 600, label: "720p" },
  "4k-portrait": { minW: 1600, minH: 3000, label: "4K 竖屏" },
  "2k-portrait": { minW: 1200, minH: 2200, label: "2K 竖屏" },
  "1080p-portrait": { minW: 900, minH: 1600, label: "1080p 竖屏" },
}

/** 精确分辨率分栏（对齐 wallhaven 操作，预设精简版） */
export const EXACT_RESOLUTION_GROUPS: Array<{
  label: string
  items: string[]
}> = [
  {
    label: "超宽",
    items: ["2560x1080", "3440x1440", "3840x1600"],
  },
  {
    label: "16:9",
    items: ["1280x720", "1600x900", "1920x1080", "2560x1440", "3840x2160"],
  },
  {
    label: "16:10",
    items: ["1280x800", "1600x1000", "1920x1200", "2560x1600", "3840x2400"],
  },
  {
    label: "4:3",
    items: ["1280x960", "1600x1200", "1920x1440", "2560x1920"],
  },
  {
    label: "5:4",
    items: ["1280x1024", "1600x1280", "1920x1536", "2560x2048"],
  },
  {
    label: "竖屏",
    items: ["1080x1920", "1440x2560", "1080x2400"],
  },
]

export const RATIO_GROUPS: Array<{
  label: string
  items: Array<{ value: string; label: string }>
}> = [
  {
    label: "宽屏",
    items: [
      { value: "landscape", label: "全部横屏" },
      { value: "16:9", label: "16:9" },
      { value: "16:10", label: "16:10" },
    ],
  },
  {
    label: "超宽",
    items: [
      { value: "21:9", label: "21:9" },
      { value: "32:9", label: "32:9" },
    ],
  },
  {
    label: "竖屏",
    items: [
      { value: "portrait", label: "全部竖屏" },
      { value: "9:16", label: "9:16" },
      { value: "10:16", label: "10:16" },
      { value: "9:18", label: "9:18" },
    ],
  },
  {
    label: "方形等",
    items: [
      { value: "1:1", label: "1:1" },
      { value: "3:2", label: "3:2" },
      { value: "4:3", label: "4:3" },
      { value: "5:4", label: "5:4" },
    ],
  },
]

export const COLOR_CHIPS: Array<{ value: string; label: string; swatch: string }> = [
  { value: "red", label: "红", swatch: "#ef4444" },
  { value: "orange", label: "橙", swatch: "#f97316" },
  { value: "yellow", label: "黄", swatch: "#eab308" },
  { value: "green", label: "绿", swatch: "#22c55e" },
  { value: "cyan", label: "青", swatch: "#06b6d4" },
  { value: "blue", label: "蓝", swatch: "#3b82f6" },
  { value: "purple", label: "紫", swatch: "#a855f7" },
  { value: "pink", label: "粉", swatch: "#ec4899" },
  { value: "black", label: "黑", swatch: "#0f172a" },
  { value: "gray", label: "灰", swatch: "#94a3b8" },
  { value: "white", label: "白", swatch: "#f8fafc" },
]

export const SORT_OPTIONS: Array<{ value: BrowseSortBy; label: string }> = [
  { value: "latest", label: "最新上传" },
  { value: "popular", label: "热门" },
  { value: "toplist", label: "排行榜" },
  { value: "views", label: "浏览最多" },
  { value: "favorites", label: "收藏最多" },
  { value: "random", label: "随机推荐" },
]

export const TOP_RANGES = [
  { value: "1d", label: "近 1 天" },
  { value: "3d", label: "近 3 天" },
  { value: "1w", label: "近 1 周" },
  { value: "1M", label: "近 1 月" },
  { value: "3M", label: "近 3 月" },
  { value: "6M", label: "近 6 月" },
  { value: "1y", label: "近 1 年" },
]

export const CATEGORIES = [
  { value: "", label: "全部" },
  { value: "general", label: "综合" },
  { value: "anime", label: "动漫" },
  { value: "people", label: "真人" },
]

const SORT_VALUES: BrowseSortBy[] = ["latest", "popular", "toplist", "random", "views", "favorites"]

export function defaultBrowseFilters(): BrowseFilters {
  return {
    sortBy: "latest",
    sortOrder: "DESC",
    category: "",
    subCategory: "",
    resolution: "",
    exactResolution: "",
    resolutionMode: "atLeast",
    customWidth: "",
    customHeight: "",
    ratio: "",
    orientation: "",
    format: "",
    topRange: "1M",
    color: "",
    tags: "",
    search: "",
  }
}

/** 从 route.query 恢复筛选（兼容 hot → popular） */
export function filtersFromRouteQuery(query: Record<string, unknown>): BrowseFilters {
  const next = defaultBrowseFilters()
  const sortRaw = String(query.sort || "")
  const sort = sortRaw === "hot" ? "popular" : sortRaw
  if (SORT_VALUES.includes(sort as BrowseSortBy)) {
    next.sortBy = sort as BrowseSortBy
  }
  if (query.order === "ASC" || query.order === "DESC") {
    next.sortOrder = query.order
  }
  if (typeof query.category === "string") next.category = query.category
  if (typeof query.subCategory === "string") next.subCategory = query.subCategory
  if (typeof query.resolution === "string") next.resolution = query.resolution
  if (typeof query.exact === "string") {
    next.exactResolution = query.exact
    next.resolutionMode = "exact"
  }
  if (typeof query.cw === "string" || typeof query.ch === "string") {
    next.customWidth = typeof query.cw === "string" ? query.cw : ""
    next.customHeight = typeof query.ch === "string" ? query.ch : ""
    if (next.customWidth || next.customHeight) next.resolutionMode = "custom"
  }
  if (typeof query.ratio === "string") {
    // landscape/portrait 写在 ratio 位，内部拆到 orientation
    if (query.ratio === "landscape" || query.ratio === "portrait") {
      next.orientation = query.ratio
      next.ratio = ""
    } else {
      next.ratio = query.ratio
    }
  }
  if (typeof query.orientation === "string") next.orientation = query.orientation
  if (typeof query.format === "string") next.format = query.format
  if (typeof query.topRange === "string") next.topRange = query.topRange
  if (typeof query.color === "string") next.color = query.color
  if (typeof query.tags === "string") next.tags = query.tags
  if (typeof query.search === "string") next.search = query.search
  if (typeof query.resMode === "string") {
    if (query.resMode === "exact" || query.resMode === "custom" || query.resMode === "atLeast") {
      next.resolutionMode = query.resMode
    }
  }
  return next
}

/** 筛选 → 可分享 URL query（默认值不写） */
export function filtersToRouteQuery(f: BrowseFilters): Record<string, string> {
  const query: Record<string, string> = {}
  if (f.sortBy && f.sortBy !== "latest") query.sort = f.sortBy
  if (f.sortOrder && f.sortOrder !== "DESC") query.order = f.sortOrder
  if (f.category) query.category = f.category
  if (f.subCategory) query.subCategory = f.subCategory
  if (f.resolutionMode === "exact" && f.exactResolution) {
    query.exact = f.exactResolution
    query.resMode = "exact"
  } else if (f.resolutionMode === "custom" && (f.customWidth || f.customHeight)) {
    if (f.customWidth) query.cw = f.customWidth
    if (f.customHeight) query.ch = f.customHeight
    query.resMode = "custom"
  } else if (f.resolution) {
    query.resolution = f.resolution
  }
  if (f.ratio) query.ratio = f.ratio
  else if (f.orientation === "landscape" || f.orientation === "portrait") {
    query.ratio = f.orientation
  }
  if (f.orientation && f.orientation !== "landscape" && f.orientation !== "portrait") {
    query.orientation = f.orientation
  }
  if (f.format) query.format = f.format
  if (f.sortBy === "toplist" && f.topRange) query.topRange = f.topRange
  if (f.color) query.color = f.color
  if (f.tags.trim()) query.tags = f.tags.trim()
  if (f.search.trim()) query.search = f.search.trim()
  return query
}

export interface ApiListQuery {
  page: number
  limit: number
  sortBy: string
  sortOrder: SortOrder
  category?: "general" | "anime" | "people"
  subCategory?: string
  format?: string
  aspectRatio?: number
  orientation?: string
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  topRange?: string
  color?: string
  resolutions?: string[]
  tags?: string[]
  /** 随机排序种子：翻页传同一 seed，后端 RAND(seed) 顺序稳定不重复 */
  seed?: number
  /** 关键词（后端按标签名模糊匹配） */
  search?: string
}

/** 前端 sort 语义 → 后端 sortBy */
export function mapSortToApi(sortBy: BrowseSortBy): { sortBy: string; forceDesc?: boolean } {
  switch (sortBy) {
    case "latest":
      return { sortBy: "createdAt" }
    case "popular":
      return { sortBy: "popular", forceDesc: true }
    case "toplist":
      return { sortBy: "toplist", forceDesc: true }
    case "random":
      return { sortBy: "random", forceDesc: true }
    case "views":
      return { sortBy: "viewCount" }
    case "favorites":
      return { sortBy: "favoriteCount" }
    default:
      return { sortBy: "createdAt" }
  }
}

export function buildApiListQuery(
  f: BrowseFilters,
  page: number,
  limit: number,
  seed?: number,
): ApiListQuery {
  const mapped = mapSortToApi(f.sortBy)
  let minWidth: number | undefined
  let minHeight: number | undefined
  let resolutions: string[] | undefined

  if (f.resolutionMode === "exact" && f.exactResolution) {
    resolutions = [f.exactResolution]
  } else if (f.resolutionMode === "custom") {
    const w = Number(f.customWidth)
    const h = Number(f.customHeight)
    if (Number.isFinite(w) && w > 0) minWidth = Math.floor(w)
    if (Number.isFinite(h) && h > 0) minHeight = Math.floor(h)
  } else if (f.resolution) {
    const tier = RESOLUTION_TIERS[f.resolution]
    if (tier) {
      minWidth = tier.minW
      minHeight = tier.minH
    }
  }

  let aspectRatio: number | undefined
  const orientation = f.orientation || undefined
  if (f.ratio && f.ratio.includes(":")) {
    const [width, height] = f.ratio.split(":").map(Number)
    if (width && height) aspectRatio = width / height
  }

  const tags = f.tags
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)

  return {
    page,
    limit,
    sortBy: mapped.sortBy,
    sortOrder: mapped.forceDesc ? "DESC" : f.sortOrder,
    category: f.category ? (f.category as "general" | "anime" | "people") : undefined,
    subCategory: f.subCategory || undefined,
    format: f.format || undefined,
    aspectRatio,
    orientation,
    minWidth,
    minHeight,
    topRange: f.sortBy === "toplist" ? f.topRange || "1M" : undefined,
    color: f.color || undefined,
    resolutions,
    tags: tags.length ? tags : undefined,
    seed: f.sortBy === "random" && seed !== undefined ? seed : undefined,
    search: f.search.trim() || undefined,
  }
}

/** 场景 Hero：按排序场景展示结果叙事 */
export function sceneHeroFromFilters(f: Pick<BrowseFilters, "sortBy" | "topRange">): SceneHero {
  switch (f.sortBy) {
    case "popular":
      return {
        kind: "hot",
        title: "热门壁纸",
        subtitle: "当前最受欢迎的壁纸",
      }
    case "toplist": {
      const range = TOP_RANGES.find((r) => r.value === f.topRange)?.label || "近 1 月"
      return {
        kind: "toplist",
        title: "排行榜",
        subtitle: `${range} 高分作品`,
      }
    }
    case "random":
      return {
        kind: "random",
        title: "随机发现",
        subtitle: "每次刷新都有新惊喜",
      }
    case "views":
      return {
        kind: "views",
        title: "浏览最多",
        subtitle: "按浏览量排序",
      }
    case "favorites":
      return {
        kind: "favorites",
        title: "收藏最多",
        subtitle: "按收藏量排序",
      }
    case "latest":
    default:
      return {
        kind: "latest",
        title: "最新壁纸",
        subtitle: "社区最新上传的壁纸",
      }
  }
}

export function hasActiveBrowseFilters(f: BrowseFilters): boolean {
  return !!(
    f.category ||
    f.subCategory ||
    f.resolution ||
    f.exactResolution ||
    f.customWidth ||
    f.customHeight ||
    f.ratio ||
    f.orientation ||
    f.format ||
    f.color ||
    f.tags ||
    f.search ||
    f.sortBy !== "latest" ||
    f.sortOrder !== "DESC"
  )
}

export function getSortLabel(sortBy: BrowseSortBy): string {
  return SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "最新上传"
}
