export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
export type SubStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL'

export interface SubscriptionPlanProps {
  id: string
  name: string
  displayName: string
  description: string | null
  maxUsers: number
  maxStorageBytes: bigint
  monthlyPrice: number
  yearlyPrice: number
  quarterlyPrice: number | null
  features: Record<string, unknown>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class SubscriptionPlanEntity {
  constructor(private readonly props: SubscriptionPlanProps) {}
  get id() { return this.props.id }
  get name() { return this.props.name }
  get displayName() { return this.props.displayName }
  get description() { return this.props.description }
  get maxUsers() { return this.props.maxUsers }
  get isActive() { return this.props.isActive }
  toPlain(): SubscriptionPlanProps { return { ...this.props } }
}
