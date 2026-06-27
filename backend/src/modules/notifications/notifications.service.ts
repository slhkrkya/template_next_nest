import { Injectable } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { PagedResult } from '../../common/types'
import {
  CreateNotificationCommand,
  MarkAsReadCommand,
  MarkAllReadCommand,
  BulkDeleteNotificationsCommand,
} from './commands'
import { GetMyNotificationsQuery } from './queries'
import { PaginationDto } from '../../common/dto/pagination.dto'

export class NotificationsQueryDto extends PaginationDto {
  isRead?: boolean
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async getMyNotifications(
    userId: string,
    tenantId: string | null | undefined,
    query: NotificationsQueryDto,
  ): Promise<PagedResult<any>> {
    return this.queryBus.execute(
      new GetMyNotificationsQuery(userId, tenantId, query),
    )
  }

  async create(dto: CreateNotificationDto): Promise<any> {
    return this.commandBus.execute(new CreateNotificationCommand(dto))
  }

  async markAsRead(id: string, userId: string): Promise<any> {
    return this.commandBus.execute(new MarkAsReadCommand(id, userId))
  }

  async markAllRead(
    userId: string,
    tenantId?: string | null,
  ): Promise<{ count: number }> {
    return this.commandBus.execute(new MarkAllReadCommand(userId, tenantId))
  }

  async bulkDelete(
    ids: string[],
    userId: string,
  ): Promise<{ count: number }> {
    return this.commandBus.execute(
      new BulkDeleteNotificationsCommand(ids, userId),
    )
  }
}
