export interface UserEntityPermissionProps {
  id: string
  userId: string
  tenantId: string | null
  entityName: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
  createdAt: Date
  updatedAt: Date
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
}

export interface RoleEntityPermissionProps {
  id: string
  operationClaimId: string
  entityName: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
  createdAt: Date
  updatedAt: Date
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
}
