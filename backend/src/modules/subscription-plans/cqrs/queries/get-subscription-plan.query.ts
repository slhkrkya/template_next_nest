import { AuthenticatedUser } from '../../../../common/types'

export class GetSubscriptionPlanQuery {
  constructor(
    public readonly id: string,
    public readonly currentUser: AuthenticatedUser,
  ) {}
}
