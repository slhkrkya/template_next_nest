import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetSubscriptionPlanQuery } from './get-subscription-plan.query'
import { SubscriptionPlansService } from '../../subscription-plans.service'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'

@QueryHandler(GetSubscriptionPlanQuery)
export class GetSubscriptionPlanHandler
  implements IQueryHandler<GetSubscriptionPlanQuery>
{
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly permissionChecker: PermissionCheckerService,
  ) {}

  async execute(query: GetSubscriptionPlanQuery): Promise<any> {
    await this.permissionChecker.check(query.currentUser, 'SubscriptionPlans', 'Read')
    return this.subscriptionPlansService.findOne(query.id)
  }
}
