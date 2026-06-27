import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import { IDataScopeRepository } from '../domain/data-scope.repository.interface'
import { DataScopeEntity, DataScopeProps } from '../domain/data-scope.entity'

@Injectable()
export class PrismaDataScopeRepository implements IDataScopeRepository {
  constructor(private readonly prismaService: PrismaService) {}
  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }
  private toEntity(r: any): DataScopeEntity {
    return new DataScopeEntity({ id: r.id, userId: r.userId, tenantId: r.tenantId ?? null, entityName: r.entityName, scopeType: r.scopeType, createdAt: r.createdAt, updatedAt: r.updatedAt })
  }
  async findByUser(userId: string, tenantId?: string): Promise<DataScopeEntity[]> {
    const data = await this.prisma.userDataScope.findMany({ where: { userId, ...(tenantId ? { tenantId } : {}) } })
    return data.map(r => this.toEntity(r))
  }
  async upsert(data: Omit<DataScopeProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataScopeEntity> {
    const r = await this.prisma.userDataScope.upsert({
      where: { userId_tenantId_entityName: { userId: data.userId, tenantId: data.tenantId ?? null, entityName: data.entityName } },
      create: { id: crypto.randomUUID(), ...data, scopeType: data.scopeType as any },
      update: { scopeType: data.scopeType as any },
    })
    return this.toEntity(r)
  }
  async delete(userId: string, entityName: string, tenantId?: string): Promise<void> {
    await this.prisma.userDataScope.deleteMany({ where: { userId, entityName, ...(tenantId ? { tenantId } : {}) } })
  }
}
