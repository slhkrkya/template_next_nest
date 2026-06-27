import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, Logger } from '@nestjs/common'
import { DeleteTenantCommand } from '../delete-tenant.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { ITenantRepository, TENANT_REPOSITORY } from '../../domain/tenant.repository.interface'

@CommandHandler(DeleteTenantCommand)
export class DeleteTenantHandler implements ICommandHandler<DeleteTenantCommand> {
  private readonly logger = new Logger(DeleteTenantHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  async execute(command: DeleteTenantCommand): Promise<void> {
    await this.permissionChecker.check(command.user, 'Tenants', 'Delete')

    const existing = await this.tenants.findById(command.id)
    if (!existing) throw new NotFoundException(`Tenant ${command.id} not found`)

    await this.tenants.delete(command.id)
    this.logger.log(`Tenant soft-deleted: ${command.id}`)
  }
}
