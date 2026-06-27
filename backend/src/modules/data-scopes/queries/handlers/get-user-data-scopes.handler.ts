import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetUserDataScopesQuery } from '../get-user-data-scopes.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { DataScopesService } from '../../data-scopes.service'

@QueryHandler(GetUserDataScopesQuery)
export class GetUserDataScopesHandler implements IQueryHandler<GetUserDataScopesQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly dataScopesService: DataScopesService,
  ) {}

  async execute(query: GetUserDataScopesQuery): Promise<any> {
    await this.permissionChecker.check(query.user, 'DataScopes', 'Read')
    return this.dataScopesService.getUserDataScopes(query.userId, query.user.tenantId)
  }
}
