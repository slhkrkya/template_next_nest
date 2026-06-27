import { NotificationEntity, NotificationProps } from './notification.entity'

export interface FindNotificationsOptions {
  page?: number
  pageSize?: number
  unreadOnly?: boolean
  tenantId?: string
}

export interface PaginatedNotifications {
  data: NotificationEntity[]
  total: number
}

export const NOTIFICATION_REPOSITORY = Symbol('INotificationRepository')

export interface INotificationRepository {
  findById(id: string): Promise<NotificationEntity | null>
  findByUser(userId: string, options: FindNotificationsOptions): Promise<PaginatedNotifications>
  create(data: Omit<NotificationProps, 'id' | 'createdAt' | 'isRead' | 'readAt'> & { id?: string }): Promise<NotificationEntity>
  markAsRead(id: string): Promise<NotificationEntity>
  markAllReadByUser(userId: string, tenantId?: string): Promise<void>
  deleteMany(ids: string[]): Promise<void>
  deleteManyByUser(ids: string[], userId: string): Promise<number>
}
