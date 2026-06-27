import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { NOTIFICATION_REPOSITORY, INotificationRepository } from '../../domain/notification.repository.interface'
import { MarkAsReadCommand } from '../mark-as-read.command'

@Injectable()
@CommandHandler(MarkAsReadCommand)
export class MarkAsReadHandler implements ICommandHandler<MarkAsReadCommand> {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: INotificationRepository,
  ) {}

  async execute(command: MarkAsReadCommand) {
    return (await this.notifications.markAsRead(command.id)).toPlain()
  }
}
