import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { BulkDeleteRolePermissionsCommand } from '../bulk-delete-role-permissions.command';
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service';
import { PermissionsGateway } from '../../../websockets/permissions.gateway';

@Injectable()
@CommandHandler(BulkDeleteRolePermissionsCommand)
export class BulkDeleteRolePermissionsHandler
  implements ICommandHandler<BulkDeleteRolePermissionsCommand>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    private readonly permChecker: PermissionCheckerService,
    private readonly permissionsGateway: PermissionsGateway,
  ) {}

  async execute(command: BulkDeleteRolePermissionsCommand): Promise<{ count: number }> {
    await this.permChecker.check(command.user, 'Permissions', 'Delete');
    const result = await this.permissions.deleteRolePermissions(command.ids);
    this.permissionsGateway.broadcastPermissionsUpdated();
    return result;
  }
}
