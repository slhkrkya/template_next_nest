import { BaseTimestampedEntityProps } from '../../../core/domain/base-entity.props'

export interface UserEntityPermissionProps extends BaseTimestampedEntityProps {
  userId: string
  tenantId: string | null
  entityName: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

export class UserEntityPermissionEntity {
  constructor(private readonly props: UserEntityPermissionProps) {}
  get id() { return this.props.id }
  get userId() { return this.props.userId }
  get tenantId() { return this.props.tenantId }
  get entityName() { return this.props.entityName }
  get canCreate() { return this.props.canCreate }
  get canRead() { return this.props.canRead }
  get canUpdate() { return this.props.canUpdate }
  get canDelete() { return this.props.canDelete }
  toPlain(): UserEntityPermissionProps { return { ...this.props } }
  toJSON(): UserEntityPermissionProps { return { ...this.props } }
}

export interface RoleEntityPermissionProps extends BaseTimestampedEntityProps {
  operationClaimId: string
  entityName: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

export class RoleEntityPermissionEntity {
  constructor(private readonly props: RoleEntityPermissionProps) {}
  get id() { return this.props.id }
  get operationClaimId() { return this.props.operationClaimId }
  get entityName() { return this.props.entityName }
  get canCreate() { return this.props.canCreate }
  get canRead() { return this.props.canRead }
  get canUpdate() { return this.props.canUpdate }
  get canDelete() { return this.props.canDelete }
  toPlain(): RoleEntityPermissionProps { return { ...this.props } }
  toJSON(): RoleEntityPermissionProps { return { ...this.props } }
}
