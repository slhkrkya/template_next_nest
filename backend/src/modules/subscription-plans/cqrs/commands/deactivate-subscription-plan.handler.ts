import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { DeactivateSubscriptionPlanCommand } from './deactivate-subscription-plan.command'
import { SubscriptionPlansService } from '../../subscription-plans.service'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'

@CommandHandler(DeactivateSubscriptionPlanCommand)
export class DeactivateSubscriptionPlanHandler
  implements ICommandHandler<DeactivateSubscriptionPlanCommand>
{
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly permissionChecker: PermissionCheckerService,
  ) {}

  async execute(command: DeactivateSubscriptionPlanCommand): Promise<any> {
    await this.permissionChecker.check(command.currentUser, 'SubscriptionPlans', 'Delete')
    return this.subscriptionPlansService.deactivate(command.id)
  }
}
