import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { UpsertRolePermissionCommand } from '../upsert-role-permission.command';
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work';
import { PermissionsGateway } from '../../../websockets/permissions.gateway';

@Injectable()
@CommandHandler(UpsertRolePermissionCommand)
export class UpsertRolePermissionHandler
  implements ICommandHandler<UpsertRolePermissionCommand>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    private readonly permChecker: PermissionCheckerService,
    private readonly permissionsGateway: PermissionsGateway,
  ) {}

  async execute(command: UpsertRolePermissionCommand) {
    await this.permChecker.check(command.user, 'Permissions', 'Update');

    const { roleId, entityName, canCreate, canRead, canUpdate, canDelete } =
      command.dto;

    const result = await this.uow.runInTransaction(async () => {
      const entity = await this.permissions.findEntityByName(entityName);
      if (!entity) {
        throw new EntityNotFoundException('PermissionEntity', entityName);
      }

      return this.permissions.upsertRolePermission({
        operationClaimId: roleId,
        entityName,
        canCreate: canCreate ?? false,
        canRead: canRead ?? false,
        canUpdate: canUpdate ?? false,
        canDelete: canDelete ?? false,
      });
    });

    // Role change affects all users with this role — broadcast to all connected clients
    this.permissionsGateway.broadcastPermissionsUpdated();
    return result;
  }
}
