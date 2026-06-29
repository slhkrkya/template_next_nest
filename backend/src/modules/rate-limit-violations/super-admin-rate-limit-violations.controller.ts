import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { SuperAdminGuard } from '../../common/guards/superadmin.guard'
import { RateLimitViolationsService } from './rate-limit-violations.service'
import { PrismaService } from '../../prisma/prisma.service'
import { GetAllViolationsQueryDto } from './dto/get-all-violations-query.dto'

@ApiTags('super-admin/rate-limit-violations')
@ApiBearerAuth()
@UseGuards(SuperAdminGuard)
@Controller('super-admin/rate-limit-violations')
export class SuperAdminRateLimitViolationsController {
  constructor(
    private readonly violationsService: RateLimitViolationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all rate limit violations across all tenants (Super-Admin only)' })
  async findAll(@Query() query: GetAllViolationsQueryDto) {
    const { dismissed, endpoint, ipAddress, method, policy } = query
    const dismissedFilter = dismissed === 'true' ? true : dismissed === 'false' ? false : undefined

    // Get all violations (no tenant filter)
    const allViolations = await this.prisma.rateLimitViolation.findMany({
      where: {
        ...(dismissedFilter !== undefined && { isDismissed: dismissedFilter }),
        ...(endpoint && { endpoint: { contains: endpoint } }),
        ...(ipAddress && { ipAddress: { contains: ipAddress } }),
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get tenant names for violations that have tenantId
    const tenantIds = [...new Set(allViolations.map(v => v.tenantId).filter(Boolean))] as string[]
    const tenants = tenantIds.length > 0
      ? await this.prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, name: true },
        })
      : []
    const tenantMap = new Map(tenants.map(t => [t.id, t.name]))

    // Map to include tenant name
    const data = allViolations.map((v) => ({
      id: v.id,
      ipAddress: v.ipAddress,
      endpoint: v.endpoint,
      requestCount: v.requestCount,
      windowStart: v.windowStart,
      isDismissed: v.isDismissed,
      dismissedBy: v.dismissedBy,
      tenantId: v.tenantId,
      tenantName: v.tenantId ? tenantMap.get(v.tenantId) ?? null : null,
      createdAt: v.createdAt,
    }))

    return { data }
  }
}
