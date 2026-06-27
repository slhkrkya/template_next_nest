import { IQuery } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'
import { SystemLogFilters } from '../admin.service'

export class GetSystemLogsQuery implements IQuery {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly filters: SystemLogFilters,
  ) {}
}
