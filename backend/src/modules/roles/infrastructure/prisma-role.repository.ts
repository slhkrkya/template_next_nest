import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import { IRoleRepository } from '../domain/role.repository.interface'
import { RoleEntity, RoleProps } from '../domain/role.entity'

@Injectable()
export class PrismaRoleRepository implements IRoleRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }

  private toEntity(raw: any): RoleEntity {
    return new RoleEntity({
      id: raw.id,
      name: raw.name,
      description: raw.description ?? null,
      priority: raw.priority ?? 0,
      userCount: raw._count?.userClaims ?? 0,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  async findById(id: string): Promise<RoleEntity | null> {
    const raw = await this.prisma.operationClaim.findUnique({ where: { id } })
    return raw ? this.toEntity(raw) : null
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    const raw = await this.prisma.operationClaim.findUnique({ where: { name } })
    return raw ? this.toEntity(raw) : null
  }

  async findAll(): Promise<RoleEntity[]> {
    const raw = await this.prisma.operationClaim.findMany({
      where: { name: { not: 'SuperAdmin' } },
      orderBy: { name: 'asc' },
      include: { _count: { select: { userClaims: true } } },
    })
    return raw.map(r => this.toEntity(r))
  }

  async getUsersByRole(roleId: string, tenantId?: string, page = 1, limit = 50): Promise<{ id: string; firstName: string; lastName: string; email: string }[]> {
    const claims = await this.prisma.userOperationClaim.findMany({
      where: {
        operationClaimId: roleId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: { user: true },
      skip: (page - 1) * limit,
      take: limit,
    })
    return claims.map(c => ({
      id: c.user.id,
      firstName: c.user.firstName,
      lastName: c.user.lastName,
      email: c.user.email,
    }))
  }

  async create(data: Omit<RoleProps, 'id' | 'createdAt' | 'updatedAt' | 'userCount'> & { id?: string }): Promise<RoleEntity> {
    const raw = await this.prisma.operationClaim.create({
      data: {
        id: data.id ?? crypto.randomUUID(),
        name: data.name,
        description: data.description,
        priority: data.priority ?? 0,
      },
    })
    return this.toEntity(raw)
  }

  async update(id: string, data: Partial<Pick<RoleProps, 'name' | 'description' | 'priority'>>): Promise<RoleEntity> {
    const raw = await this.prisma.operationClaim.update({ where: { id }, data })
    return this.toEntity(raw)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.operationClaim.delete({ where: { id } })
  }

  async assignToUser(userId: string, roleId: string, tenantId?: string): Promise<void> {
    const exists = await this.prisma.userOperationClaim.findFirst({ where: { userId, operationClaimId: roleId, tenantId: tenantId ?? null } })
    if (!exists) {
      await this.prisma.userOperationClaim.create({ data: { userId, operationClaimId: roleId, tenantId: tenantId ?? null } })
    }
  }

  async removeFromUser(userId: string, roleId: string, tenantId?: string): Promise<void> {
    await this.prisma.userOperationClaim.deleteMany({ where: { userId, operationClaimId: roleId, tenantId: tenantId ?? null } })
  }
}
