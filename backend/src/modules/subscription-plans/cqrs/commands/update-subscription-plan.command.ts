import { CreateSubscriptionPlanDto } from '../../dto/create-subscription-plan.dto'
import { AuthenticatedUser } from '../../../../common/types'

export class UpdateSubscriptionPlanCommand {
  constructor(
    public readonly id: string,
    public readonly dto: Partial<CreateSubscriptionPlanDto>,
    public readonly currentUser: AuthenticatedUser,
  ) {}
}
