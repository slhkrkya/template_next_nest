import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Injectable, ForbiddenException, Inject } from '@nestjs/common'
import { INotificationRepository, NOTIFICATION_REPOSITORY } from '../../domain/notification.repository.interface'
import { BulkDeleteNotificationsCommand } from '../bulk-delete-notifications.command'

@Injectable()
@CommandHandler(BulkDeleteNotificationsCommand)
export class BulkDeleteNotificationsHandler
  implements ICommandHandler<BulkDeleteNotificationsCommand>
{
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: INotificationRepository,
  ) {}

  async execute(command: BulkDeleteNotificationsCommand): Promise<{ count: number }> {
    const { ids, userId } = command
    const count = await this.notifications.deleteManyByUser(ids, userId)
    if (count !== ids.length) {
      throw new ForbiddenException('Some notifications do not belong to you or do not exist')
    }
    return { count }
  }
}
