import { IQuery } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class GetUserDataScopesQuery implements IQuery {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly userId: string,
  ) {}
}
