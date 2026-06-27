import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RemoveDataScopeCommand } from '../remove-data-scope.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { DataScopesService } from '../../data-scopes.service'

@CommandHandler(RemoveDataScopeCommand)
export class RemoveDataScopeHandler implements ICommandHandler<RemoveDataScopeCommand> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly dataScopesService: DataScopesService,
  ) {}

  async execute(command: RemoveDataScopeCommand): Promise<void> {
    await this.permissionChecker.check(command.user, 'DataScopes', 'Delete')
    await this.dataScopesService.removeDataScope(
      command.userId,
      command.entityName,
      command.user.tenantId,
    )
  }
}
