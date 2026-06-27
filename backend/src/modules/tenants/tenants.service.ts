import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { TenantStatus } from '@prisma/client'
import { ITenantRepository, TENANT_REPOSITORY } from './domain/tenant.repository.interface'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { PagedResult } from '../../common/types'

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name)

  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  async findAll(query: PaginationDto): Promise<PagedResult<any>> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10

    const result = await this.tenants.findMany({
      page,
      pageSize,
      search: query.search,
    })

    return {
      data: result.data,
      totalCount: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: Math.ceil(result.total / result.pageSize),
    }
  }

  async findOne(id: string): Promise<any> {
    const tenant = await this.tenants.findById(id)
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`)
    return tenant
  }

  async create(dto: CreateTenantDto): Promise<any> {
    const existing = await this.tenants.findBySlug(dto.slug)
    if (existing) throw new ConflictException(`Slug "${dto.slug}" is already taken`)

    const tenant = await this.tenants.create({
      name: dto.name,
      slug: dto.slug,
      maxUsers: dto.maxUsers ?? 10,
      trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
      status: TenantStatus.ACTIVE,
      isActive: true,
      logoPath: null,
    })

    this.logger.log(`Tenant created: ${tenant.id} (${tenant.slug})`)
    return tenant
  }

  async update(id: string, dto: UpdateTenantDto): Promise<any> {
    await this.findOne(id)

    if (dto.slug) {
      const conflict = await this.tenants.findBySlug(dto.slug)
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Slug "${dto.slug}" is already taken`)
      }
    }

    const tenant = await this.tenants.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.slug && { slug: dto.slug }),
      ...(dto.maxUsers !== undefined && { maxUsers: dto.maxUsers }),
      ...(dto.trialEndsAt !== undefined && { trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null }),
      ...(dto.status && { status: dto.status as TenantStatus }),
    })

    this.logger.log(`Tenant updated: ${tenant.id}`)
    return tenant
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.tenants.delete(id)
    this.logger.log(`Tenant soft-deleted: ${id}`)
  }

  async updateStatus(id: string, status: string): Promise<any> {
    const validStatuses = Object.values(TenantStatus)
    if (!validStatuses.includes(status as TenantStatus)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }
    await this.findOne(id)
    const tenant = await this.tenants.update(id, { status: status as TenantStatus })
    this.logger.log(`Tenant ${id} status updated to ${status}`)
    return tenant
  }

  async switchContext(superAdminUserId: string, tenantId: string): Promise<any> {
    const tenant = await this.findOne(tenantId)
    // In a real implementation you'd store the context in the session/JWT or cache
    this.logger.log(`SuperAdmin ${superAdminUserId} switched context to tenant ${tenantId}`)
    return { message: `Switched to tenant "${tenant.name}"`, tenant }
  }
}
