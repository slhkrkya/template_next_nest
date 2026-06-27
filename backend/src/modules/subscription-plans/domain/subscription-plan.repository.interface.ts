import { SubscriptionPlanEntity, SubscriptionPlanProps } from './subscription-plan.entity'

export const SUBSCRIPTION_PLAN_REPOSITORY = Symbol('ISubscriptionPlanRepository')

export interface ISubscriptionPlanRepository {
  findById(id: string): Promise<SubscriptionPlanEntity | null>
  findAll(): Promise<SubscriptionPlanEntity[]>
  create(data: Omit<SubscriptionPlanProps, 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlanEntity>
  update(id: string, data: Partial<SubscriptionPlanProps>): Promise<SubscriptionPlanEntity>
  delete(id: string): Promise<void>
}
