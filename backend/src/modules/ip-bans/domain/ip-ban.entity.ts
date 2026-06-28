import { BaseEntityProps } from '../../../core/domain/base-entity.props'

export interface IpBanProps extends BaseEntityProps {
  ipAddress: string
  reason: string | null
  bannedBy: string | null
  tenantId: string | null
  expiresAt: Date | null
}

export class IpBanEntity {
  constructor(private readonly props: IpBanProps) {}
  get id() { return this.props.id }
  get ipAddress() { return this.props.ipAddress }
  get reason() { return this.props.reason }
  get bannedBy() { return this.props.bannedBy }
  get tenantId() { return this.props.tenantId }
  get expiresAt() { return this.props.expiresAt }
  get createdAt() { return this.props.createdAt }
  isExpired(): boolean { return !!this.props.expiresAt && this.props.expiresAt < new Date() }
  toPlain(): IpBanProps { return { ...this.props } }
  toJSON(): IpBanProps { return { ...this.props } }
}
