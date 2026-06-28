// ---------------------------------------------------------------------------

export interface JwtPayload {
  /** User ID (subject) */
  sub: string;
  email: string;
  role: string;
  tenantId: string | null;
  isSuperAdmin: boolean;
  iat?: number;
  exp?: number;
}

// ---------------------------------------------------------------------------

/**
 * Shape attached to `req.user` after JWT strategy validation.
 * SuperAdmins have tenantId: null and bypass all permission/tenant checks.
 * All other users must have a non-null tenantId and are strictly tenant-scoped.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
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
