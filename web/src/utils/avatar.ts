const HTTP_PROTOCOL = /^https?:\/\//i

// 默认头像路径（与服务端 main.ts 的 /uploads/ 静态文件挂载一致）
const DEFAULT_AVATAR = "/uploads/profile-pictures/defaultAvatar.png"

export const resolveAvatarUrl = (raw?: string | null): string => {
  // 如果没有头像，或者头像就是默认头像，返回默认头像
  if (!raw || raw === "defaultAvatar.png" || raw === "defaultAvatar.webp") {
    return DEFAULT_AVATAR
  }

  // 如果是完整的 HTTP(S) URL，直接返回
  if (HTTP_PROTOCOL.test(raw)) {
    return raw
  }

  // 如果已有 /uploads/ 前缀，直接返回（避免双前缀拼接）
  if (raw.startsWith("/uploads/")) {
    return raw
  }

  // 否则拼接相对路径
  return `/uploads/profile-pictures/${raw}`
}
