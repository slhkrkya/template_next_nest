import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, ConflictException, Logger } from '@nestjs/common'
import { TenantStatus } from '@prisma/client'
import { CreateTenantCommand } from '../create-tenant.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { ITenantRepository, TENANT_REPOSITORY } from '../../domain/tenant.repository.interface'

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  private readonly logger = new Logger(CreateTenantHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  async execute(command: CreateTenantCommand): Promise<any> {
    await this.permissionChecker.check(command.user, 'Tenants', 'Create')

    const existing = await this.tenants.findBySlug(command.dto.slug)
    if (existing) throw new ConflictException(`Slug "${command.dto.slug}" is already taken`)

    const tenant = await this.tenants.create({
      name: command.dto.name,
      slug: command.dto.slug,
      maxUsers: command.dto.maxUsers ?? 10,
      trialEndsAt: command.dto.trialEndsAt ? new Date(command.dto.trialEndsAt) : null,
      status: TenantStatus.ACTIVE,
      isActive: true,
      logoPath: null,
    })

    this.logger.log(`Tenant created: ${tenant.id} (${tenant.slug})`)
    return tenant
  }
}
