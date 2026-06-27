import { CreateSubscriptionPlanDto } from '../../dto/create-subscription-plan.dto'
import { AuthenticatedUser } from '../../../../common/types'

export class CreateSubscriptionPlanCommand {
  constructor(
    public readonly dto: CreateSubscriptionPlanDto,
    public readonly currentUser: AuthenticatedUser,
  ) {}
}
