/** 数字展示：千分位。中文站点不用 w/k 缩写，统一千分位 */
export const formatNumber = (n: number): string => {
  if (!Number.isFinite(n)) return "0"
  return Math.round(n).toLocaleString("en-US")
}

/** 相对时间：刚刚 / N 分钟前 / N 小时前 / N 天前 / 日期 */
export const formatTime = (iso?: string): string => {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const diff = Date.now() - date.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "刚刚"
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return date.toLocaleDateString("zh-CN")
}

/** 文件大小：B / KB / MB / GB */
export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "0 B"
  const k = 1024
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1)
  const value = bytes / Math.pow(k, i)
  return `${value >= 10 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`
}
