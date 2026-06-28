import { BaseSoftDeletableEntityProps } from '../../../core/domain/base-entity.props'

export interface UserProps extends BaseSoftDeletableEntityProps {
  email: string
  firstName: string
  lastName: string
  passwordHash: string
  isSuperAdmin: boolean
  tenantId: string | null
  role?: string
}

export class UserEntity {
  private readonly props: UserProps

  constructor(props: UserProps) {
    this.props = props
  }

  get id() { return this.props.id }
  get email() { return this.props.email }
  get firstName() { return this.props.firstName }
  get lastName() { return this.props.lastName }
  get passwordHash() { return this.props.passwordHash }
  get isActive() { return this.props.isActive }
  get isSuperAdmin() { return this.props.isSuperAdmin }
  get tenantId() { return this.props.tenantId }
  get role() { return this.props.role }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }
  get fullName() { return `${this.props.firstName} ${this.props.lastName}` }

  deactivate(): void { this.props.isActive = false }
  activate(): void { this.props.isActive = true }

  toPlain(): UserProps { return { ...this.props } }
  toJSON(): Omit<UserProps, 'passwordHash'> {
    const { passwordHash: _, ...rest } = this.props
    return rest
  }
}
