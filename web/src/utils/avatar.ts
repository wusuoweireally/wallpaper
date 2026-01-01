const HTTP_PROTOCOL = /^https?:\/\//i

// 默认头像路径
const DEFAULT_AVATAR = "/api/uploads/profile-pictures/defaultAvatar.png"

export const resolveAvatarUrl = (raw?: string | null): string => {
  // 如果没有头像，或者头像就是默认头像，返回默认头像
  if (!raw || raw === "defaultAvatar.png" || raw === "defaultAvatar.webp") {
    return DEFAULT_AVATAR
  }

  // 如果是完整的 HTTP(S) URL，直接返回
  if (HTTP_PROTOCOL.test(raw)) {
    return raw
  }

  // 否则拼接相对路径
  return `/api/uploads/profile-pictures/${raw}`
}
