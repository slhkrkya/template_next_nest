import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { UpsertUserPermissionCommand } from '../upsert-user-permission.command';
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work';
import { PermissionsGateway } from '../../../websockets/permissions.gateway';

@Injectable()
@CommandHandler(UpsertUserPermissionCommand)
export class UpsertUserPermissionHandler
  implements ICommandHandler<UpsertUserPermissionCommand>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    private readonly permChecker: PermissionCheckerService,
    private readonly permissionsGateway: PermissionsGateway,
  ) {}

  async execute(command: UpsertUserPermissionCommand) {
    await this.permChecker.check(command.user, 'Permissions', 'Update');

    const { userId, tenantId, entityName, canCreate, canRead, canUpdate, canDelete } =
      command.dto;

    const result = await this.uow.runInTransaction(async () => {
      const entity = await this.permissions.findEntityByName(entityName);
      if (!entity) {
        throw new EntityNotFoundException('PermissionEntity', entityName);
      }

      return this.permissions.upsertUserPermission({
        userId,
        tenantId: tenantId ?? null,
        entityName,
        canCreate: canCreate ?? false,
        canRead: canRead ?? false,
        canUpdate: canUpdate ?? false,
        canDelete: canDelete ?? false,
      });
    });

    this.permissionsGateway.notifyPermissionsUpdated(userId);
    return result;
  }
}
