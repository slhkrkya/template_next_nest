import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { NOTIFICATION_REPOSITORY, INotificationRepository } from '../../domain/notification.repository.interface'
import { MarkAllReadCommand } from '../mark-all-read.command'

@Injectable()
@CommandHandler(MarkAllReadCommand)
export class MarkAllReadHandler implements ICommandHandler<MarkAllReadCommand> {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: INotificationRepository,
  ) {}

  async execute(command: MarkAllReadCommand) {
    await this.notifications.markAllReadByUser(command.userId, command.tenantId)
  }
}
