import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, Logger } from '@nestjs/common'
import { SwitchTenantCommand } from '../switch-tenant.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { ITenantRepository, TENANT_REPOSITORY } from '../../domain/tenant.repository.interface'

@CommandHandler(SwitchTenantCommand)
export class SwitchTenantHandler implements ICommandHandler<SwitchTenantCommand> {
  private readonly logger = new Logger(SwitchTenantHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  async execute(command: SwitchTenantCommand): Promise<any> {
    await this.permissionChecker.check(command.user, 'Tenants', 'Read')

    const tenant = await this.tenants.findById(command.tenantId)
    if (!tenant) throw new NotFoundException(`Tenant ${command.tenantId} not found`)

    this.logger.log(`SuperAdmin ${command.user.id} switched context to tenant ${command.tenantId}`)
    return { message: `Switched to tenant "${tenant.name}"`, tenant }
  }
}
