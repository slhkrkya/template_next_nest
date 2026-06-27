import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateSubscriptionPlanCommand } from './create-subscription-plan.command'
import { SubscriptionPlansService } from '../../subscription-plans.service'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'

@CommandHandler(CreateSubscriptionPlanCommand)
export class CreateSubscriptionPlanHandler
  implements ICommandHandler<CreateSubscriptionPlanCommand>
{
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly permissionChecker: PermissionCheckerService,
  ) {}

  async execute(command: CreateSubscriptionPlanCommand): Promise<any> {
    await this.permissionChecker.check(command.currentUser, 'SubscriptionPlans', 'Create')
    return this.subscriptionPlansService.create(command.dto)
  }
}
