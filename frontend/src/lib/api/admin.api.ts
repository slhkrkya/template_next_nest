import axiosInstance from '@/lib/axios'
import type { AuditLog, DailyLoginStat, DashboardStats, PagedResult, PaginationQuery } from '@/types'

/**
 * Fetch aggregate statistics for the admin dashboard overview card.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await axiosInstance.get<DashboardStats>('/admin/dashboard-stats')
  return response.data
}

/**
 * Fetch a paginated list of audit log entries. Supports search, sort, and
 * date-range filtering via the params object.
 */
export async function getAuditLogs(
  params?: PaginationQuery & {
    userId?: string
    entityName?: string
    action?: string
    from?: string
    to?: string
  },
): Promise<PagedResult<AuditLog>> {
  const response = await axiosInstance.get<PagedResult<AuditLog>>(
    '/admin/audit-logs',
    { params },
  )
  return response.data
}

/**
 * Fetch system logs for admin users with enhanced filtering.
 * Supports level, source, date range, and search filtering.
 */
export async function getAdminSystemLogs(
  params?: {
    page?: number
    limit?: number
    level?: string
    source?: string
    dateFrom?: string
    dateTo?: string
    search?: string
  },
): Promise<{ data: Record<string, unknown>[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const response = await axiosInstance.get<{ data: Record<string, unknown>[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
    '/admin/system-logs',
    { params },
  )
  return response.data
}

/**
 * Fetch all rate limit violations across all tenants (Super-Admin only).
 * Returns violations with tenant information for cross-tenant visibility.
 */
export async function getAllRateLimitViolations(
  params?: {
    dismissed?: boolean
    endpoint?: string
    ipAddress?: string
    method?: string
    policy?: string
  },
): Promise<{ data: Record<string, unknown>[] }> {
  const response = await axiosInstance.get<{ data: Record<string, unknown>[] }>(
    '/super-admin/rate-limit-violations',
    { params },
  )
  return response.data
}

/**
 * Fetch the daily login counts for the last N days (default 30).
 * Used to render the sparkline / bar chart on the dashboard.
 */
export async function getDailyLoginStats(
  days?: number,
): Promise<DailyLoginStat[]> {
  const response = await axiosInstance.get<DailyLoginStat[]>(
    '/admin/daily-login-stats',
    { params: { days } },
  )
  return response.data
}
