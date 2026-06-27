import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import { Injectable, Inject } from '@nestjs/common'
import { NOTIFICATION_REPOSITORY, INotificationRepository } from '../../domain/notification.repository.interface'
import { NotificationsGateway } from '../../../websockets/notifications.gateway'
import { CreateNotificationCommand } from '../create-notification.command'
import { NotificationCreatedEvent } from '../../domain/events/notification-created.event'

@Injectable()
@CommandHandler(CreateNotificationCommand)
export class CreateNotificationHandler implements ICommandHandler<CreateNotificationCommand> {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: INotificationRepository,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateNotificationCommand) {
    const { dto } = command

    const notification = await this.notifications.create({
      title: dto.title,
      message: dto.message,
      type: (dto.type ?? 'INFO') as any,
      userId: dto.userId,
      tenantId: dto.tenantId ?? null,
      link: dto.link ?? null,
    })

    this.eventBus.publish(new NotificationCreatedEvent(notification.id, notification.userId, notification.tenantId))

    try {
      this.notificationsGateway.sendNotification(notification.userId, notification.toPlain())
    } catch { /* socket delivery is best-effort */ }

    return notification.toPlain()
  }
}
