const HTTP_PROTOCOL = /^https?:\/\//i

// 默认头像（web/public/ 静态资源，vite/nginx 直接服务）
const DEFAULT_AVATAR = "/defaultAvatar.png"

export const resolveAvatarUrl = (raw?: string | null): string => {
  // 没有头像或旧式默认值 → 默认头像
  if (!raw || raw === "defaultAvatar.png" || raw === "defaultAvatar.webp") {
    return DEFAULT_AVATAR
  }

  // 完整 HTTP(S) URL（COS）或绝对路径直接返回，其余相对文件名兜底
  if (HTTP_PROTOCOL.test(raw) || raw.startsWith("/")) {
    return raw
  }

  return raw
}

/**
 * 头像加载失败兜底：回退默认头像且只回退一次。
 * 默认头像本身 404 或坏地址反复触发 error 时避免无限循环。
 */
export const handleAvatarError = (event: Event): void => {
  const img = event.target as HTMLImageElement | null
  if (!img || img.dataset.avatarFallback === "1") return
  img.dataset.avatarFallback = "1"
  img.src = DEFAULT_AVATAR
}
