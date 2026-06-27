import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { NOTIFICATION_REPOSITORY, INotificationRepository } from '../../domain/notification.repository.interface'
import { GetMyNotificationsQuery } from '../get-my-notifications.query'

@Injectable()
@QueryHandler(GetMyNotificationsQuery)
export class GetMyNotificationsHandler implements IQueryHandler<GetMyNotificationsQuery> {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: INotificationRepository,
  ) {}

  async execute(query: GetMyNotificationsQuery) {
    const result = await this.notifications.findByUser(query.userId, {
      page: query.queryDto?.page,
      pageSize: query.queryDto?.pageSize,
      unreadOnly: query.queryDto?.isRead === false ? true : undefined,
      tenantId: query.tenantId ?? undefined,
    })

    return {
      data: result.data.map(n => n.toPlain()),
      total: result.total,
    }
  }
}
