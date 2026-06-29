import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { BulkUpsertUserPermissionsCommand } from '../bulk-upsert-user-permissions.command';
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work';

@Injectable()
@CommandHandler(BulkUpsertUserPermissionsCommand)
export class BulkUpsertUserPermissionsHandler
  implements ICommandHandler<BulkUpsertUserPermissionsCommand>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    private readonly permChecker: PermissionCheckerService,
  ) {}

  async execute(command: BulkUpsertUserPermissionsCommand): Promise<{ count: number }> {
    await this.permChecker.check(command.user, 'Permissions', 'Update');

    const { userId, tenantId, permissions } = command.dto;

    await this.uow.runInTransaction(async () => {
      await this.permissions.upsertManyUserPermissions(
        userId,
        tenantId ?? null,
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
