import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../types';

type PermissionAction = 'Create' | 'Read' | 'Update' | 'Delete';

@Injectable()
export class PermissionCheckerService {
  constructor(private readonly prisma: PrismaService) {}

  async check(
    user: AuthenticatedUser,
    entity: string,
    action: PermissionAction,
  ): Promise<void> {
    if (user.isSuperAdmin) return;

    const actionField = `can${action}` as const;

    const tenantPermission = user.tenantId
      ? await this.prisma.userEntityPermission.findFirst({
          where: { userId: user.id, entityName: entity, tenantId: user.tenantId },
        })
      : null;

    const userPermission =
      tenantPermission ??
      (await this.prisma.userEntityPermission.findFirst({
        where: { userId: user.id, entityName: entity, tenantId: null },
      }));

    if (userPermission) {
      if (userPermission[actionField as keyof typeof userPermission] === true) return;
      throw new ForbiddenException(
        `You do not have permission to perform '${action}' on '${entity}'`,
      );
    }

    const rolePermission = await this.prisma.roleEntityPermission.findFirst({
      where: {
        operationClaim: {
          userClaims: {
            some: {
              userId: user.id,
              OR: [{ tenantId: user.tenantId ?? null }, { tenantId: null }],
            },
          },
        },
        entityName: entity,
      },
    });

    if (rolePermission?.[actionField as keyof typeof rolePermission] === true) return;

    throw new ForbiddenException(
      `You do not have permission to perform '${action}' on '${entity}'`,
    );
  }
}
