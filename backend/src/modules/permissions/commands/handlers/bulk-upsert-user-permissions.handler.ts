import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { BulkUpsertUserPermissionsCommand } from '../bulk-upsert-user-permissions.command';
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work';
import { PermissionsGateway } from '../../../websockets/permissions.gateway';

@Injectable()
@CommandHandler(BulkUpsertUserPermissionsCommand)
export class BulkUpsertUserPermissionsHandler
  implements ICommandHandler<BulkUpsertUserPermissionsCommand>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    private readonly permChecker: PermissionCheckerService,
    private readonly permissionsGateway: PermissionsGateway,
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

    this.permissionsGateway.notifyPermissionsUpdated(userId);
    return { count: permissions.length };
  }
}
