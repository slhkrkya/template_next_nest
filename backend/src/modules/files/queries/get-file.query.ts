import { IQuery } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class GetFileQuery implements IQuery {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly filename: string,
  ) {}
}
