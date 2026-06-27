import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import { INotificationRepository, FindNotificationsOptions, PaginatedNotifications } from '../domain/notification.repository.interface'
import { NotificationEntity, NotificationProps, NotifType } from '../domain/notification.entity'

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }

  private toEntity(raw: any): NotificationEntity {
    return new NotificationEntity({
      id: raw.id,
      title: raw.title,
      message: raw.message,
      type: raw.type as NotifType,
      isRead: raw.isRead,
      readAt: raw.readAt ?? null,
      link: raw.link ?? null,
      userId: raw.userId,
      tenantId: raw.tenantId ?? null,
      createdAt: raw.createdAt,
    })
  }

  async findById(id: string): Promise<NotificationEntity | null> {
    const raw = await this.prisma.notification.findUnique({ where: { id } })
    return raw ? this.toEntity(raw) : null
  }

  async findByUser(userId: string, options: FindNotificationsOptions): Promise<PaginatedNotifications> {
    const { page = 1, pageSize = 20, unreadOnly, tenantId } = options
    const skip = (page - 1) * pageSize

    const where: any = { userId }
    if (unreadOnly) where.isRead = false
    if (tenantId) where.tenantId = tenantId

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
    ])

    return { data: data.map(r => this.toEntity(r)), total }
  }

  async create(data: Omit<NotificationProps, 'id' | 'createdAt' | 'isRead' | 'readAt'> & { id?: string }): Promise<NotificationEntity> {
    const raw = await this.prisma.notification.create({
      data: {
        id: data.id ?? crypto.randomUUID(),
        title: data.title,
        message: data.message,
        type: data.type as any,
        userId: data.userId,
        tenantId: data.tenantId,
        link: data.link,
        isRead: false,
      },
    })
    return this.toEntity(raw)
  }

  async markAsRead(id: string): Promise<NotificationEntity> {
    const raw = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    })
    return this.toEntity(raw)
  }

  async markAllReadByUser(userId: string, tenantId?: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, ...(tenantId ? { tenantId } : {}), isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.prisma.notification.deleteMany({ where: { id: { in: ids } } })
  }

  async deleteManyByUser(ids: string[], userId: string): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: { id: { in: ids }, userId },
    })
    return result.count
  }
}
