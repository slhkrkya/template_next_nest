import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSION_KEY, RequiredPermission } from '../decorators';
import { AuthenticatedUser } from '../types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SuperAdmin is above all roles — bypasses every permission check.
    if (user.isSuperAdmin) {
      return true;
    }

    const { entity, action } = requiredPermission;
    const actionField = `can${action.charAt(0).toUpperCase()}${action.slice(1).toLowerCase()}`;

    if (!['canCreate', 'canRead', 'canUpdate', 'canDelete'].includes(actionField)) {
      throw new ForbiddenException(`Unsupported permission action '${action}'`);
    }

    // Non-SuperAdmin users are strictly tenant-scoped.
    // We look only at the user's own tenant (or null for tenant-less accounts).
    // There is no global fallback — a permission must be explicitly assigned
    // within the user's tenant context.
    const effectiveTenantId = user.tenantId;

    const userPermission = await this.prisma.userEntityPermission.findFirst({
      where: {
        userId: user.id,
        entityName: entity,
        OR: [
          { tenantId: effectiveTenantId },
          { tenantId: null },
        ],
      },
      orderBy: { tenantId: 'desc' },
    });

    if (userPermission) {
      if (userPermission[actionField as keyof typeof userPermission] === true) {
        return true;
      }

      throw new ForbiddenException(
        `You do not have permission to perform '${action}' on '${entity}'`,
      );
    }

    // Check permissions granted through the user's role (operation claim),
    // but only for role assignments scoped to the same tenant.
    const rolePermission = await this.prisma.roleEntityPermission.findFirst({
      where: {
        operationClaim: {
          userClaims: {
            some: {
              userId: user.id,
              OR: [
                { tenantId: effectiveTenantId },
                { tenantId: null },
              ],
            },
          },
        },
        entityName: entity,
      },
    });

    if (rolePermission) {
      if (rolePermission[actionField as keyof typeof rolePermission] === true) {
        return true;
      }
    }

    throw new ForbiddenException(
      `You do not have permission to perform '${action}' on '${entity}'`,
    );
  }
}
