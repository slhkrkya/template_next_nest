import { IQuery } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class GetThumbnailQuery implements IQuery {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly filename: string,
  ) {}
}
