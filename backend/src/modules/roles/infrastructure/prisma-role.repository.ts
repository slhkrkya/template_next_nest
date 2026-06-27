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

  async findAll(tenantId?: string): Promise<RoleEntity[]> {
    const raw = await this.prisma.operationClaim.findMany({ orderBy: { name: 'asc' } })
    return raw.map(r => this.toEntity(r))
  }

  async create(data: Omit<RoleProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<RoleEntity> {
    const raw = await this.prisma.operationClaim.create({
      data: {
        id: data.id ?? crypto.randomUUID(),
        name: data.name,
        description: data.description,
      },
    })
    return this.toEntity(raw)
  }

  async update(id: string, data: Partial<Pick<RoleProps, 'name' | 'description'>>): Promise<RoleEntity> {
    const raw = await this.prisma.operationClaim.update({ where: { id }, data })
    return this.toEntity(raw)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.operationClaim.delete({ where: { id } })
  }

  async assignToUser(userId: string, roleId: string): Promise<void> {
    const exists = await this.prisma.userOperationClaim.findFirst({ where: { userId, operationClaimId: roleId } })
    if (!exists) {
      await this.prisma.userOperationClaim.create({ data: { userId, operationClaimId: roleId } })
    }
  }

  async removeFromUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userOperationClaim.deleteMany({ where: { userId, operationClaimId: roleId } })
  }
}
