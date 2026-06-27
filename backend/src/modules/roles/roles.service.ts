import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateRoleCommand } from './commands/create-role.command';
import { UpdateRoleCommand } from './commands/update-role.command';
import { DeleteRoleCommand } from './commands/delete-role.command';
import { AssignRoleToUserCommand } from './commands/assign-role-to-user.command';
import { RemoveRoleFromUserCommand } from './commands/remove-role-from-user.command';
import { GetAllRolesQuery } from './queries/get-all-roles.query';
import { GetRoleByIdQuery } from './queries/get-role-by-id.query';
import { GetUsersByRoleQuery } from './queries/get-users-by-role.query';

@Injectable()
export class RolesService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --- Query dispatchers (CQRS) ---

  async findAll() {
    return this.queryBus.execute(new GetAllRolesQuery());
  }

  async findById(id: string) {
    return this.queryBus.execute(new GetRoleByIdQuery(id));
  }

  async getUsersByRole(
    roleId: string,
    tenantId?: string,
    query?: { page?: number; limit?: number },
  ) {
    return this.queryBus.execute(
      new GetUsersByRoleQuery(roleId, tenantId, query?.page, query?.limit),
    );
  }

  // --- Command dispatchers (CQRS) ---

  async create(dto: CreateRoleDto) {
    return this.commandBus.execute(new CreateRoleCommand(dto));
  }

  async update(id: string, dto: UpdateRoleDto) {
    return this.commandBus.execute(new UpdateRoleCommand(id, dto));
  }

  async delete(id: string) {
    return this.commandBus.execute(new DeleteRoleCommand(id));
  }

  async assignToUser(roleId: string, userId: string, tenantId?: string) {
    return this.commandBus.execute(
      new AssignRoleToUserCommand(roleId, userId, tenantId),
    );
  }

  async removeFromUser(roleId: string, userId: string, tenantId?: string) {
    return this.commandBus.execute(
      new RemoveRoleFromUserCommand(roleId, userId, tenantId),
    );
  }
}
