import { BaseTimestampedEntityProps } from '../../../core/domain/base-entity.props'

export interface RoleProps extends BaseTimestampedEntityProps {
  name: string
  description: string | null
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
  toJSON(): RoleProps { return { ...this.props } }
}
