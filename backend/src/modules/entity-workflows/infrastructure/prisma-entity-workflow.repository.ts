import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import { IEntityWorkflowRepository } from '../domain/entity-workflow.repository.interface'
import { EntityWorkflowEntity, EntityWorkflowProps } from '../domain/entity-workflow.entity'

@Injectable()
export class PrismaEntityWorkflowRepository implements IEntityWorkflowRepository {
  constructor(private readonly prismaService: PrismaService) {}
  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }
  private toEntity(r: any): EntityWorkflowEntity {
    return new EntityWorkflowEntity({ id: r.id, tenantId: r.tenantId, entityName: r.entityName, name: r.name, description: r.description ?? null, definition: r.definition as any, isActive: r.isActive, createdAt: r.createdAt, updatedAt: r.updatedAt })
  }
  async findByTenant(tenantId: string): Promise<EntityWorkflowEntity[]> {
    const data = await this.prisma.entityWorkflow.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } })
    return data.map(r => this.toEntity(r))
  }
  async findById(id: string): Promise<EntityWorkflowEntity | null> {
    const r = await this.prisma.entityWorkflow.findUnique({ where: { id } })
    return r ? this.toEntity(r) : null
  }
  async create(data: Omit<EntityWorkflowProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<EntityWorkflowEntity> {
    const r = await this.prisma.entityWorkflow.create({ data: { id: crypto.randomUUID(), ...data, definition: data.definition as any } })
    return this.toEntity(r)
  }
  async update(id: string, data: Partial<EntityWorkflowProps>): Promise<EntityWorkflowEntity> {
    const r = await this.prisma.entityWorkflow.update({ where: { id }, data: { ...data, definition: data.definition as any } })
    return this.toEntity(r)
  }
  async delete(id: string): Promise<void> { await this.prisma.entityWorkflow.delete({ where: { id } }) }
}
