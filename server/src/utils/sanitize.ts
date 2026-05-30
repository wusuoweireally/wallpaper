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
