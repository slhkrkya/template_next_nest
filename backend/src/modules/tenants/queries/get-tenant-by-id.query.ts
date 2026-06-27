import { IQuery } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class GetTenantByIdQuery implements IQuery {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly id: string,
  ) {}
}
