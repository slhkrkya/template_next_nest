import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

// Extend Express Request to carry resolved tenantId
declare module 'express' {
  interface Request {
    tenantId?: string;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, _res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers['authorization'];

      if (!authHeader?.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.slice(7);

      // Decode without verifying - full verification happens in JwtAuthGuard
      const decoded = jwt.decode(token) as JwtPayload | null;

      if (!decoded) {
        return next();
      }

      // SuperAdmin may override tenant via header
      if (decoded.isSuperAdmin) {
        const overrideTenantId = req.headers['x-tenant-id'];
        if (overrideTenantId && typeof overrideTenantId === 'string') {
          req.tenantId = overrideTenantId;
          this.logger.debug(`SuperAdmin override tenant: ${overrideTenantId}`);
          return next();
        }
      }

      if (decoded.tenantId) {
        req.tenantId = decoded.tenantId;
      }
    } catch (err) {
      this.logger.warn('TenantMiddleware: failed to decode token', err);
    }

    next();
  }
}
