import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTenants: number;
  recentSignups: number;
}

export interface AuditLogFilters {
  userId?: string;
  tenantId?: string | null;
  entityName?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface SystemLogFilters {
  level?: string;
  source?: string;
  tenantId?: string | null;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DailyLoginStat {
  date: string;
  count: number;
}

// Admin service: read-only aggregation - direct Prisma is intentional for complex joins
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(
    filters: { tenantId?: string | null } = {},
  ): Promise<DashboardStats> {
    const { tenantId } = filters;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // SuperAdmin users are excluded from all counts (ghost users)
    const excludeSuperAdmin = { isSuperAdmin: false };
    const tenantFilter = tenantId !== undefined ? { tenantId } : {};
    const userWhere = { ...excludeSuperAdmin, ...tenantFilter };
    const totalTenantsPromise =
      tenantId === undefined
        ? this.prisma.tenant.count()
        : tenantId === null
          ? Promise.resolve(0)
          : this.prisma.tenant.count({ where: { id: tenantId } });

    const [totalUsers, activeUsers, totalTenants, recentSignups] =
      await Promise.all([
        this.prisma.user.count({ where: userWhere }),
        this.prisma.user.count({
          where: {
            ...userWhere,
            lastLoginAt: { gte: thirtyDaysAgo },
          },
        }),
        totalTenantsPromise,
        this.prisma.user.count({
          where: {
            ...userWhere,
            createdAt: { gte: sevenDaysAgo },
          },
        }),
      ]);

    return { totalUsers, activeUsers, totalTenants, recentSignups };
  }

  async getAuditLogs(filters: AuditLogFilters) {
    const {
      userId,
      tenantId,
      entityName,
      action,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filters;

    const where: Record<string, unknown> = {};

    // Frontend may send action as { label, value } object — extract the string value
    const actionValue = action && typeof action === 'object' ? (action as any).value : action;

    if (userId) where.userId = userId;
    if (tenantId !== undefined) where.tenantId = tenantId;
    if (entityName) where.entityName = entityName;
    if (actionValue) where.action = actionValue;

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.createdAt = createdAt;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSystemLogs(filters: SystemLogFilters) {
    const {
      level,
      source,
      tenantId,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const where: Record<string, unknown> = {};

    if (level) where.level = level;
    if (source) where.source = { contains: source, mode: 'insensitive' };
    if (tenantId !== undefined) where.tenantId = tenantId;

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.createdAt = createdAt;
    }

    // Search in message field
    if (search) {
      where.message = { contains: search, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDailyLoginStats(
    filters: { tenantId?: string | null } = {},
  ): Promise<DailyLoginStat[]> {
    const { tenantId } = filters;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const tenantFilter =
      tenantId === undefined
        ? Prisma.empty
        : tenantId === null
          ? Prisma.sql`AND al."tenantId" IS NULL`
          : Prisma.sql`AND al."tenantId" = ${tenantId}`;

    // Exclude SuperAdmin logins from daily stats (ghost users)
    const rawStats = await this.prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT
        DATE(al."createdAt") AS date,
        COUNT(*)::int AS count
      FROM "audit_logs" al
      WHERE
        al.action = 'LOGIN'
        AND al."createdAt" >= ${thirtyDaysAgo}
        ${tenantFilter}
        AND al."userId" NOT IN (
          SELECT id FROM "users" WHERE "isSuperAdmin" = true
        )
      GROUP BY DATE(al."createdAt")
      ORDER BY date ASC
    `;

    // Build a map of existing dates
    const statsMap = new Map<string, number>(
      rawStats.map((row) => [
        row.date.toISOString().split('T')[0],
        Number(row.count),
      ]),
    );

    // Fill in all 30 days, defaulting to 0
    const result: DailyLoginStat[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, count: statsMap.get(key) ?? 0 });
    }

    return result;
  }
}
