import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY } from '../../domain/role.repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { RemoveRoleFromUserCommand } from '../remove-role-from-user.command';

@Injectable()
@CommandHandler(RemoveRoleFromUserCommand)
export class RemoveRoleFromUserHandler
  implements ICommandHandler<RemoveRoleFromUserCommand>
{
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
  ) {}

  async execute(command: RemoveRoleFromUserCommand) {
    const { roleId, userId } = command;

    const role = await this.roles.findById(roleId);
    if (!role) {
      throw new EntityNotFoundException('Role', roleId);
    }

    await this.roles.removeFromUser(userId, roleId);

    return { message: 'Role removed from user successfully' };
  }
}

