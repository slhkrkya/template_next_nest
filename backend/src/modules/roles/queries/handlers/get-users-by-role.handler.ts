import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY } from '../../domain/role.repository.interface';
import { GetUsersByRoleQuery } from '../get-users-by-role.query';

@Injectable()
@QueryHandler(GetUsersByRoleQuery)
export class GetUsersByRoleHandler
  implements IQueryHandler<GetUsersByRoleQuery>
{
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
  ) {}

  async execute(query: GetUsersByRoleQuery) {
    const { roleId } = query;

    const role = await this.roles.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    // Delegation to repository - user listing by role is handled via repository
    // The IRoleRepository does not expose getUsersByRole directly; return role for now
    // If the repository is extended, update this handler accordingly
    return role;
  }
}

