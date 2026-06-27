import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetDailyLoginStatsQuery } from '../get-daily-login-stats.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { AdminService, DailyLoginStat } from '../../admin.service'

@QueryHandler(GetDailyLoginStatsQuery)
export class GetDailyLoginStatsHandler implements IQueryHandler<GetDailyLoginStatsQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly adminService: AdminService,
  ) {}

  async execute(query: GetDailyLoginStatsQuery): Promise<DailyLoginStat[]> {
    await this.permissionChecker.check(query.user, 'AuditLogs', 'Read')
    return this.adminService.getDailyLoginStats()
  }
}
