import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { SyncRolePermissionsToUserCommand } from '../sync-role-permissions-to-user.command';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work';

@Injectable()
@CommandHandler(SyncRolePermissionsToUserCommand)
export class SyncRolePermissionsToUserHandler
  implements ICommandHandler<SyncRolePermissionsToUserCommand>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: SyncRolePermissionsToUserCommand): Promise<void> {
    const { userId, roleId, tenantId } = command;
    await this.uow.runInTransaction(async () => {
      await this.permissions.syncRolePermissionsToUser(roleId, userId, tenantId);
    });
  }
}
