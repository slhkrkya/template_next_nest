import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY } from '../../domain/role.repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { AssignRoleToUserCommand } from '../assign-role-to-user.command';

@Injectable()
@CommandHandler(AssignRoleToUserCommand)
export class AssignRoleToUserHandler
  implements ICommandHandler<AssignRoleToUserCommand>
{
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
  ) {}

  async execute(command: AssignRoleToUserCommand) {
    const { roleId, userId } = command;

    const role = await this.roles.findById(roleId);
    if (!role) {
      throw new EntityNotFoundException('Role', roleId);
    }

    return this.roles.assignToUser(userId, roleId);
  }
}

