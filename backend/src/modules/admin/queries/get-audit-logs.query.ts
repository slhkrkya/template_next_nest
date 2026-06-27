import { IQuery } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'
import { AuditLogFilters } from '../admin.service'

export class GetAuditLogsQuery implements IQuery {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly filters: AuditLogFilters,
  ) {}
}
