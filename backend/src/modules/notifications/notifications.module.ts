import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from '../../prisma/prisma.module'
import { WebsocketsModule } from '../websockets/websockets.module'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { NOTIFICATION_REPOSITORY } from './domain/notification.repository.interface'
import { PrismaNotificationRepository } from './infrastructure/prisma-notification.repository'
import { CreateNotificationHandler } from './commands/handlers/create-notification.handler'
import { MarkAsReadHandler } from './commands/handlers/mark-as-read.handler'
import { MarkAllReadHandler } from './commands/handlers/mark-all-read.handler'
import { BulkDeleteNotificationsHandler } from './commands/handlers/bulk-delete-notifications.handler'
import { GetMyNotificationsHandler } from './queries/handlers/get-my-notifications.handler'

const CommandHandlers = [CreateNotificationHandler, MarkAsReadHandler, MarkAllReadHandler, BulkDeleteNotificationsHandler]
const QueryHandlers = [GetMyNotificationsHandler]

@Module({
  imports: [CqrsModule, PrismaModule, WebsocketsModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
