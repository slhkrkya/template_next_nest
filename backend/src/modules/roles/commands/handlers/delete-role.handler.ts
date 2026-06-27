import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY } from '../../domain/role.repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { DeleteRoleCommand } from '../delete-role.command';

@Injectable()
@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
  ) {}

  async execute(command: DeleteRoleCommand) {
    const { id } = command;

    const role = await this.roles.findById(id);
    if (!role) {
      throw new EntityNotFoundException('Role', id);
    }

    return this.roles.delete(id);
  }
}

