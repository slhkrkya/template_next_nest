import { BaseEntityProps } from '../../../core/domain/base-entity.props'

export interface RateLimitViolationProps extends BaseEntityProps {
  ipAddress: string
  endpoint: string
  requestCount: number
  windowStart: Date
  isDismissed: boolean
  dismissedBy: string | null
  tenantId: string | null
}

export class RateLimitViolationEntity {
  constructor(private readonly props: RateLimitViolationProps) {}
  get id() { return this.props.id }
  get ipAddress() { return this.props.ipAddress }
  get endpoint() { return this.props.endpoint }
  get requestCount() { return this.props.requestCount }
  get isDismissed() { return this.props.isDismissed }
  get createdAt() { return this.props.createdAt }
  toPlain(): RateLimitViolationProps { return { ...this.props } }
  toJSON(): RateLimitViolationProps { return { ...this.props } }
}
