import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common'
import { IRateLimitViolationRepository, RATE_LIMIT_VIOLATION_REPOSITORY } from './domain/rate-limit-violation.repository.interface'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { paginationHelper } from '../../common/utils/pagination.util'
import { PagedResult } from '../../common/types'

/**
 * Aggregation window in minutes.
 * Violations within this window for the same IP+Endpoint are aggregated (count incremented).
 */
const AGGREGATION_WINDOW_MINUTES = 5

@Injectable()
export class RateLimitViolationsService {
  private readonly logger = new Logger(RateLimitViolationsService.name)

  constructor(
    @Inject(RATE_LIMIT_VIOLATION_REPOSITORY) private readonly violations: IRateLimitViolationRepository,
  ) {}

  async findAll(query: PaginationDto, dismissed?: boolean): Promise<PagedResult<any>> {
    const { buildResult } = paginationHelper(query, 'createdAt')

    const all = await this.violations.findAll()
    const data = dismissed !== undefined ? all.filter((v: any) => v.isDismissed === dismissed) : all
    return buildResult(data, data.length)
  }

  async dismiss(id: string): Promise<any> {
    const updated = await this.violations.dismiss(id, 'system')
    if (!updated) throw new NotFoundException(`RateLimitViolation ${id} not found`)

    this.logger.log(`Rate limit violation ${id} dismissed`)
    return updated
  }

  async bulkDismiss(ids: string[]): Promise<{ count: number }> {
    await this.violations.deleteMany(ids)
    this.logger.log(`Bulk dismissed ${ids.length} rate limit violations`)
    return { count: ids.length }
  }

  async clearOld(daysOld = 30): Promise<{ count: number }> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysOld)

    const all = await this.violations.findAll()
    const old = all.filter((v: any) => new Date(v.createdAt) < cutoff)
    await this.violations.deleteMany(old.map((v: any) => v.id))

    this.logger.log(`Cleared ${old.length} old rate limit violations (older than ${daysOld} days)`)
    return { count: old.length }
  }

  /**
   * Record a rate limit violation with aggregation.
   * If a violation for the same IP+Endpoint exists within the aggregation window,
   * increment its count instead of creating a new record.
   */
  async record(data: {
    ipAddress: string
    endpoint: string
    requestCount?: number
    windowStart?: Date
    tenantId?: string
    httpMethod?: string
    policy?: string
    userId?: string
    userAgent?: string
  }): Promise<any> {
    const tenantId = data.tenantId ?? null

    // Check for existing recent violation within aggregation window
    const existingViolation = await this.violations.findRecentViolation(
      data.ipAddress,
      data.endpoint,
      tenantId,
      AGGREGATION_WINDOW_MINUTES,
    )

    if (existingViolation) {
      // Increment count for existing violation
      const updated = await this.violations.incrementViolationCount(existingViolation.id)
      this.logger.debug(
        `Incremented violation count for IP ${data.ipAddress} on ${data.endpoint} (count: ${updated.requestCount})`,
      )
      return updated
    }

    // Create new violation record
    const violation = await this.violations.create({
      ipAddress: data.ipAddress,
      endpoint: data.endpoint,
      requestCount: data.requestCount ?? 1,
      windowStart: data.windowStart ?? new Date(),
      tenantId,
      isDismissed: false,
      dismissedBy: null,
    })

    this.logger.log(
      `New rate limit violation recorded: IP ${data.ipAddress} on ${data.endpoint} (tenant: ${tenantId ?? 'global'})`,
    )
    return violation
  }
}
