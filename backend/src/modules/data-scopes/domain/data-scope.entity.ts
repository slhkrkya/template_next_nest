export type ScopeType = 'SELF' | 'DEPARTMENT' | 'ALL'
export interface DataScopeProps {
  id: string
  userId: string
  tenantId: string | null
  entityName: string
  scopeType: ScopeType
  createdAt: Date
  updatedAt: Date
}
export class DataScopeEntity {
  constructor(private readonly props: DataScopeProps) {}
  get id() { return this.props.id }
  get userId() { return this.props.userId }
  get tenantId() { return this.props.tenantId }
  get entityName() { return this.props.entityName }
  get scopeType() { return this.props.scopeType }
  toPlain(): DataScopeProps { return { ...this.props } }
}
