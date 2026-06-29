import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import { IRateLimitViolationRepository } from '../domain/rate-limit-violation.repository.interface'
import { RateLimitViolationEntity, RateLimitViolationProps } from '../domain/rate-limit-violation.entity'

@Injectable()
export class PrismaRateLimitViolationRepository implements IRateLimitViolationRepository {
  constructor(private readonly prismaService: PrismaService) {}
  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }
  private toEntity(r: any): RateLimitViolationEntity {
    return new RateLimitViolationEntity({ id: r.id, ipAddress: r.ipAddress, endpoint: r.endpoint, requestCount: r.requestCount, windowStart: r.windowStart, isDismissed: r.isDismissed, dismissedBy: r.dismissedBy ?? null, tenantId: r.tenantId ?? null, createdAt: r.createdAt })
  }
  async findAll(tenantId?: string): Promise<RateLimitViolationEntity[]> {
    const data = await this.prisma.rateLimitViolation.findMany({ where: tenantId ? { tenantId } : {}, orderBy: { createdAt: 'desc' } })
    return data.map(r => this.toEntity(r))
  }
  async create(data: Omit<RateLimitViolationProps, 'id' | 'createdAt'>): Promise<RateLimitViolationEntity> {
    const r = await this.prisma.rateLimitViolation.create({ data: { id: crypto.randomUUID(), ...data } })
    return this.toEntity(r)
  }
  async dismiss(id: string, dismissedBy: string): Promise<RateLimitViolationEntity> {
    const r = await this.prisma.rateLimitViolation.update({ where: { id }, data: { isDismissed: true, dismissedBy } })
    return this.toEntity(r)
  }
  async deleteMany(ids: string[]): Promise<void> { await this.prisma.rateLimitViolation.deleteMany({ where: { id: { in: ids } } }) }

  async findRecentViolation(
    ipAddress: string,
    endpoint: string,
    tenantId: string | null,
    windowMinutes: number,
  ): Promise<RateLimitViolationEntity | null> {
    const cutoffTime = new Date()
    cutoffTime.setMinutes(cutoffTime.getMinutes() - windowMinutes)

    const record = await this.prisma.rateLimitViolation.findFirst({
      where: {
        ipAddress,
        endpoint,
        tenantId: tenantId ?? null,
        isDismissed: false,
        createdAt: { gte: cutoffTime },
      },
      orderBy: { createdAt: 'desc' },
    })

    return record ? this.toEntity(record) : null
  }

  async incrementViolationCount(id: string): Promise<RateLimitViolationEntity> {
    const r = await this.prisma.rateLimitViolation.update({
      where: { id },
      data: {
        requestCount: { increment: 1 },
        windowStart: new Date(), // Update last violation time
      },
    })
    return this.toEntity(r)
  }
}
