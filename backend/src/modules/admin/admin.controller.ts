import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { AuditLogFilters, SystemLogFilters } from './admin.service'
import { AuthenticatedUser } from '../../common/types'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SuperAdminGuard } from '../../common/guards/superadmin.guard'
import {
  GetDashboardStatsQuery,
  GetAuditLogsQuery,
  GetSystemLogsQuery,
  GetDailyLoginStatsQuery,
} from './queries'

@UseGuards(SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('dashboard-stats')
  getDashboardStats(@CurrentUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetDashboardStatsQuery(user))
  }

  @Get('audit-logs')
  getAuditLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('userId') userId?: string,
    @Query('entityName') entityName?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const filters: AuditLogFilters = {
      userId,
      entityName,
      action,
      dateFrom,
      dateTo,
      page,
      limit,
    }
    return this.queryBus.execute(new GetAuditLogsQuery(user, filters))
  }

  @Get('system-logs')
  getSystemLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const filters: SystemLogFilters = {
      level,
      source,
      dateFrom,
      dateTo,
      page,
      limit,
    }
    return this.queryBus.execute(new GetSystemLogsQuery(user, filters))
  }

  @Get('daily-login-stats')
  getDailyLoginStats(@CurrentUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetDailyLoginStatsQuery(user))
  }
}
