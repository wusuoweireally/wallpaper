/**
 * 敏感字段脱敏工具（保持简洁易懂）
 * 用于移除用户对象中的密码哈希等敏感信息
 */
export function sanitizeUser<T extends Record<string, unknown>>(
  user: T | null | undefined,
): Omit<T, "passwordHash" | "password_hash"> | null {
  if (!user) return null;

  // 兼容两种可能的字段名，删除敏感字段后返回
  const copy = { ...(user as Record<string, unknown>) };
  delete copy.passwordHash;
  delete copy.password_hash;
  return copy as Omit<T, "passwordHash" | "password_hash">;
}
