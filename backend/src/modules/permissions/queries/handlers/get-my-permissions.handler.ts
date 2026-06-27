import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { GetMyPermissionsQuery } from '../get-my-permissions.query';

@Injectable()
@QueryHandler(GetMyPermissionsQuery)
export class GetMyPermissionsHandler
  implements IQueryHandler<GetMyPermissionsQuery>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
  ) {}

  async execute(query: GetMyPermissionsQuery) {
    return this.permissions.getEffectivePermissions(query.userId, query.tenantId ?? undefined);
  }
}
