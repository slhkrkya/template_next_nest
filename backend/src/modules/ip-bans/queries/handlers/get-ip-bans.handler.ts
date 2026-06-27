import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetIpBansQuery } from '../get-ip-bans.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { IpBansService } from '../../ip-bans.service'
import { PagedResult } from '../../../../common/types'

@QueryHandler(GetIpBansQuery)
export class GetIpBansHandler implements IQueryHandler<GetIpBansQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly ipBansService: IpBansService,
  ) {}

  async execute(query: GetIpBansQuery): Promise<PagedResult<any>> {
    await this.permissionChecker.check(query.user, 'IpBans', 'Read')
    return this.ipBansService.findAll(query.pagination)
  }
}
