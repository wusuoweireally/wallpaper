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
