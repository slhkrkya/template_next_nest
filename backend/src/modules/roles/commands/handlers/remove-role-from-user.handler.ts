import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY } from '../../domain/role.repository.interface';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../../permissions/domain/permission.repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { RemoveRoleFromUserCommand } from '../remove-role-from-user.command';

@Injectable()
@CommandHandler(RemoveRoleFromUserCommand)
export class RemoveRoleFromUserHandler
  implements ICommandHandler<RemoveRoleFromUserCommand>
{
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
  ) {}

  async execute(command: RemoveRoleFromUserCommand) {
    const { roleId, userId, tenantId } = command;

    const role = await this.roles.findById(roleId);
    if (!role) {
      throw new EntityNotFoundException('Role', roleId);
    }

    await this.roles.removeFromUser(userId, roleId, tenantId);
    await this.permissions.clearRolePermissionsFromUser(roleId, userId, tenantId);

    return { message: 'Role removed from user successfully' };
  }
}

