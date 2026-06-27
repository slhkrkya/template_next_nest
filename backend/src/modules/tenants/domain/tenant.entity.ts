export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'

export interface TenantProps {
  id: string
  name: string
  slug: string
  logoPath: string | null
  status: TenantStatus
  trialEndsAt: Date | null
  maxUsers: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class TenantEntity {
  constructor(private readonly props: TenantProps) {}
  get id() { return this.props.id }
  get name() { return this.props.name }
  get slug() { return this.props.slug }
  get logoPath() { return this.props.logoPath }
  get status() { return this.props.status }
  get trialEndsAt() { return this.props.trialEndsAt }
  get maxUsers() { return this.props.maxUsers }
  get isActive() { return this.props.isActive }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }
  activate() { this.props.status = 'ACTIVE'; this.props.isActive = true }
  suspend() { this.props.status = 'SUSPENDED'; this.props.isActive = false }
  toPlain(): TenantProps { return { ...this.props } }
}
