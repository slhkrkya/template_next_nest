import { BaseTimestampedEntityProps } from '../../../core/domain/base-entity.props'

export type ScopeType = 'SELF' | 'DEPARTMENT' | 'ALL'

export interface DataScopeProps extends BaseTimestampedEntityProps {
  userId: string
  tenantId: string | null
  entityName: string
  scopeType: ScopeType
}

export class DataScopeEntity {
  constructor(private readonly props: DataScopeProps) {}
  get id() { return this.props.id }
  get userId() { return this.props.userId }
  get tenantId() { return this.props.tenantId }
  get entityName() { return this.props.entityName }
  get scopeType() { return this.props.scopeType }
  toPlain(): DataScopeProps { return { ...this.props } }
  toJSON(): DataScopeProps { return { ...this.props } }
}
