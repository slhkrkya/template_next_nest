import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException } from '@nestjs/common'
import { GetTenantByIdQuery } from '../get-tenant-by-id.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { ITenantRepository, TENANT_REPOSITORY } from '../../domain/tenant.repository.interface'

@QueryHandler(GetTenantByIdQuery)
export class GetTenantByIdHandler implements IQueryHandler<GetTenantByIdQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  async execute(query: GetTenantByIdQuery): Promise<any> {
    await this.permissionChecker.check(query.user, 'Tenants', 'Read')

    const tenant = await this.tenants.findById(query.id)
    if (!tenant) throw new NotFoundException(`Tenant ${query.id} not found`)
    return tenant
  }
}
