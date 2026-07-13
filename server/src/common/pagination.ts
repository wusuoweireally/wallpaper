export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const normalizePagination = (
  page: number = 1,
  limit: number = 20,
  maxLimit: number = 100,
): { page: number; limit: number } => {
  const numericPage = Number(page);
  const numericLimit = Number(limit);
  return {
    page: Number.isFinite(numericPage)
      ? Math.max(1, Math.trunc(numericPage))
      : 1,
    limit: Number.isFinite(numericLimit)
      ? Math.min(maxLimit, Math.max(1, Math.trunc(numericLimit)))
      : 20,
  };
};

export const normalizeLimit = (
  limit: number,
  fallback: number,
  maxLimit: number = 100,
): number =>
  normalizePagination(
    1,
    Number.isFinite(Number(limit)) ? limit : fallback,
    maxLimit,
  ).limit;

export const buildPaginationMeta = (
  result: PaginatedResult<unknown>,
): PaginationMeta => {
  const pages = Math.max(1, Math.ceil(result.total / result.limit));

  return {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages,
  };
};
