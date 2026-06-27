import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetSubscriptionPlansQuery } from './get-subscription-plans.query'
import { SubscriptionPlansService } from '../../subscription-plans.service'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { PagedResult } from '../../../../common/types'

@QueryHandler(GetSubscriptionPlansQuery)
export class GetSubscriptionPlansHandler
  implements IQueryHandler<GetSubscriptionPlansQuery>
{
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly permissionChecker: PermissionCheckerService,
  ) {}

  async execute(query: GetSubscriptionPlansQuery): Promise<PagedResult<any>> {
    await this.permissionChecker.check(query.currentUser, 'SubscriptionPlans', 'Read')
    return this.subscriptionPlansService.findAll(query.query)
  }
}
