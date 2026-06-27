export interface EntityWorkflowProps {
  id: string
  tenantId: string
  entityName: string
  name: string
  description: string | null
  definition: Record<string, unknown>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
export class EntityWorkflowEntity {
  constructor(private readonly props: EntityWorkflowProps) {}
  get id() { return this.props.id }
  get tenantId() { return this.props.tenantId }
  get entityName() { return this.props.entityName }
  get name() { return this.props.name }
  get definition() { return this.props.definition }
  get isActive() { return this.props.isActive }
  toPlain(): EntityWorkflowProps { return { ...this.props } }
}
