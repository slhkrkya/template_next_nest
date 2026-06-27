export type NotifType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'

export interface NotificationProps {
  id: string
  title: string
  message: string
  type: NotifType
  isRead: boolean
  readAt: Date | null
  link: string | null
  userId: string
  tenantId: string | null
  createdAt: Date
}

export class NotificationEntity {
  private readonly props: NotificationProps

  constructor(props: NotificationProps) {
    this.props = props
  }

  get id() { return this.props.id }
  get title() { return this.props.title }
  get message() { return this.props.message }
  get type() { return this.props.type }
  get isRead() { return this.props.isRead }
  get readAt() { return this.props.readAt }
  get link() { return this.props.link }
  get userId() { return this.props.userId }
  get tenantId() { return this.props.tenantId }
  get createdAt() { return this.props.createdAt }

  markAsRead(): void {
    this.props.isRead = true
    this.props.readAt = new Date()
  }

  toPlain(): NotificationProps { return { ...this.props } }
}
