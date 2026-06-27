import { AuthenticatedUser } from '../../../../common/types'

export class DeactivateSubscriptionPlanCommand {
  constructor(
    public readonly id: string,
    public readonly currentUser: AuthenticatedUser,
  ) {}
}
