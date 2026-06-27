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

    // SuperAdmin bypasses all permission checks
    if (user.isSuperAdmin) {
      return true;
    }

    const { entity, action } = requiredPermission;
    const actionField = `can${action.charAt(0).toUpperCase()}${action.slice(1).toLowerCase()}`;

    if (!['canCreate', 'canRead', 'canUpdate', 'canDelete'].includes(actionField)) {
      throw new ForbiddenException(`Unsupported permission action '${action}'`);
    }

    const tenantPermission = user.tenantId
      ? await this.prisma.userEntityPermission.findFirst({
          where: {
            userId: user.id,
            entityName: entity,
            tenantId: user.tenantId,
          },
        })
      : null;

    const permission = tenantPermission ?? (await this.prisma.userEntityPermission.findFirst({
      where: {
        userId: user.id,
        entityName: entity,
        tenantId: null,
      },
    }));

    if (permission) {
      if (permission[actionField as keyof typeof permission] === true) {
        return true;
      }

      throw new ForbiddenException(
        `You do not have permission to perform '${action}' on '${entity}'`,
      );
    }

    // Check entity permissions granted through the user's operation claims.
    const rolePermission = await this.prisma.roleEntityPermission.findFirst({
      where: {
        operationClaim: {
          userClaims: {
            some: {
              userId: user.id,
              OR: [
                { tenantId: user.tenantId ?? null },
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
