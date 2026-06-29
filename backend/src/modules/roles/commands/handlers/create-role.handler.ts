import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY } from '../../domain/role.repository.interface';
import { EntityAlreadyExistsException } from '../../../../core/exceptions/domain.exception';
import { CreateRoleCommand } from '../create-role.command';

@Injectable()
@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
  ) {}

  async execute(command: CreateRoleCommand) {
    const { dto } = command;

    const existing = await this.roles.findByName(dto.name);

    if (existing) {
      throw new EntityAlreadyExistsException('Role', 'name', dto.name);
    }

    return this.roles.create({
      name: dto.name,
      description: dto.description ?? null,
      priority: dto.priority ?? 0,
    });
  }
}

