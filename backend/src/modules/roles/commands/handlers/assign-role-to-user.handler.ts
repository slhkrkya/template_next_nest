import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY } from '../../domain/role.repository.interface';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../../permissions/domain/permission.repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { AssignRoleToUserCommand } from '../assign-role-to-user.command';
import { PermissionsGateway } from '../../../websockets/permissions.gateway';

@Injectable()
@CommandHandler(AssignRoleToUserCommand)
export class AssignRoleToUserHandler
  implements ICommandHandler<AssignRoleToUserCommand>
{
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    private readonly permissionsGateway: PermissionsGateway,
  ) {}

  async execute(command: AssignRoleToUserCommand) {
    const { roleId, userId, tenantId } = command;

    const role = await this.roles.findById(roleId);
    if (!role) {
      throw new EntityNotFoundException('Role', roleId);
    }

    await this.roles.assignToUser(userId, roleId, tenantId);
    await this.permissions.syncRolePermissionsToUser(roleId, userId, tenantId);
    this.permissionsGateway.notifyPermissionsUpdated(userId);

    return { message: 'Role assigned successfully' };
  }
}

