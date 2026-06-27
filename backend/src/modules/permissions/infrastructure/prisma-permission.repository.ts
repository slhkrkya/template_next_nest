import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import { IPermissionRepository } from '../domain/permission.repository.interface'
import { UserEntityPermissionEntity, RoleEntityPermissionEntity } from '../domain/permission.entity'

@Injectable()
export class PrismaPermissionRepository implements IPermissionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }

  private toUserEntity(raw: any): UserEntityPermissionEntity {
    return new UserEntityPermissionEntity({
      id: raw.id, userId: raw.userId, tenantId: raw.tenantId ?? null,
      entityName: raw.entityName, canCreate: raw.canCreate, canRead: raw.canRead,
      canUpdate: raw.canUpdate, canDelete: raw.canDelete,
      createdAt: raw.createdAt, updatedAt: raw.updatedAt,
    })
  }

  private toRoleEntity(raw: any): RoleEntityPermissionEntity {
    return new RoleEntityPermissionEntity({
      id: raw.id, operationClaimId: raw.operationClaimId,
      entityName: raw.entityName, canCreate: raw.canCreate, canRead: raw.canRead,
      canUpdate: raw.canUpdate, canDelete: raw.canDelete,
      createdAt: raw.createdAt, updatedAt: raw.updatedAt,
    })
  }

  async findUserPermissions(userId: string, tenantId?: string): Promise<UserEntityPermissionEntity[]> {
    const data = await this.prisma.userEntityPermission.findMany({
      where: { userId, ...(tenantId ? { tenantId } : {}) },
    })
    return data.map(r => this.toUserEntity(r))
  }

  async upsertUserPermission(data: any): Promise<UserEntityPermissionEntity> {
    const raw = await this.prisma.userEntityPermission.upsert({
      where: { userId_tenantId_entityName: { userId: data.userId, tenantId: data.tenantId ?? null, entityName: data.entityName } },
      create: { ...data, id: crypto.randomUUID() },
      update: { canCreate: data.canCreate, canRead: data.canRead, canUpdate: data.canUpdate, canDelete: data.canDelete },
    })
    return this.toUserEntity(raw)
  }

  async deleteUserPermissions(ids: string[]): Promise<{ count: number }> {
    const result = await this.prisma.userEntityPermission.deleteMany({
      where: { id: { in: ids } },
    })
    return { count: result.count }
  }

  async findRolePermissions(operationClaimId: string): Promise<RoleEntityPermissionEntity[]> {
    const data = await this.prisma.roleEntityPermission.findMany({ where: { operationClaimId } })
    return data.map(r => this.toRoleEntity(r))
  }

  async upsertRolePermission(data: any): Promise<RoleEntityPermissionEntity> {
    const raw = await this.prisma.roleEntityPermission.upsert({
      where: { operationClaimId_entityName: { operationClaimId: data.operationClaimId, entityName: data.entityName } },
      create: { ...data, id: crypto.randomUUID() },
      update: { canCreate: data.canCreate, canRead: data.canRead, canUpdate: data.canUpdate, canDelete: data.canDelete },
    })
    return this.toRoleEntity(raw)
  }

  async deleteRolePermissions(ids: string[]): Promise<{ count: number }> {
    const result = await this.prisma.roleEntityPermission.deleteMany({
      where: { id: { in: ids } },
    })
    return { count: result.count }
  }

  async syncRolePermissionsToUser(operationClaimId: string, userId: string, tenantId?: string): Promise<void> {
    const rolePerms = await this.prisma.roleEntityPermission.findMany({ where: { operationClaimId } })
    if (rolePerms.length === 0) return

    const entityNames = rolePerms.map(rp => rp.entityName)
    const resolvedTenantId = tenantId ?? null

    // deleteMany + createMany: 2 queries instead of N upserts
    await this.prisma.userEntityPermission.deleteMany({
      where: { userId, tenantId: resolvedTenantId, entityName: { in: entityNames } },
    })

    await this.prisma.userEntityPermission.createMany({
      data: rolePerms.map(rp => ({
        id: crypto.randomUUID(),
        userId,
        tenantId: resolvedTenantId,
        entityName: rp.entityName,
        canCreate: rp.canCreate,
        canRead: rp.canRead,
        canUpdate: rp.canUpdate,
        canDelete: rp.canDelete,
      })),
      skipDuplicates: true,
    })
  }

  async findAllEntities(): Promise<{ name: string; displayName: string }[]> {
    const data = await this.prisma.permissionEntity.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } })
    return data.map(e => ({ name: e.name, displayName: e.displayName }))
  }

  async findEntityByName(name: string): Promise<{ name: string; displayName: string } | null> {
    const entity = await this.prisma.permissionEntity.findUnique({ where: { name } })
    if (!entity) return null
    return { name: entity.name, displayName: entity.displayName }
  }

  async getEffectivePermissions(userId: string, tenantId?: string): Promise<UserEntityPermissionEntity[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return []

    if (user.isSuperAdmin) {
      const entities = await this.prisma.permissionEntity.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      })
      const now = new Date()
      return entities.map((entity) => new UserEntityPermissionEntity({
        id: entity.id,
        userId,
        tenantId: tenantId ?? null,
        entityName: entity.name,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        createdAt: now,
        updatedAt: now,
      }))
    }

    const rolePermissions = await this.prisma.roleEntityPermission.findMany({
      where: {
        operationClaim: {
          userClaims: {
            some: {
              userId,
              OR: [
                { tenantId: tenantId ?? null },
                { tenantId: null },
              ],
            },
          },
        },
      },
    })

    const effective = new Map<string, UserEntityPermissionEntity>()

    for (const permission of rolePermissions) {
      const current = effective.get(permission.entityName)?.toPlain()
      effective.set(permission.entityName, new UserEntityPermissionEntity({
        id: permission.id,
        userId,
        tenantId: tenantId ?? null,
        entityName: permission.entityName,
        canCreate: (current?.canCreate ?? false) || permission.canCreate,
        canRead: (current?.canRead ?? false) || permission.canRead,
        canUpdate: (current?.canUpdate ?? false) || permission.canUpdate,
        canDelete: (current?.canDelete ?? false) || permission.canDelete,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      }))
    }

    const userPermissions = await this.prisma.userEntityPermission.findMany({
      where: {
        userId,
        OR: [
          { tenantId: tenantId ?? null },
          { tenantId: null },
        ],
      },
    })

    const orderedUserPermissions = [
      ...userPermissions.filter((permission) => permission.tenantId === null),
      ...userPermissions.filter((permission) => permission.tenantId !== null),
    ]

    for (const permission of orderedUserPermissions) {
      effective.set(permission.entityName, this.toUserEntity(permission))
    }

    return Array.from(effective.values())
  }
}
