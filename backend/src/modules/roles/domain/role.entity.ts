export interface RoleProps {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export class RoleEntity {
  private readonly props: RoleProps

  constructor(props: RoleProps) {
    this.props = props
  }

  get id() { return this.props.id }
  get name() { return this.props.name }
  get description() { return this.props.description }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }

  toPlain(): RoleProps { return { ...this.props } }
}
