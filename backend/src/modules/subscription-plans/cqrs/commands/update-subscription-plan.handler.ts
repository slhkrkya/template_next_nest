import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateSubscriptionPlanCommand } from './update-subscription-plan.command'
import { SubscriptionPlansService } from '../../subscription-plans.service'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'

@CommandHandler(UpdateSubscriptionPlanCommand)
export class UpdateSubscriptionPlanHandler
  implements ICommandHandler<UpdateSubscriptionPlanCommand>
{
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly permissionChecker: PermissionCheckerService,
  ) {}

  async execute(command: UpdateSubscriptionPlanCommand): Promise<any> {
    await this.permissionChecker.check(command.currentUser, 'SubscriptionPlans', 'Update')
    return this.subscriptionPlansService.update(command.id, command.dto)
  }
}
