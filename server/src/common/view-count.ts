/**
 * 详情接口的浏览量展示口径：本次请求真正计数时，返回值 = 行内快照 + 1。
 * 计数走的是原生 SQL 自增，拿不到自增后的值，只能按快照推算；
 * 壁纸与帖子两个详情接口共用，避免两处口径漂移。
 */
export function displayedViewCount(raw: unknown, counted: boolean): number {
  const current = Number(raw);
  const base =
    Number.isFinite(current) && current >= 0 ? Math.trunc(current) : 0;
  return counted ? base + 1 : base;
}
