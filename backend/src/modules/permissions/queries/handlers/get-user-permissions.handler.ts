import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { GetUserPermissionsQuery } from '../get-user-permissions.query';
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service';

@Injectable()
@QueryHandler(GetUserPermissionsQuery)
export class GetUserPermissionsHandler
  implements IQueryHandler<GetUserPermissionsQuery>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    private readonly permChecker: PermissionCheckerService,
  ) {}

  async execute(query: GetUserPermissionsQuery) {
    await this.permChecker.check(query.requester, 'Permissions', 'Read');

    const userPerms = await this.permissions.findUserPermissions(
      query.userId,
      query.tenantId ?? undefined,
    );

    if (userPerms === null) {
      throw new NotFoundException(`User with id ${query.userId} not found`);
    }

    return userPerms;
  }
}
