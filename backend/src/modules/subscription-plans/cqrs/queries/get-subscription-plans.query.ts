import { PaginationDto } from '../../../../common/dto/pagination.dto'
import { AuthenticatedUser } from '../../../../common/types'

export class GetSubscriptionPlansQuery {
  constructor(
    public readonly query: PaginationDto,
    public readonly currentUser: AuthenticatedUser,
  ) {}
}
