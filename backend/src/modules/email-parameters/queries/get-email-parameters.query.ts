import { IQuery } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class GetEmailParametersQuery implements IQuery {
  constructor(
    public readonly user: AuthenticatedUser,
  ) {}
}
