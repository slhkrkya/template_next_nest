import { BaseSoftDeletableEntityProps } from '../../../core/domain/base-entity.props'

export interface EmailParametersProps extends BaseSoftDeletableEntityProps {
  tenantId: string
  smtpHost: string
  smtpPort: number
  smtpUser: string | null
  smtpPass: string | null
  fromEmail: string
  fromName: string
}

export class EmailParametersEntity {
  constructor(private readonly props: EmailParametersProps) {}
  get id() { return this.props.id }
  get tenantId() { return this.props.tenantId }
  get smtpHost() { return this.props.smtpHost }
  get smtpPort() { return this.props.smtpPort }
  get fromEmail() { return this.props.fromEmail }
  get fromName() { return this.props.fromName }
  get isActive() { return this.props.isActive }
  toPlain(): EmailParametersProps { return { ...this.props } }
  toJSON(): EmailParametersProps { return { ...this.props } }
}
