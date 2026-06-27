import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetSystemLogsQuery } from '../get-system-logs.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { AdminService } from '../../admin.service'

@QueryHandler(GetSystemLogsQuery)
export class GetSystemLogsHandler implements IQueryHandler<GetSystemLogsQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly adminService: AdminService,
  ) {}

  async execute(query: GetSystemLogsQuery) {
    await this.permissionChecker.check(query.user, 'AuditLogs', 'Read')
    return this.adminService.getSystemLogs(query.filters)
  }
}
