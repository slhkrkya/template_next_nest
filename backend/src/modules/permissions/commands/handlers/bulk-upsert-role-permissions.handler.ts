import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { BulkUpsertRolePermissionsCommand } from '../bulk-upsert-role-permissions.command';
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work';

@Injectable()
@CommandHandler(BulkUpsertRolePermissionsCommand)
export class BulkUpsertRolePermissionsHandler
  implements ICommandHandler<BulkUpsertRolePermissionsCommand>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    private readonly permChecker: PermissionCheckerService,
  ) {}

  async execute(command: BulkUpsertRolePermissionsCommand): Promise<{ count: number }> {
    await this.permChecker.check(command.user, 'Permissions', 'Update');

    const { roleId, permissions } = command.dto;

    await this.uow.runInTransaction(async () => {
      await this.permissions.upsertManyRolePermissions(
        roleId,
        permissions.map(p => ({
          entityName: p.entityName,
          canCreate: p.canCreate ?? false,
          canRead: p.canRead ?? false,
          canUpdate: p.canUpdate ?? false,
          canDelete: p.canDelete ?? false,
        })),
      );
    });

    return { count: permissions.length };
  }
}
