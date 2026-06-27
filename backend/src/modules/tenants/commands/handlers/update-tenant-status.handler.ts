import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { TenantStatus } from '@prisma/client'
import { UpdateTenantStatusCommand } from '../update-tenant-status.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { ITenantRepository, TENANT_REPOSITORY } from '../../domain/tenant.repository.interface'

@CommandHandler(UpdateTenantStatusCommand)
export class UpdateTenantStatusHandler implements ICommandHandler<UpdateTenantStatusCommand> {
  private readonly logger = new Logger(UpdateTenantStatusHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  async execute(command: UpdateTenantStatusCommand): Promise<any> {
    await this.permissionChecker.check(command.user, 'Tenants', 'Update')

    const validStatuses = Object.values(TenantStatus)
    if (!validStatuses.includes(command.status as TenantStatus)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      )
    }

    const existing = await this.tenants.findById(command.id)
    if (!existing) throw new NotFoundException(`Tenant ${command.id} not found`)

    const tenant = await this.tenants.update(command.id, { status: command.status as TenantStatus })
    this.logger.log(`Tenant ${command.id} status updated to ${command.status}`)
    return tenant
  }
}
