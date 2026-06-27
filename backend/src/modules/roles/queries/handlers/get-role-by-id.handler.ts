import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY } from '../../domain/role.repository.interface';
import { GetRoleByIdQuery } from '../get-role-by-id.query';

@Injectable()
@QueryHandler(GetRoleByIdQuery)
export class GetRoleByIdHandler implements IQueryHandler<GetRoleByIdQuery> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
  ) {}

  async execute(query: GetRoleByIdQuery) {
    const role = await this.roles.findById(query.id);

    if (!role) {
      throw new NotFoundException(`Role with id ${query.id} not found`);
    }

    return role;
  }
}

