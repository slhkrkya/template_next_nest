import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { AuditLogFilters, SystemLogFilters } from './admin.service'
import { AuthenticatedUser } from '../../common/types'
import { RequirePermission } from '../../common/decorators'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import {
  GetDashboardStatsQuery,
  GetAuditLogsQuery,
  GetSystemLogsQuery,
  GetDailyLoginStatsQuery,
} from './queries'

@Controller('admin')
export class AdminController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('dashboard-stats')
  @RequirePermission('AuditLogs', 'read')
  getDashboardStats(@CurrentUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetDashboardStatsQuery(user))
  }

  @Get('audit-logs')
  @RequirePermission('AuditLogs', 'read')
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
      tenantId: this.getAdminTenantScope(user),
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
  @RequirePermission('SystemLogs', 'read')
  getSystemLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const filters: SystemLogFilters = {
      tenantId: this.getAdminTenantScope(user),
      level,
      source,
      dateFrom,
      dateTo,
      search,
      page,
      limit,
    }
    return this.queryBus.execute(new GetSystemLogsQuery(user, filters))
  }

  @Get('daily-login-stats')
  @RequirePermission('AuditLogs', 'read')
  getDailyLoginStats(@CurrentUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetDailyLoginStatsQuery(user))
  }

  private getAdminTenantScope(user: AuthenticatedUser): string | null | undefined {
    return user.tenantId ?? (user.isSuperAdmin ? undefined : null)
  }
}
