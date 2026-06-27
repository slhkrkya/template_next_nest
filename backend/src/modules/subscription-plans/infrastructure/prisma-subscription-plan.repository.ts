import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import { ISubscriptionPlanRepository } from '../domain/subscription-plan.repository.interface'
import { SubscriptionPlanEntity, SubscriptionPlanProps } from '../domain/subscription-plan.entity'

@Injectable()
export class PrismaSubscriptionPlanRepository implements ISubscriptionPlanRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }

  private toEntity(r: any): SubscriptionPlanEntity {
    return new SubscriptionPlanEntity({
      id: r.id, name: r.name, displayName: r.displayName,
      description: r.description ?? null, maxUsers: r.maxUsers,
      maxStorageBytes: r.maxStorageBytes, monthlyPrice: Number(r.monthlyPrice),
      yearlyPrice: Number(r.yearlyPrice), quarterlyPrice: r.quarterlyPrice ? Number(r.quarterlyPrice) : null,
      features: r.features as any, isActive: r.isActive,
      createdAt: r.createdAt, updatedAt: r.updatedAt,
    })
  }

  async findById(id: string): Promise<SubscriptionPlanEntity | null> {
    const r = await this.prisma.subscriptionPlan.findUnique({ where: { id } })
    return r ? this.toEntity(r) : null
  }

  async findAll(): Promise<SubscriptionPlanEntity[]> {
    const data = await this.prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { monthlyPrice: 'asc' } })
    return data.map(r => this.toEntity(r))
  }

  async create(data: Omit<SubscriptionPlanProps, 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlanEntity> {
    const r = await this.prisma.subscriptionPlan.create({ data: { ...data, features: data.features as any } })
    return this.toEntity(r)
  }

  async update(id: string, data: Partial<SubscriptionPlanProps>): Promise<SubscriptionPlanEntity> {
    const r = await this.prisma.subscriptionPlan.update({ where: { id }, data: { ...data, features: data.features as any } })
    return this.toEntity(r)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.subscriptionPlan.delete({ where: { id } })
  }
}
