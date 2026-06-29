import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthenticatedUser } from '../../common/types'
import { GetUser, RequirePermission } from '../../common/decorators'
import { AdminService, AuditLogFilters, SystemLogFilters } from './admin.service'

@ApiTags('tenant-logs')
@ApiBearerAuth()
@Controller('tenant-logs')
export class TenantLogsController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('audit-logs')
  @RequirePermission('AuditLogs', 'read')
  @ApiOperation({ summary: 'Get audit logs for current tenant' })
  async getAuditLogs(
    @GetUser() user: AuthenticatedUser,
    @Query('entityName') entityName?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const filters: AuditLogFilters = {
      tenantId: user.tenantId ?? undefined,
      entityName,
      action,
      dateFrom,
      dateTo,
      page,
      limit,
    }
    return this.adminService.getAuditLogs(filters)
  }

  @Get('system-logs')
  @RequirePermission('SystemLogs', 'read')
  @ApiOperation({ summary: 'Get system logs for current tenant' })
  async getSystemLogs(
    @GetUser() user: AuthenticatedUser,
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const filters: SystemLogFilters = {
      tenantId: user.tenantId ?? undefined,
      level,
      source,
      dateFrom,
      dateTo,
      page,
      limit,
    }
    return this.adminService.getSystemLogs(filters)
  }
}
