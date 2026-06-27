import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

// ---------------------------------------------------------------------------

export const IS_PUBLIC_KEY = 'isPublic';
export const PERMISSION_KEY = 'requiredPermission';
export const AUDIT_LOG_KEY = 'auditLog';

// ---------------------------------------------------------------------------

/**
 * Mark a route as public - skips JWT authentication.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface RequiredPermission {
  entity: string;
  action: string;
}

/**
 * Require a specific entity-level permission.
 * SuperAdmin and users/roles with the matching EntityPermission record pass.
 */
export const RequirePermission = (entity: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { entity, action } satisfies RequiredPermission);

// ---------------------------------------------------------------------------

export interface AuditLogMeta {
  entityName: string;
  action: string;
}

/**
 * Attach audit log metadata to a route handler.
 * The AuditLogInterceptor reads this to create an audit log entry after the response.
 */
export const AuditLog = (entityName: string, action: string) =>
  SetMetadata(AUDIT_LOG_KEY, { entityName, action } satisfies AuditLogMeta);

// ---------------------------------------------------------------------------

/**
 * Extract the authenticated user object from the request.
 *
 * @example
 * async getProfile(@GetUser() user: AuthenticatedUser) {}
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

/**
 * Extract the tenant ID resolved by TenantMiddleware.
 *
 * @example
 * async list(@GetTenantId() tenantId: string) {}
 */
export const GetTenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId as string | undefined;
  },
);
