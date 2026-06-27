import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetDashboardStatsQuery } from '../get-dashboard-stats.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { AdminService, DashboardStats } from '../../admin.service'

@QueryHandler(GetDashboardStatsQuery)
export class GetDashboardStatsHandler implements IQueryHandler<GetDashboardStatsQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly adminService: AdminService,
  ) {}

  async execute(query: GetDashboardStatsQuery): Promise<DashboardStats> {
    await this.permissionChecker.check(query.user, 'AuditLogs', 'Read')
    return this.adminService.getDashboardStats()
  }
}
