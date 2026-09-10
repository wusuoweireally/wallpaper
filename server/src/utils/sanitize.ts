/**
 * 敏感字段脱敏工具（保持简洁易懂）
 * 用于移除用户对象中的密码哈希等敏感信息
 */
export function sanitizeUser<T extends Record<string, unknown>>(
  user: T | null | undefined,
): Omit<
  T,
  | "passwordHash"
  | "password_hash"
  | "email"
  | "githubId"
  | "githubLogin"
  | "githubAvatarUrl"
  | "githubBio"
> | null {
  if (!user) return null;

  const copy = { ...(user as Record<string, unknown>) };
  delete copy.passwordHash;
  delete copy.password_hash;
  delete copy.email;
  delete copy.githubId;
  delete copy.githubLogin;
  delete copy.githubAvatarUrl;
  delete copy.githubBio;
  return copy as Omit<
    T,
    | "passwordHash"
    | "password_hash"
    | "email"
    | "githubId"
    | "githubLogin"
    | "githubAvatarUrl"
    | "githubBio"
  >;
}

/**
 * 本人 / 管理端可见的完整用户对象：只剥离密码哈希，保留 email 等私有字段。
 * 与 sanitizeUser 的分工——那个用于嵌套的作者/上传者等"对外"位置，
 * 这个用于"返回自己或管理员看的完整档案"。
 */
export function omitPasswordHash<T extends object>(
  user: T,
): Omit<T, "passwordHash"> {
  const copy = { ...(user as Record<string, unknown>) };
  delete copy.passwordHash;
  return copy as Omit<T, "passwordHash">;
}
