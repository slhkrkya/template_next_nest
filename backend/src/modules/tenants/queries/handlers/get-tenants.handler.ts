import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetTenantsQuery } from '../get-tenants.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { ITenantRepository, TENANT_REPOSITORY } from '../../domain/tenant.repository.interface'
import { PagedResult } from '../../../../common/types'

@QueryHandler(GetTenantsQuery)
export class GetTenantsHandler implements IQueryHandler<GetTenantsQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  async execute(query: GetTenantsQuery): Promise<PagedResult<any>> {
    await this.permissionChecker.check(query.user, 'Tenants', 'Read')

    const page = query.pagination.page ?? 1
    const pageSize = query.pagination.pageSize ?? 10

    const result = await this.tenants.findMany({
      page,
      pageSize,
      search: query.pagination.search,
    })

    return {
      data: result.data,
      totalCount: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: Math.ceil(result.total / result.pageSize),
    }
  }
}
