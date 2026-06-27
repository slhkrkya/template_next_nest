import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetRateLimitViolationsQuery } from '../get-rate-limit-violations.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { RateLimitViolationsService } from '../../rate-limit-violations.service'
import { PagedResult } from '../../../../common/types'

@QueryHandler(GetRateLimitViolationsQuery)
export class GetRateLimitViolationsHandler implements IQueryHandler<GetRateLimitViolationsQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly rateLimitViolationsService: RateLimitViolationsService,
  ) {}

  async execute(query: GetRateLimitViolationsQuery): Promise<PagedResult<any>> {
    await this.permissionChecker.check(query.user, 'RateLimits', 'Read')
    return this.rateLimitViolationsService.findAll(query.pagination)
  }
}
