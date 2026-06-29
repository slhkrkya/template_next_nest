import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { BulkDeleteUserPermissionsCommand } from '../bulk-delete-user-permissions.command';
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service';
import { PermissionsGateway } from '../../../websockets/permissions.gateway';

@Injectable()
@CommandHandler(BulkDeleteUserPermissionsCommand)
export class BulkDeleteUserPermissionsHandler
  implements ICommandHandler<BulkDeleteUserPermissionsCommand>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    private readonly permChecker: PermissionCheckerService,
    private readonly permissionsGateway: PermissionsGateway,
  ) {}

  async execute(command: BulkDeleteUserPermissionsCommand): Promise<{ count: number }> {
    await this.permChecker.check(command.user, 'Permissions', 'Delete');
    const result = await this.permissions.deleteUserPermissions(command.ids);
    // userId not available at this level — broadcast to all connected clients
    this.permissionsGateway.broadcastPermissionsUpdated();
    return result;
  }
}
