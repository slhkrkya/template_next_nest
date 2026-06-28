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
 * Fetch application-level system logs (structured log lines from the backend).
 * Level filter accepts 'error' | 'warn' | 'info' | 'debug'.
 */
export async function getSystemLogs(
  params?: PaginationQuery & {
    level?: string
    from?: string
    to?: string
  },
): Promise<PagedResult<Record<string, unknown>>> {
  const response = await axiosInstance.get<PagedResult<Record<string, unknown>>>(
    '/admin/system-logs',
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
