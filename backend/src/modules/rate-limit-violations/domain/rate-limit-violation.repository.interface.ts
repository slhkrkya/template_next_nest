import { RateLimitViolationEntity, RateLimitViolationProps } from './rate-limit-violation.entity'
export const RATE_LIMIT_VIOLATION_REPOSITORY = Symbol('IRateLimitViolationRepository')
export interface IRateLimitViolationRepository {
  findAll(tenantId?: string): Promise<RateLimitViolationEntity[]>
  create(data: Omit<RateLimitViolationProps, 'id' | 'createdAt'>): Promise<RateLimitViolationEntity>
  dismiss(id: string, dismissedBy: string): Promise<RateLimitViolationEntity>
  deleteMany(ids: string[]): Promise<void>
}
