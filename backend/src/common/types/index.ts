// ---------------------------------------------------------------------------

export interface JwtPayload {
  /** User ID (subject) */
  sub: string;
  email: string;
  role: string;
  tenantId?: string;
  isSuperAdmin: boolean;
  iat?: number;
  exp?: number;
}

// ---------------------------------------------------------------------------

/**
 * Shape attached to `req.user` after JWT strategy validation.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  tenantId?: string;
  isSuperAdmin: boolean;
}

// ---------------------------------------------------------------------------

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PagedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
}
