import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY } from '../../domain/role.repository.interface';
import { EntityNotFoundException, EntityAlreadyExistsException } from '../../../../core/exceptions/domain.exception';
import { UpdateRoleCommand } from '../update-role.command';

@Injectable()
@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
  ) {}

  async execute(command: UpdateRoleCommand) {
    const { id, dto } = command;

    const role = await this.roles.findById(id);
    if (!role) {
      throw new EntityNotFoundException('Role', id);
    }

    if (dto.name) {
      const existing = await this.roles.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new EntityAlreadyExistsException('Role', 'name', dto.name);
      }
    }

    return this.roles.update(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
    });
  }
}

