import { IQuery } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'
import { PaginationDto } from '../../../common/dto/pagination.dto'

export class GetRateLimitViolationsQuery implements IQuery {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly pagination: PaginationDto,
    public readonly dismissed?: boolean,
  ) {}
}
