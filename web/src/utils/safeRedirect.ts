const AUTH_PREFIXES = ["/auth/login", "/auth/register", "/auth/github"]

/** 仅允许站内相对路径，拒绝协议相对 URL 与外链 */
export function isSafeInternalPath(path: unknown): path is string {
  if (typeof path !== "string" || !path.startsWith("/")) return false
  if (path.startsWith("//") || path.includes("\\")) return false
  return true
}

export function isAuthPath(path: string): boolean {
  const bare = path.split("?")[0]
  return AUTH_PREFIXES.some((prefix) => bare === prefix || bare.startsWith(`${prefix}/`))
}

/** 登录后回跳：优先 query.redirect，其次当前页；认证页一律回首页 */
export function resolvePostLoginRedirect(
  queryRedirect?: unknown,
  currentFullPath?: string,
): string {
  if (isSafeInternalPath(queryRedirect) && !isAuthPath(queryRedirect)) {
    return queryRedirect
  }
  if (currentFullPath && isSafeInternalPath(currentFullPath) && !isAuthPath(currentFullPath)) {
    return currentFullPath
  }
  return "/"
}

export function sanitizeStoredRedirect(raw: string | null | undefined): string {
  if (!raw || !isSafeInternalPath(raw) || isAuthPath(raw)) return "/"
  return raw
}
