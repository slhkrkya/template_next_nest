import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { GetRolePermissionsQuery } from '../get-role-permissions.query';
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service';

@Injectable()
@QueryHandler(GetRolePermissionsQuery)
export class GetRolePermissionsHandler
  implements IQueryHandler<GetRolePermissionsQuery>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    private readonly permChecker: PermissionCheckerService,
  ) {}

  async execute(query: GetRolePermissionsQuery) {
    await this.permChecker.check(query.requester, 'Permissions', 'Read');

    const rolePerms = await this.permissions.findRolePermissions(query.roleId);

    if (rolePerms === null) {
      throw new NotFoundException(`Role with id ${query.roleId} not found`);
    }

    return rolePerms;
  }
}
