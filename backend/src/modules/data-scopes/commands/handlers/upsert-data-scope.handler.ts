import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpsertDataScopeCommand } from '../upsert-data-scope.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { DataScopesService } from '../../data-scopes.service'

@CommandHandler(UpsertDataScopeCommand)
export class UpsertDataScopeHandler implements ICommandHandler<UpsertDataScopeCommand> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly dataScopesService: DataScopesService,
  ) {}

  async execute(command: UpsertDataScopeCommand): Promise<any> {
    await this.permissionChecker.check(command.user, 'DataScopes', 'Update')
    return this.dataScopesService.upsertDataScope(command.dto)
  }
}
