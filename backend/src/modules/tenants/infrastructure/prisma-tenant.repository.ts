import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import { ITenantRepository, FindTenantsOptions, PaginatedTenants } from '../domain/tenant.repository.interface'
import { TenantEntity, TenantProps } from '../domain/tenant.entity'

@Injectable()
export class PrismaTenantRepository implements ITenantRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }

  private toEntity(raw: any): TenantEntity {
    return new TenantEntity({
      id: raw.id, name: raw.name, slug: raw.slug,
      logoPath: raw.logoPath ?? null, status: raw.status,
      trialEndsAt: raw.trialEndsAt ?? null, maxUsers: raw.maxUsers,
      isActive: raw.isActive, createdAt: raw.createdAt, updatedAt: raw.updatedAt,
    })
  }

  async findById(id: string): Promise<TenantEntity | null> {
    const raw = await this.prisma.tenant.findUnique({ where: { id } })
    return raw ? this.toEntity(raw) : null
  }

  async findBySlug(slug: string): Promise<TenantEntity | null> {
    const raw = await this.prisma.tenant.findUnique({ where: { slug } })
    return raw ? this.toEntity(raw) : null
  }

  async findMany(options: FindTenantsOptions): Promise<PaginatedTenants> {
    const { page = 1, pageSize = 20, search, status } = options
    const skip = (page - 1) * pageSize
    const where: any = {}
    if (status) where.status = status
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ]
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.tenant.count({ where }),
    ])
    return { data: data.map(r => this.toEntity(r)), total, page, pageSize }
  }

  async create(data: Omit<TenantProps, 'createdAt' | 'updatedAt'>): Promise<TenantEntity> {
    const raw = await this.prisma.tenant.create({ data: { ...data, status: data.status as any } })
    return this.toEntity(raw)
  }

  async update(id: string, data: any): Promise<TenantEntity> {
    const raw = await this.prisma.tenant.update({ where: { id }, data })
    return this.toEntity(raw)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tenant.delete({ where: { id } })
  }
}
