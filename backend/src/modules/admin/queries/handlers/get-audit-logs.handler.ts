import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetAuditLogsQuery } from '../get-audit-logs.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { AdminService } from '../../admin.service'

@QueryHandler(GetAuditLogsQuery)
export class GetAuditLogsHandler implements IQueryHandler<GetAuditLogsQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly adminService: AdminService,
  ) {}

  async execute(query: GetAuditLogsQuery) {
    await this.permissionChecker.check(query.user, 'AuditLogs', 'Read')
    return this.adminService.getAuditLogs(query.filters)
  }
}
