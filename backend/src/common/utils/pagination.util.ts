import { PaginationQuery, PagedResult } from '../types';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

interface PaginationParams {
  skip: number;
  take: number;
  orderBy: Record<string, 'asc' | 'desc'>;
}

/**
 * Convert a PaginationQuery into Prisma-compatible skip/take/orderBy values.
 *
 * @example
 * const { skip, take, orderBy } = getPaginationParams(query);
 * const [data, totalCount] = await Promise.all([
 *   prisma.user.findMany({ skip, take, orderBy }),
 *   prisma.user.count(),
 * ]);
 */
export function getPaginationParams(
  query: PaginationQuery,
  defaultSortBy = 'createdAt',
): PaginationParams {
  const page = Math.max(1, query.page ?? DEFAULT_PAGE);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
  );

  const sortBy = query.sortBy ?? defaultSortBy;
  const sortOrder: 'asc' | 'desc' = query.sortOrder ?? 'desc';

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { [sortBy]: sortOrder },
  };
}

/**
 * Wrap a data array and total count into a PagedResult.
 *
 * @example
 * return createPagedResult(users, totalCount, page, pageSize);
 */
export function createPagedResult<T>(
  data: T[],
  totalCount: number,
  page: number,
  pageSize: number,
): PagedResult<T> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  return {
    data,
    totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(totalCount / safePageSize),
  };
}

/**
 * Convenience: derive page/pageSize from a PaginationQuery and build both
 * the params and the final result in one call.
 *
 * @example
 * const { params, buildResult } = paginationHelper(query);
 * const [data, totalCount] = await Promise.all([...]);
 * return buildResult(data, totalCount);
 */
export function paginationHelper(query: PaginationQuery, defaultSortBy = 'createdAt') {
  const page = Math.max(1, query.page ?? DEFAULT_PAGE);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
  );

  const params = getPaginationParams({ ...query, page, pageSize }, defaultSortBy);

  return {
    params,
    buildResult: <T>(data: T[], totalCount: number): PagedResult<T> =>
      createPagedResult(data, totalCount, page, pageSize),
  };
}
