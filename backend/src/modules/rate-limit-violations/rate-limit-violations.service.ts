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

  async record(data: {
    ipAddress: string
    endpoint: string
    requestCount: number
    windowStart: Date
    tenantId?: string
  }): Promise<any> {
    return this.violations.create({
      ipAddress: data.ipAddress,
      endpoint: data.endpoint,
      requestCount: data.requestCount,
      windowStart: data.windowStart,
      tenantId: data.tenantId ?? null,
      isDismissed: false,
      dismissedBy: null,
    })
  }
}
