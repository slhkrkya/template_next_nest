import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTenants: number;
  recentSignups: number;
}

export interface AuditLogFilters {
  userId?: string;
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
  dateFrom?: string;
  dateTo?: string;
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

  async getDashboardStats(): Promise<DashboardStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalUsers, activeUsers, totalTenants, recentSignups] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            lastLoginAt: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.tenant.count(),
        this.prisma.user.count({
          where: {
            createdAt: { gte: sevenDaysAgo },
          },
        }),
      ]);

    return { totalUsers, activeUsers, totalTenants, recentSignups };
  }

  async getAuditLogs(filters: AuditLogFilters) {
    const {
      userId,
      entityName,
      action,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filters;

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (entityName) where.entityName = entityName;
    if (action) where.action = action;

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
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filters;

    const where: Record<string, unknown> = {};

    if (level) where.level = level;
    if (source) where.source = source;

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.createdAt = createdAt;
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

  async getDailyLoginStats(): Promise<DailyLoginStat[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const rawStats = await this.prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT
        DATE("createdAt") AS date,
        COUNT(*)::int AS count
      FROM "AuditLog"
      WHERE
        action = 'LOGIN'
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
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
