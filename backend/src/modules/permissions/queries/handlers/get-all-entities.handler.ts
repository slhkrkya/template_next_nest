import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../domain/permission.repository.interface';
import { GetAllEntitiesQuery } from '../get-all-entities.query';
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service';

@Injectable()
@QueryHandler(GetAllEntitiesQuery)
export class GetAllEntitiesHandler
  implements IQueryHandler<GetAllEntitiesQuery>
{
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
    private readonly permChecker: PermissionCheckerService,
  ) {}

  async execute(query: GetAllEntitiesQuery) {
    await this.permChecker.check(query.requester, 'Permissions', 'Read');
    return this.permissions.findAllEntities();
  }
}
