/** 前端静态默认头像路径（web/public/defaultAvatar.png 经 nginx 提供） */
export const DEFAULT_AVATAR = "/defaultAvatar.png";

/** 头像兜底：仅 COS 完整 URL 可用，空值/相对路径统一回退默认头像 */
export function resolveAvatarUrl(avatarUrl?: string | null): string {
  return avatarUrl?.startsWith("http") ? avatarUrl : DEFAULT_AVATAR;
}
