/** 前端静态默认头像路径（web/public/defaultAvatar.png 经 nginx 提供） */
export const DEFAULT_AVATAR = "/defaultAvatar.png";

/** 头像兜底：仅 COS 完整 URL 可用，空值/相对路径统一回退默认头像 */
export function resolveAvatarUrl(avatarUrl?: string | null): string {
  return avatarUrl?.startsWith("http") ? avatarUrl : DEFAULT_AVATAR;
}

/**
 * 默认头像的历史写法：实体列默认值不带前导斜杠，注册流程写的是 DEFAULT_AVATAR，
 * 另有早期 png/webp 两种扩展名。判"是否仍是默认头像"必须都认，
 * 否则 GitHub 登录回填头像这类覆盖判断会永远不成立。
 */
const DEFAULT_AVATAR_ALIASES = new Set([
  "defaultAvatar.png",
  "defaultAvatar.webp",
  DEFAULT_AVATAR,
]);

/** 是否仍是默认头像（空值不算，由调用方自行处理"未设置"语义） */
export const isDefaultAvatar = (avatarUrl?: string | null): boolean =>
  !!avatarUrl && DEFAULT_AVATAR_ALIASES.has(avatarUrl);
