import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, ConflictException, Logger } from '@nestjs/common'
import { TenantStatus } from '@prisma/client'
import { UpdateTenantCommand } from '../update-tenant.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { ITenantRepository, TENANT_REPOSITORY } from '../../domain/tenant.repository.interface'

@CommandHandler(UpdateTenantCommand)
export class UpdateTenantHandler implements ICommandHandler<UpdateTenantCommand> {
  private readonly logger = new Logger(UpdateTenantHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  async execute(command: UpdateTenantCommand): Promise<any> {
    await this.permissionChecker.check(command.user, 'Tenants', 'Update')

    const existing = await this.tenants.findById(command.id)
    if (!existing) throw new NotFoundException(`Tenant ${command.id} not found`)

    const { dto } = command
    if (dto.slug) {
      const conflict = await this.tenants.findBySlug(dto.slug)
      if (conflict && conflict.id !== command.id) {
        throw new ConflictException(`Slug "${dto.slug}" is already taken`)
      }
    }

    const tenant = await this.tenants.update(command.id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.slug && { slug: dto.slug }),
      ...(dto.maxUsers !== undefined && { maxUsers: dto.maxUsers }),
      ...(dto.trialEndsAt !== undefined && {
        trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
      }),
      ...(dto.status && { status: dto.status as TenantStatus }),
    })

    this.logger.log(`Tenant updated: ${tenant.id}`)
    return tenant
  }
}
