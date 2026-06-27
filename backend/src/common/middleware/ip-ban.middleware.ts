import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

interface CachedBan {
  ip: string;
  expiresAt: Date | null;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class IpBanMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IpBanMiddleware.name);

  private banCache: CachedBan[] = [];
  private lastRefreshed: number = 0;

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const clientIp = this.extractIp(req);

    if (!clientIp) {
      return next();
    }

    await this.refreshCacheIfStale();

    const now = new Date();
    const banned = this.banCache.find((ban) => {
      if (ban.ip !== clientIp) return false;
      // No expiry means permanent ban
      if (ban.expiresAt === null) return true;
      return ban.expiresAt > now;
    });

    if (banned) {
      this.logger.warn(`Blocked banned IP: ${clientIp}`);
      throw new ForbiddenException('Your IP address has been banned.');
    }

    next();
  }

  private extractIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return first.split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? null;
  }

  private async refreshCacheIfStale(): Promise<void> {
    const now = Date.now();
    if (now - this.lastRefreshed < CACHE_TTL_MS) {
      return;
    }

    try {
      const bans = await this.prisma.bannedIp.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        select: {
          ipAddress: true,
          expiresAt: true,
        },
      });

      this.banCache = bans.map((ban) => ({
        ip: ban.ipAddress,
        expiresAt: ban.expiresAt,
      }));

      this.lastRefreshed = now;
      this.logger.debug(`IP ban cache refreshed - ${this.banCache.length} active bans`);
    } catch (err) {
      this.logger.error('Failed to refresh IP ban cache', err);
    }
  }
}
