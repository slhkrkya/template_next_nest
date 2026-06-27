import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { BulkDeleteUserPermissionsCommand } from '../bulk-delete-user-permissions.command';
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service';

@Injectable()
@CommandHandler(BulkDeleteUserPermissionsCommand)
export class BulkDeleteUserPermissionsHandler
  implements ICommandHandler<BulkDeleteUserPermissionsCommand>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    private readonly permChecker: PermissionCheckerService,
  ) {}

  async execute(command: BulkDeleteUserPermissionsCommand): Promise<{ count: number }> {
    await this.permChecker.check(command.user, 'Permissions', 'Delete');
    return this.permissions.deleteUserPermissions(command.ids);
  }
}
