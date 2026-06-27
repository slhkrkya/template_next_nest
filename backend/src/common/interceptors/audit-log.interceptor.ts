import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_LOG_KEY, AuditLogMeta } from '../decorators';
import { AuthenticatedUser } from '../types';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.getAllAndOverride<AuditLogMeta | undefined>(
      AUDIT_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!meta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    return next.handle().pipe(
      tap({
        next: async () => {
          try {
            await this.prisma.auditLog.create({
              data: {
                entityName: meta.entityName,
                action: meta.action as AuditAction,
                userId: user?.id ?? null,
                tenantId: (request.tenantId as string | undefined) ?? null,
                ipAddress: this.extractIp(request),
                userAgent: request.headers['user-agent'] ?? null,
                newValues: this.safeJson(request.body),
              },
            });
          } catch (err) {
            this.logger.error('Failed to write audit log entry', err);
          }
        },
        error: async () => {
          try {
            await this.prisma.auditLog.create({
              data: {
                entityName: meta.entityName,
                action: meta.action as AuditAction,
                userId: user?.id ?? null,
                tenantId: (request.tenantId as string | undefined) ?? null,
                ipAddress: this.extractIp(request),
                userAgent: request.headers['user-agent'] ?? null,
                newValues: this.safeJson(request.body),
              },
            });
          } catch (logErr) {
            this.logger.error('Failed to write audit log error entry', logErr);
          }
        },
      }),
    );
  }

  private extractIp(request: Record<string, unknown>): string | null {
    const forwarded = request.headers as Record<string, string | string[] | undefined>;
    const xForwardedFor = forwarded['x-forwarded-for'];
    if (xForwardedFor) {
      const first = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
      return first.split(',')[0].trim();
    }
    const connection = request.connection as { remoteAddress?: string } | undefined;
    return connection?.remoteAddress ?? null;
  }

  private safeJson(value: unknown): object | null {
    try {
      return value as object ?? null;
    } catch {
      return null;
    }
  }
}
