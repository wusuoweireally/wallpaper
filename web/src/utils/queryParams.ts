/**
 * 列表 GET 查询序列化：数组用同名重复键（resolutions=a&resolutions=b），
 * 禁止 axios 默认的 resolutions[]= 形式（Nest forbidNonWhitelisted 会 400）。
 */
export function serializeQueryParams(params: Record<string, unknown> | undefined | null): string {
  const usp = new URLSearchParams()
  if (!params) return ""
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue
        usp.append(key, String(item))
      }
      continue
    }
    usp.append(key, String(value))
  }
  return usp.toString()
}
