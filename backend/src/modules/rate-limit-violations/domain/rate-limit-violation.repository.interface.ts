import { RateLimitViolationEntity, RateLimitViolationProps } from './rate-limit-violation.entity'
export const RATE_LIMIT_VIOLATION_REPOSITORY = Symbol('IRateLimitViolationRepository')
export interface IRateLimitViolationRepository {
  findAll(tenantId?: string): Promise<RateLimitViolationEntity[]>
  create(data: Omit<RateLimitViolationProps, 'id' | 'createdAt'>): Promise<RateLimitViolationEntity>
  dismiss(id: string, dismissedBy: string): Promise<RateLimitViolationEntity>
  deleteMany(ids: string[]): Promise<void>
  /**
   * Find a recent violation within the aggregation window for the same IP and endpoint.
   * Used for violation aggregation (incrementing count instead of creating new record).
   */
  findRecentViolation(
    ipAddress: string,
    endpoint: string,
    tenantId: string | null,
    windowMinutes: number,
  ): Promise<RateLimitViolationEntity | null>
  /**
   * Increment the request count for an existing violation.
   */
  incrementViolationCount(id: string): Promise<RateLimitViolationEntity>
}
